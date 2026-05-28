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

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

// CORS — allow frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:60001',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true); // allow all in development; tighten in production
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Serve shared static assets (logo, etc.)
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));

// Session for admin UI
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 },
}));

// EJS views — path works for both dev (src/) and prod (dist/)
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
app.use('/api/my-registrations', (req, res) => res.redirect('/api/registrations/my'));

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

// Admin login page
app.get('/admin/login', (req, res) => {
  const s = req.session as unknown as SessionData;
  if (s.adminId) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

app.post('/admin/login', async (req, res) => {
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
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// Admin dashboard
app.get('/admin', requireAdminSession, async (_req, res) => {
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
});

// Registrations list
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
    'Registered By': r.user.name,
    'User Email': r.user.email,
    'Child Name': r.child?.name || '',
    'Child Age': r.child?.age || '',
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

// Site Content
app.get('/admin/site-content', requireAdminSession, async (_req, res) => {
  const items = await prisma.siteContent.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  res.render('admin/site-content', { items, success: null });
});

app.post('/admin/site-content/:key', requireAdminSession, async (req, res) => {
  await prisma.siteContent.update({ where: { key: req.params.key }, data: { value: req.body.value } });
  const items = await prisma.siteContent.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  res.render('admin/site-content', { items, success: 'Content updated successfully.' });
});

// Activities
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

// Schedule
app.get('/admin/schedule', requireAdminSession, async (_req, res) => {
  const days = await prisma.scheduleDay.findMany({ orderBy: { dayNumber: 'asc' } });
  res.render('admin/schedule', { days });
});

app.post('/admin/schedule/:id', requireAdminSession, async (req, res) => {
  await prisma.scheduleDay.update({ where: { id: req.params.id }, data: { title: req.body.title, date: req.body.date, summary: req.body.summary } });
  res.redirect('/admin/schedule');
});

// Messages
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

// Announcements
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

// Users
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

// Root redirect → admin
app.get('/', (_req, res) => res.redirect('/admin'));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// One-time seed endpoint — protected by secret key
app.post('/api/seed', async (req, res) => {
  const secret = req.headers['x-seed-secret'];
  if (secret !== process.env.SEED_SECRET) return res.status(403).json({ error: 'Forbidden' });
  try {
    const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existing) return res.json({ message: 'Already seeded', admin: existing.email });
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@2026!', 12);
    const admin = await prisma.user.create({
      data: { email: process.env.ADMIN_EMAIL || 'admin@nagartacamp.com', password: hashed, name: process.env.ADMIN_NAME || 'Camp Administrator', role: 'ADMIN' },
    });
    res.json({ message: 'Seeded successfully', admin: admin.email });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`NAGARTA backend running on http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});

export default app;
