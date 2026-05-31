import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import methodOverride from 'method-override';
import session from 'express-session';
import path from 'path';
import bcrypt from 'bcryptjs';

import { prisma } from './lib/prisma';
import { signToken, verifyToken } from './lib/jwt';

// API routes
import authRouter from './routes/auth';
import meRouter from './routes/me';
import siteContentRouter from './routes/siteContent';
import activitiesRouter from './routes/activities';
import scheduleRouter from './routes/schedule';
import registrationsRouter from './routes/registrations';
import contactRouter from './routes/contact';
import announcementsRouter from './routes/announcements';

// Admin API routes
import {
  statsRouter, usersRouter, registrationsRouter as adminRegistrationsRouter,
  siteContentRouter as adminSiteContentRouter, activitiesRouter as adminActivitiesRouter,
  scheduleRouter as adminScheduleRouter, contactMessagesRouter, announcementsRouter as adminAnnouncementsRouter,
} from './routes/admin/index';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');
const isProd = process.env.NODE_ENV === 'production';

// Security
app.use(helmet({ contentSecurityPolicy: false }));

// General rate limit — 1000 requests per 15 min per IP (covers SSR page loads, hot-reload, etc.)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false }));

// Stricter limit for auth routes — 30 attempts per 15 min (brute-force protection)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts. Please try again in 15 minutes.' } });
app.use('/api/auth', authLimiter);

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:60001',
  'https://nagartayouthcamp.netlify.app',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (!isProd) return callback(null, true); // allow all in dev
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Serve shared static assets (logo, etc.)
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));

// Session — use PostgreSQL store in production, memory in dev
// connect-pg-simple is only required when actually needed (production) to avoid
// module-not-found errors during local development if the package is missing.
const sessionStore = (isProd && process.env.DATABASE_URL)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ? new (require('connect-pg-simple')(session))({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
    })
  : undefined;

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProd, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 },
}));

// EJS views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'src', 'views'));

// ── Public REST API ──────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/site-content', siteContentRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/contact-messages', contactRouter);
app.use('/api/announcements', announcementsRouter);

// ── Admin REST API ───────────────────────────────────────────────────────────
app.use('/api/admin/stats', statsRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/admin/registrations', adminRegistrationsRouter);
app.use('/api/admin/site-content', adminSiteContentRouter);
app.use('/api/admin/activities', adminActivitiesRouter);
app.use('/api/admin/schedule', adminScheduleRouter);
app.use('/api/admin/contact-messages', contactMessagesRouter);
app.use('/api/admin/announcements', adminAnnouncementsRouter);

// ── Admin UI (server-rendered) ────────────────────────────────────────────────
type SessionData = { adminId?: string; adminEmail?: string; adminName?: string };

function requireAdminSession(req: express.Request, res: express.Response, next: express.NextFunction) {
  const s = req.session as unknown as SessionData;
  if (!s.adminId) return res.redirect('/admin/login');
  next();
}

app.get('/admin/login', (req, res) => {
  const s = req.session as unknown as SessionData;
  if (s.adminId) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

app.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'ADMIN' || !(await bcrypt.compare(password, user.password))) {
      return res.render('admin/login', { error: 'Invalid credentials' });
    }
    const s = req.session as unknown as SessionData;
    s.adminId = user.id;
    s.adminEmail = user.email;
    s.adminName = user.name;
    return res.redirect('/admin');
  } catch {
    return res.render('admin/login', { error: 'Something went wrong. Please try again.' });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

app.get('/admin', requireAdminSession, async (_req, res) => {
  try {
    const [totalRegistrations, pendingRegistrations, confirmedRegistrations, totalMessages, recentRegistrations] =
      await Promise.all([
        prisma.registration.count(),
        prisma.registration.count({ where: { status: 'PENDING' } }),
        prisma.registration.count({ where: { status: 'CONFIRMED' } }),
        prisma.contactMessage.count({ where: { resolved: false } }),
        prisma.registration.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } }, child: { select: { name: true } } } }),
      ]);
    const capacity = parseInt((await prisma.siteContent.findUnique({ where: { key: 'camp_capacity' } }))?.value || '200');
    res.render('admin/dashboard', {
      stats: { totalRegistrations, pendingRegistrations, confirmedRegistrations, unreadMessages: totalMessages, spotsRemaining: Math.max(0, capacity - totalRegistrations), capacity, recentRegistrations },
    });
  } catch (e) {
    console.error(e);
    res.status(500).send('Dashboard error. Check server logs.');
  }
});

app.get('/admin/registrations', requireAdminSession, async (_req, res) => {
  const registrations = await prisma.registration.findMany({ include: { user: { select: { name: true, email: true, phone: true } }, child: true }, orderBy: { createdAt: 'desc' } });
  res.render('admin/registrations', { registrations });
});

