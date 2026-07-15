import './loadEnv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import methodOverride from 'method-override';
import session from 'express-session';
import path from 'path';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

import { prisma } from './lib/prisma';
import { signToken, verifyToken } from './lib/jwt';
import { notificationService } from './services/NotificationService';

// API routes
import authRouter from './routes/auth';
import meRouter from './routes/me';
import siteContentRouter from './routes/siteContent';
import activitiesRouter from './routes/activities';
import scheduleRouter from './routes/schedule';
import registrationsRouter from './routes/registrations';
import contactRouter from './routes/contact';
import paystackRouter from './routes/paystack';
import checkinRouter from './routes/checkin';
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

// Trust proxy (Nginx) - required for secure cookies and correct IPs behind reverse proxy
app.set('trust proxy', 1);

// Security
app.use(helmet({ contentSecurityPolicy: false }));

// General rate limit — only enabled in production
if (process.env.NODE_ENV === 'production') {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 5000, standardHeaders: true, legacyHeaders: false }));

  // Stricter limit for auth routes — 100 attempts per 15 min (brute-force protection)
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts. Please try again in 15 minutes.' } });
  app.use('/api/auth', authLimiter);
}

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:60001',
  'https://nagartayouthcamp.netlify.app',
  'https://nagartayouthcamp.tech',
  'https://www.nagartayouthcamp.tech',
  'http://nagartayouthcamp.tech',
  'http://www.nagartayouthcamp.tech',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'null') return callback(null, true); // server-to-server or Electron redirect
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (!isProd) return callback(null, true); // allow all in dev
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({
  limit: '10mb',
  // Capture the raw body so the Paystack webhook can verify its signature
  verify: (req, _res, buf) => { (req as unknown as { rawBody?: Buffer }).rawBody = buf; },
}));
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
  cookie: {
    secure: false, // Set to false because Nginx terminates SSL and forwards as HTTP
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
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
app.use('/api/paystack', paystackRouter);
app.use('/api/checkin', checkinRouter);

// Standalone guardian check-in / check-out station page
app.get('/checkin', (_req, res) => res.render('checkin'));
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
    // Run ALL queries in parallel (was: 6 parallel + 1 sequential = slower)
    const [
      totalRegistrations,
      pendingRegistrations,
      confirmedRegistrations,
      totalMessages,
      recentRegistrations,
      allChildren,
      capacityContent,
    ] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { status: 'PENDING' } }),
      prisma.registration.count({ where: { status: 'CONFIRMED' } }),
      prisma.contactMessage.count({ where: { resolved: false } }),
      prisma.registration.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } }, child: { select: { name: true } } },
      }),
      prisma.child.findMany({ select: { age: true, gender: true, school: true } }),
      prisma.siteContent.findUnique({ where: { key: 'camp_capacity' }, select: { value: true } }),
    ]);
    const capacity = parseInt(capacityContent?.value || '1000');

    // Age statistics — group by individual age
    const ageStats: Record<string, number> = {};
    for (let age = 12; age <= 18; age++) ageStats[age.toString()] = 0;
    allChildren.forEach((c) => {
      if (c.age != null) {
        const key = c.age.toString();
        ageStats[key] = (ageStats[key] || 0) + 1;
      }
    });

    // Gender statistics
    const genderStats: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    allChildren.forEach((c) => {
      const g = c.gender?.trim() || 'Other';
      if (g === 'Male' || g === 'male') genderStats.Male++;
      else if (g === 'Female' || g === 'female') genderStats.Female++;
      else genderStats.Other++;
    });

    // School statistics — top 10 schools
    const schoolCounts: Record<string, number> = {};
    allChildren.forEach((c) => {
      const school = c.school?.trim();
      if (school) schoolCounts[school] = (schoolCounts[school] || 0) + 1;
    });
    const schoolStats = Object.entries(schoolCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [name, count]) => { acc[name] = count; return acc; }, {} as Record<string, number>);

    res.render('admin/dashboard', {
      stats: {
        totalRegistrations,
        pendingRegistrations,
        confirmedRegistrations,
        unreadMessages: totalMessages,
        spotsRemaining: Math.max(0, capacity - totalRegistrations),
        capacity,
        recentRegistrations,
        ageStats,
        genderStats,
        schoolStats,
        totalAttendees: allChildren.length,
      },
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
    'Gender': r.child?.gender || '',
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

// Printable registration form (single registration) — with photo, print/PDF friendly
// Printable camper ID card (standard CR80 portrait size) with the NAGARTA logo
app.get('/admin/registrations/:id/idcard', requireAdminSession, async (req, res) => {
  const reg = await prisma.registration.findUnique({
    where: { id: req.params.id },
    include: { child: true },
  });
  if (!reg) return res.status(404).send('Registration not found');

  // Assign the next camp ID number (1–1000) if this camper doesn't have one yet
  let campId = reg.campId;
  if (campId == null) {
    const max = await prisma.registration.aggregate({ _max: { campId: true } });
    campId = Math.min((max._max.campId || 0) + 1, 1000);
    await prisma.registration.update({ where: { id: reg.id }, data: { campId } });
  }

  const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
  const name = esc(reg.child?.name || 'Camper');
  const photo = reg.child?.photo || '/logo-full.png';
  const meta = reg.child?.gender || '';

  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>ID Card #${campId} — ${name}</title>
  <style>
    @page { size:54mm 85.6mm; margin:0; }
    * { box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-family:-apple-system,Segoe UI,Roboto,sans-serif; display:flex; flex-direction:column; align-items:center; gap:14px; padding:16px; background:#eef; }
    .card { width:54mm; height:85.6mm; border-radius:3mm; overflow:hidden; background:#fff; box-shadow:0 6px 16px rgba(0,0,0,.25); display:flex; flex-direction:column; position:relative; }
    .wm { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:150mm; height:83mm; max-width:none; object-fit:cover; object-position:top center; opacity:.09; z-index:0; pointer-events:none; }
    .card > *:not(.wm) { position:relative; z-index:1; }
    .top { background:#fff; color:#5e3a8c; text-align:center; padding:2.5mm 2mm 1.5mm; }
    .logobox { height:24mm; overflow:hidden; }
    .logobox img { display:block; margin:0 auto; height:32mm; }
    .band { background:#FFA500; color:#fff; text-align:center; font-weight:800; text-transform:uppercase; letter-spacing:.8mm; font-size:2.5mm; padding:1.4mm 0; }
    .num { text-align:center; background:#f4f1fa; color:#5e3a8c; font-weight:800; font-size:5.5mm; padding:1.4mm 0; letter-spacing:.3mm; }
    .pic { width:28mm; height:28mm; object-fit:cover; border-radius:2.5mm; border:.8mm solid #27c1ca; margin:2mm auto 1mm; display:block; }
    .nm { text-align:center; font-size:4mm; font-weight:800; color:#26203a; padding:0 2mm; line-height:1.1; }
    .mt { text-align:center; font-size:2.8mm; color:#666; margin-top:.8mm; }
    .ref { text-align:center; font-family:monospace; font-size:3.3mm; font-weight:700; color:#5e3a8c; margin-top:1.2mm; word-break:break-all; }
    button { padding:8px 22px; border:none; border-radius:8px; background:#5e3a8c; color:#fff; font-weight:700; cursor:pointer; }
    @media print { body { background:#fff; padding:0; gap:0; } button { display:none; } .card { box-shadow:none; } }
  </style></head><body>
    <div class="card">
      <img class="wm" src="/logo-full.png" alt=""/>
      <div class="top"><div class="logobox"><img src="/logo-full.png" alt="NAGARTA"/></div></div>
      <div class="band">Camper ID</div>
      <div class="num">#${campId}</div>
      <img class="pic" src="${photo}" alt="${name}"/>
      <div class="nm">${name}</div>
      <div class="mt">${esc(meta)}</div>
      <div class="ref">Ref: ${esc(reg.referenceCode)}</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
      <button onclick="window.print()">🖨️ Print</button>
      <button onclick="downloadCard()" style="background:#27c1ca;color:#083b3e;">⬇️ Download</button>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <script>
      function downloadCard(){
        var card=document.querySelector('.card');
        if(!window.html2canvas){ alert('Download tool did not load. Use Print → "Save as PDF" instead.'); return; }
        html2canvas(card,{scale:5,useCORS:true,backgroundColor:'#ffffff'}).then(function(canvas){
          var a=document.createElement('a');
          a.download='NAGARTA-ID-${campId}-${(reg.child?.name || 'Camper').replace(/[^A-Za-z0-9]/g, '_')}.png';
          a.href=canvas.toDataURL('image/png');
          document.body.appendChild(a); a.click(); a.remove();
        }).catch(function(){ alert('Could not create the image. Use Print → "Save as PDF" instead.'); });
      }
    </script>
  </body></html>`);
});

app.get('/admin/registrations/:id/print', requireAdminSession, async (req, res) => {
  const reg = await prisma.registration.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      child: true,
      transactions: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!reg) return res.status(404).send('Registration not found');

  const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

  const photo = reg.child?.photo;
  const photoBlock = photo
    ? `<img src="${photo}" alt="Attendee" style="width:150px;height:150px;object-fit:cover;border-radius:8px;border:3px solid #cba36b;" />`
    : `<div style="width:150px;height:150px;border-radius:8px;border:3px dashed #decbb2;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:13px;text-align:center;">No Photo<br/>Provided</div>`;

  const row = (label: string, value: unknown) =>
    `<tr><td style="padding:7px 12px;font-weight:600;color:#531c22;width:190px;border-bottom:1px solid #f0e9e0;font-size:13px;">${esc(label)}</td><td style="padding:7px 12px;color:#301317;border-bottom:1px solid #f0e9e0;font-size:13px;">${esc(value) || '—'}</td></tr>`;

  const paidTotal = reg.transactions.reduce((s, t) => s + t.amount, 0) / 100;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Registration Form — ${esc(reg.child?.name || reg.user.name)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #301317; background: #f3eee9; padding: 24px; }
  .sheet { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #e5ddd2; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #301317 0%, #531c22 100%); color: #f3eee9; padding: 26px 32px; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 26px; font-style: italic; color: #cba36b; letter-spacing: 1px; }
  .header .sub { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: rgba(243,238,233,0.6); margin-top: 4px; }
  .header .ref { text-align: right; font-size: 12px; }
  .header .ref b { display:block; font-size: 15px; color: #cba36b; font-family: monospace; letter-spacing: 1px; }
  .body { padding: 28px 32px; }
  .top-row { display: flex; gap: 26px; margin-bottom: 24px; align-items: flex-start; }
  .badges { margin-top: 12px; display:flex; gap:8px; flex-wrap:wrap; }
  .badge { font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
  .b-green { background:#dcfce7; color:#15803d; } .b-amber { background:#fef3c7; color:#b45309; }
  .b-red { background:#fee2e2; color:#b91c1c; } .b-blue { background:#dbeafe; color:#1d4ed8; } .b-orange { background:#ffedd5; color:#c2410c; }
  h2.section { font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #cba36b; font-weight: 700; margin: 22px 0 8px; border-bottom: 2px solid #cba36b; padding-bottom: 5px; font-family: Arial, sans-serif; }
  table { width: 100%; border-collapse: collapse; }
  .name-big { font-size: 28px; font-style: italic; color: #301317; }
  .age-line { font-size: 14px; color: #531c22; margin-top: 4px; }
  .footer { padding: 18px 32px; border-top: 1px solid #f0e9e0; font-size: 11px; color: #999; display:flex; justify-content:space-between; }
  .print-bar { max-width: 820px; margin: 0 auto 16px; display: flex; gap: 10px; justify-content: flex-end; }
  .print-bar button, .print-bar a { font-family: Arial, sans-serif; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; text-decoration: none; }
  .btn-print { background: #cba36b; color: #301317; }
  .btn-back { background: #fff; color: #531c22; border: 1px solid #decbb2; }
  @media print {
    body { background: #fff; padding: 0; }
    .print-bar { display: none; }
    .sheet { box-shadow: none; border: none; border-radius: 0; max-width: 100%; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="print-bar">
    <a class="btn-back" href="/admin/registrations">← Back</a>
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="sheet">
    <div class="header">
      <div>
        <h1>NAGARTA Youth Camp</h1>
        <div class="sub">Official Registration Form · 2026</div>
      </div>
      <div class="ref">
        Reference<b>${esc(reg.referenceCode)}</b>
      </div>
    </div>

    <div class="body">
      <div class="top-row">
        <div>${photoBlock}</div>
        <div style="flex:1;">
          <div class="name-big">${esc(reg.child?.name || reg.user.name)}</div>
          <div class="age-line">${reg.child?.age ? `Age ${esc(reg.child.age)}` : ''}${reg.child?.gender ? ` · ${esc(reg.child.gender)}` : ''}${reg.child?.school ? ` · ${esc(reg.child.school)}` : ''}</div>
          <div class="badges">
            <span class="badge ${reg.status === 'CONFIRMED' ? 'b-green' : reg.status === 'PENDING' ? 'b-amber' : reg.status === 'CANCELLED' ? 'b-red' : 'b-blue'}">${esc(reg.status)}</span>
            <span class="badge ${reg.paymentStatus === 'PAID' ? 'b-green' : reg.paymentStatus === 'PARTIAL' ? 'b-blue' : 'b-orange'}">Payment: ${esc(reg.paymentStatus)}</span>
          </div>
        </div>
      </div>

      <h2 class="section">Attendee Details</h2>
      <table>
        ${row('Full Name', reg.child?.name)}
        ${row('Age', reg.child?.age)}
        ${row('Gender', reg.child?.gender)}
        ${row('School', reg.child?.school)}
        ${row('Dietary Needs', reg.child?.dietaryNeeds)}
        ${row('Medical Notes', reg.child?.medicalNotes)}
        ${row('Emergency Contact', reg.child?.emergencyContact)}
      </table>

      <h2 class="section">Parent / Guardian</h2>
      <table>
        ${row('Parent Name', reg.parentName || reg.user.name)}
        ${row('Address', reg.parentAddress)}
        ${row('Phone', reg.parentPhone || reg.user.phone)}
        ${row('Account Email', reg.user.email)}
      </table>

      ${(reg.motherName || reg.motherPhone || reg.motherEmail) ? `
      <h2 class="section">Mother's Information</h2>
      <table>
        ${row("Mother's Name", reg.motherName)}
        ${row('Address', reg.motherAddress)}
        ${row('Phone', reg.motherPhone)}
        ${row('Email', reg.motherEmail)}
        ${row('Emergency Contact', reg.motherEmergencyContact)}
      </table>` : ''}

      ${(reg.fatherName || reg.fatherPhone || reg.fatherEmail) ? `
      <h2 class="section">Father's Information</h2>
      <table>
        ${row("Father's Name", reg.fatherName)}
        ${row('Address', reg.fatherAddress)}
        ${row('Phone', reg.fatherPhone)}
        ${row('Email', reg.fatherEmail)}
        ${row('Emergency Contact', reg.fatherEmergencyContact)}
      </table>` : ''}

      <h2 class="section">Registration & Payment</h2>
      <table>
        ${row('Reference Code', reg.referenceCode)}
        ${row('Status', reg.status)}
        ${row('Payment Status', reg.paymentStatus)}
        ${row('Amount Paid', paidTotal > 0 ? `GH₵ ${paidTotal.toLocaleString()}` : 'Not paid yet')}
        ${row('Registered On', reg.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}
        ${reg.notes ? row('Notes', reg.notes) : ''}
      </table>
    </div>

    <div class="footer">
      <span>NAGARTA Youth Camp · 19–23 December 2026 · Accra, Ghana</span>
      <span>Printed: ${new Date().toLocaleDateString('en-GB')}</span>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
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

app.get('/admin/users/:id', requireAdminSession, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, suspended: true, createdAt: true,
      registrations: {
        orderBy: { createdAt: 'desc' },
        include: { child: true },
      },
    },
  });
  if (!user) return res.redirect('/admin/users');
  res.render('admin/user-detail', { user });
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

// ── Payment portal ───────────────────────────────────────────────────────────

async function sendReceiptEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html });
}

function buildReceiptHtml(reg: any, packingItems: string[]): string {
  const photoHtml = reg.child?.photo
    ? `<img src="${reg.child.photo}" style="width:130px;height:130px;object-fit:cover;border-radius:8px;border:2px solid #decbb2;" />`
    : `<div style="width:130px;height:130px;border-radius:8px;border:2px dashed #decbb2;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">No Photo</div>`;
  const txRows = (reg.transactions || []).map((t: any) =>
    `<tr><td style="padding:3px 10px 3px 0;">${new Date(t.createdAt).toLocaleDateString('en-GB')}</td>`
    + `<td style="padding:3px 10px 3px 0;">${t.method.replace('_', ' ')}</td>`
    + `<td style="padding:3px 10px 3px 0;font-family:monospace;">${t.reference || '—'}</td>`
    + `<td style="padding:3px 0;text-align:right;font-weight:600;">₵${(t.amount / 100).toFixed(2)}</td></tr>`
  ).join('');
  const totalPaid = (reg.transactions || []).reduce((s: number, t: any) => s + t.amount, 0);
  const packList = packingItems.length
    ? `<ul style="columns:2;gap:20px;margin:4px 0;padding-left:18px;">${packingItems.map(i => `<li style="font-size:11px;margin-bottom:3px;">${i}</li>`).join('')}</ul>`
    : `<p style="font-size:11px;color:#aaa;font-style:italic;">No items selected.</p>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>NAGARTA Receipt</title>
  <style>body{font-family:Georgia,serif;padding:28px;color:#301317;background:#fff;font-size:12px;}
  .hdr{background:#301317;color:#cba36b;padding:14px 20px;border-radius:8px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;}
  .hdr h1{margin:0;font-size:19px;letter-spacing:2px;} .hdr p{margin:0;font-size:9px;letter-spacing:3px;text-transform:uppercase;opacity:.65;}
  .sec{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#531c22;font-family:Arial,sans-serif;border-bottom:1px solid #decbb2;padding-bottom:3px;margin:14px 0 6px;}
  table{border-collapse:collapse;width:100%;} td{padding:3px 8px 3px 0;vertical-align:top;font-size:12px;}
  .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase;background:#decbb2;color:#301317;}
  .ref{font-family:monospace;font-size:14px;font-weight:700;color:#531c22;letter-spacing:2px;}
  .footer{margin-top:18px;border-top:1px solid #decbb2;padding-top:8px;font-size:9px;color:#aaa;text-align:center;}</style>
  </head><body>
  <div class="hdr"><div><h1>NAGARTA Youth Camp 2026</h1><p>Official Registration Receipt</p></div>
  <div style="text-align:right;font-size:10px;opacity:.65;">${new Date().toLocaleDateString('en-GB')}</div></div>
  <div style="display:flex;gap:22px;margin-bottom:16px;">
    <div style="flex-shrink:0;">${photoHtml}
    <div style="margin-top:8px;text-align:center;"><span class="badge">${reg.status}</span> <span class="badge">${reg.paymentStatus}</span></div></div>
    <div style="flex:1;">
      <div class="sec">Camper Details</div>
      <table>${[
        ['Full Name', reg.child?.name || reg.user?.name],
        ['Age', reg.child?.age ? reg.child.age + ' years' : ''],
        ['School', reg.child?.school],
        ['Dietary', reg.child?.dietaryNeeds],
        ['Medical', reg.child?.medicalNotes],
        ['Emergency', reg.child?.emergencyContact],
      ].filter(r => r[1]).map(r => `<tr><td style="color:#531c22;font-weight:600;white-space:nowrap;">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>
      <div class="sec">Parent / Guardian</div>
      <table>${[
        ['Name', reg.parentName || reg.user?.name],
        ['Phone', reg.parentPhone || reg.user?.phone],
        ['Email', reg.user?.email],
        ['Address', reg.parentAddress],
      ].filter(r => r[1]).map(r => `<tr><td style="color:#531c22;font-weight:600;white-space:nowrap;">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>
      <div class="sec">Reference</div><p class="ref">${reg.referenceCode}</p>
    </div></div>
  ${txRows ? `<div class="sec">Payment Transactions</div><table><thead><tr>
    <th style="text-align:left;font-size:9px;text-transform:uppercase;color:#aaa;padding-bottom:4px;">Date</th>
    <th style="text-align:left;font-size:9px;text-transform:uppercase;color:#aaa;padding-bottom:4px;">Method</th>
    <th style="text-align:left;font-size:9px;text-transform:uppercase;color:#aaa;padding-bottom:4px;">Reference</th>
    <th style="text-align:right;font-size:9px;text-transform:uppercase;color:#aaa;padding-bottom:4px;">Amount</th>
    </tr></thead><tbody>${txRows}</tbody></table>
    <p style="text-align:right;font-weight:700;font-size:13px;margin-top:5px;">Total Paid: ₵${(totalPaid / 100).toFixed(2)}</p>` : ''}
  <div class="sec">Packing List</div>${packList}
  <div class="footer">NAGARTA Youth Camp 2026 &nbsp;·&nbsp; Official Receipt &nbsp;·&nbsp; ${reg.referenceCode}</div>
  </body></html>`;
}

app.get('/admin/payments', requireAdminSession, async (req, res) => {
  const ref = ((req.query.ref as string) || '').trim().toUpperCase();
  const success = (req.query.success as string) || null;
  const errMsg  = (req.query.error   as string) || null;
  if (!ref) return res.render('admin/payments', { registration: null, error: errMsg, success });

  const registration = await prisma.registration.findUnique({
    where: { referenceCode: ref },
    include: { user: { select: { id: true, name: true, email: true, phone: true } }, child: true, transactions: { orderBy: { createdAt: 'desc' } } },
  });
  res.render('admin/payments', {
    registration: registration || null,
    error: registration ? errMsg : 'No registration found for that reference code.',
    success,
    query: ref,
  });
});

app.post('/admin/payments/:id/record', requireAdminSession, async (req, res) => {
  const { amount, method, note, paymentStatus, paystackRef } = req.body;
  const reg = await prisma.registration.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true } }, child: true },
  });
  if (!reg) return res.redirect('/admin/payments');

  const recordedAmount = Math.round(parseFloat(amount) * 100) || 0;

  await prisma.paymentTransaction.create({
    data: {
      registrationId: req.params.id,
      amount: recordedAmount,
      method: method || 'CASH',
      reference: paystackRef || null,
      note: note || null,
    },
  });
  await prisma.registration.update({ where: { id: req.params.id }, data: { paymentStatus: paymentStatus || 'PAID' } });

  // Send payment confirmation email (async, non-blocking)
  notificationService.sendPaymentConfirmation(
    reg.user.id,
    reg.child?.name || reg.user.name,
    reg.user.name,
    reg.user.email,
    recordedAmount,
    method || 'CASH',
    reg.referenceCode,
    reg.id,
    paystackRef
  ).catch(err => console.error('[payments/record] Failed to send payment confirmation email:', err));

  res.redirect(`/admin/payments?ref=${reg.referenceCode}&success=Payment recorded successfully`);
});

app.post('/admin/payments/:id/send-receipt', requireAdminSession, async (req, res) => {
  const reg = await prisma.registration.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { name: true, email: true, phone: true } }, child: true, transactions: { orderBy: { createdAt: 'desc' } } },
  });
  if (!reg) return res.redirect('/admin/payments');
  const packingItems: string[] = req.body.packingItems ? String(req.body.packingItems).split(',').filter(Boolean) : [];
  const html = buildReceiptHtml(reg, packingItems);
  try {
    if (!process.env.SMTP_USER) throw new Error('SMTP not configured');
    await sendReceiptEmail(reg.user.email, `NAGARTA Youth Camp 2026 — Receipt ${reg.referenceCode}`, html);
    res.redirect(`/admin/payments?ref=${reg.referenceCode}&success=Receipt sent to ${reg.user.email}`);
  } catch (e: any) {
    console.error('[send-receipt]', e.message);
    res.redirect(`/admin/payments?ref=${reg.referenceCode}&error=Email failed: ${e.message}. Set SMTP_USER and SMTP_PASS on Render.`);
  }
});

// Root redirect
app.get('/', (_req, res) => res.redirect('/admin'));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Reset admin via browser URL (accepts query params or env vars)
app.get('/api/reset-admin', async (req, res) => {
  // Allow if: (1) secret matches, or (2) running in development
  const isAuthorized = !isProd || req.query.secret === process.env.RESET_SECRET;
  if (!isAuthorized) return res.status(403).json({ error: 'Forbidden' });

  try {
    // Accept query parameters or fall back to environment variables
    const email = (req.query.email as string) || process.env.ADMIN_EMAIL || 'admin@nagartayouthcamp.com';
    const password = (req.query.password as string) || process.env.ADMIN_PASSWORD || 'Admin@nagarta!';
    const name = (req.query.name as string) || process.env.ADMIN_NAME || 'Camp Administrator';

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hashed, role: 'ADMIN', name },
      create: { email, password: hashed, name, role: 'ADMIN' },
    });
    res.json({ success: true, admin: user.email, message: 'Admin account created/updated successfully' });
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
