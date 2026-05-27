# NARGATA Youth Camp 2026 — Platform

A two-part web platform for NARGATA Youth Camp 2026: **Arise & Lead**.

| App | Tech | Port | Purpose |
|-----|------|------|---------|
| `frontend/` | Next.js 14 + Tailwind | 3000 | Public site, registration, parent/camper portals |
| `backend/` | Express + Prisma + EJS | 5000 | REST API + Admin dashboard |

Both apps are **independently deployable** to separate hosts. They communicate only via REST API.

---

## Quick Start (local development)

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env          # edit DATABASE_URL, JWT_SECRET, ADMIN_EMAIL
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Admin dashboard → http://localhost:5000/admin  
API root → http://localhost:5000/api

### 3. Start the frontend

```bash
cd frontend
npm install
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
```

Public site → http://localhost:3000

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens — use a long random string in production |
| `ADMIN_EMAIL` | Email for the seeded admin account |
| `ADMIN_PASSWORD` | Password for the seeded admin account |
| `ADMIN_NAME` | Display name for the admin |
| `PORT` | Express port (default 5000) |
| `FRONTEND_URL` | Allowed CORS origin (e.g. `https://nargatacamp.com`) |
| `SESSION_SECRET` | Secret for express-session (admin UI sessions) |
| `NODE_ENV` | `development` or `production` |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Full URL of the backend (e.g. `https://api.nargatacamp.com`) |

---

## Deployment

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo (or use the monorepo root with root directory set to `frontend/`).
2. Import the project into [Vercel](https://vercel.com).
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://api.nargatacamp.com`.
4. Deploy.

### Backend → Railway / Render / Fly.io

**Railway:**
```bash
# In backend/
railway init
railway up
railway variables set DATABASE_URL=... JWT_SECRET=... FRONTEND_URL=https://nargatacamp.com
```

**Render:**
1. Create a new Web Service pointing to `backend/`.
2. Build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
3. Start command: `npm start`
4. Add all `.env` variables in the Render dashboard.

**After deploying the backend:**
- Update `NEXT_PUBLIC_API_URL` in the frontend's Vercel environment to the backend's public URL.
- Update `FRONTEND_URL` in the backend's environment to the Vercel deployment URL.
- Redeploy both.

---

## Admin Content Editing

The admin dashboard (`/admin` on the backend) lets the camp organizer edit:
- Hero text, tagline, dates, location
- All 7 experience activities (title, description, icon)
- 5-day schedule (title and summary per day)
- Contact info and social media handles
- Camp capacity

Changes appear on the public site **within 60 seconds** (Next.js ISR `revalidate: 60`).

---

## Architecture

```
Browser
  │
  ├── frontend (Next.js, Vercel)
  │     ├── Server Components fetch from backend at build/revalidate time
  │     └── Client Components call backend API with JWT in Authorization header
  │
  └── backend (Express, Railway)
        ├── /api/* — REST API (CORS-restricted to frontend domain)
        ├── /admin/* — Server-rendered admin dashboard (EJS + session auth)
        └── PostgreSQL (managed DB, same host or separate)
```