app.get('/admin/registrations/export', requireAdminSession, async (_req, res) => {
  const { stringify } = await import('csv-stringify/sync');
  const registrations = await prisma.registration.findMany({ include: { user: { select: { name: true, email: true, phone: true } }, child: true }, orderBy: { createdAt: 'desc' } });
  const rows = registrations.map((r) => ({
    Reference: r.referenceCode,
    Type: r.type,
    Status: r.status,
    Payment: r.paymentStatus,
    'Attendee Name': r.child?.name || '',
    'Attendee Age': r.child?.age || '',
    School: r.child?.school || '',
    'Dietary Needs': r.child?.dietaryNeeds || '',
    'Medical Notes': r.child?.medicalNotes || '',
    'Emergency Contact': r.child?.emergencyContact || '',
    'Parent Name': r.parentName || r.user.name || '',
    'Parent Address': r.parentAddress || '',
    'Parent Phone': r.parentPhone || r.user.phone || '',
    'Account Email': r.user.email,
    Notes: r.notes || '',
    Date: r.createdAt.toISOString(),
  }));
  const csv = stringify(rows, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=nagarta-registrations.csv');
  res.send(csv);
});

app.post('/admin/registrations/:id/status', requireAdminSession, async (req, res) => {
  await prisma.registration.update({ where: { id: req.params.id }, data: { status: req.body.status } });
  res.redirect('/admin/registrations');
});

app.post('/admin/registrations/:id/payment', requireAdminSession, async (req, res) => {
  await prisma.registration.update({ where: { id: req.params.id }, data: { paymentStatus: req.body.paymentStatus } });
  res.redirect('/admin/registrations');
});

app.get('/admin/site-content', requireAdminSession, async (_req, res) => {
  const items = await prisma.siteContent.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  res.render('admin/site-content', { items, success: null });
});

app.post('/admin/site-content/:key', requireAdminSession, async (req, res) => {
  await prisma.siteContent.update({ where: { key: req.params.key }, data: { value: req.body.value } });
  const items = await prisma.siteContent.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  res.render('admin/site-content', { items, success: 'Content updated successfully.' });
});

app.get('/admin/activities', requireAdminSession, async (_req, res) => {
  const activities = await prisma.activity.findMany({ orderBy: { displayOrder: 'asc' } });
  res.render('admin/activities', { activities });
});

app.post('/admin/activities/:id', requireAdminSession, async (req, res) => {
  await prisma.activity.update({
    where: { id: req.params.id },
    data: { title: req.body.title, subtitle: req.body.subtitle, iconName: req.body.iconName, displayOrder: parseInt(req.body.displayOrder) || 0 },
  });
  res.redirect('/admin/activities');
});

app.get('/admin/activities/:id/delete', requireAdminSession, async (req, res) => {
  await prisma.activity.delete({ where: { id: req.params.id } });
  res.redirect('/admin/activities');
});

app.get('/admin/schedule', requireAdminSession, async (_req, res) => {
  const days = await prisma.scheduleDay.findMany({ orderBy: { dayNumber: 'asc' } });
  res.render('admin/schedule', { days });
});

app.post('/admin/schedule/:id', requireAdminSession, async (req, res) => {
  await prisma.scheduleDay.update({ where: { id: req.params.id }, data: { title: req.body.title, date: req.body.date, summary: req.body.summary } });
  res.redirect('/admin/schedule');
});

app.get('/admin/messages', requireAdminSession, async (_req, res) => {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  res.render('admin/messages', { messages });
});

app.get('/admin/messages/:id/resolve', requireAdminSession, async (req, res) => {
  await prisma.contactMessage.update({ where: { id: req.params.id }, data: { resolved: true } });
  res.redirect('/admin/messages');
});

app.get('/admin/messages/:id/delete', requireAdminSession, async (req, res) => {
  await prisma.contactMessage.delete({ where: { id: req.params.id } });
  res.redirect('/admin/messages');
});

app.get('/admin/announcements', requireAdminSession, async (_req, res) => {
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  res.render('admin/announcements', { announcements });
});

app.post('/admin/announcements', requireAdminSession, async (req, res) => {
  await prisma.announcement.create({ data: { title: req.body.title, body: req.body.body, published: true, targetRole: req.body.targetRole || null } });
  res.redirect('/admin/announcements');
});

app.get('/admin/announcements/:id/delete', requireAdminSession, async (req, res) => {
  await prisma.announcement.delete({ where: { id: req.params.id } });
  res.redirect('/admin/announcements');
});

app.get('/admin/users', requireAdminSession, async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, phone: true, role: true, suspended: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
  res.render('admin/users', { users });
});

app.post('/admin/users/:id/role', requireAdminSession, async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { role: req.body.role as string } });
  res.redirect('/admin/users');
});

app.get('/admin/users/:id/suspend', requireAdminSession, async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { suspended: true } });
  res.redirect('/admin/users');
});

app.get('/admin/users/:id/unsuspend', requireAdminSession, async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { suspended: false } });
  res.redirect('/admin/users');
});

app.get('/admin/users/:id/delete', requireAdminSession, async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.redirect('/admin/users');
});

// Root redirect
app.get('/', (_req, res) => res.redirect('/admin'));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Reset admin via browser URL (protected)
app.get('/api/reset-admin', async (req, res) => {
  if (req.query.secret !== process.env.RESET_SECRET) return res.status(403).json({ error: 'Forbidden' });
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@campingnagartayouth.com';
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@nagarta!', 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hashed, role: 'ADMIN', name: process.env.ADMIN_NAME || 'Camp Administrator' },
      create: { email, password: hashed, name: process.env.ADMIN_NAME || 'Camp Administrator', role: 'ADMIN' },
    });
    res.json({ success: true, admin: user.email });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`NAGARTA backend running on http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});

export default app;
