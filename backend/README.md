# NARGATA Backend — Express API + Admin Dashboard

Node.js/Express backend for NARGATA Youth Camp 2026. Runs on port **5000**.

## Setup

```bash
npm install
cp .env.example .env   # fill in all values

# Start PostgreSQL (from project root):
docker compose up -d

# Run migrations and seed:
npx prisma migrate dev --name init
npm run db:seed

# Start dev server:
npm run dev
```

## Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/site-content` | All editable site copy |
| `GET` | `/api/activities` | 7 experience pillars |
| `GET` | `/api/schedule` | 5-day schedule |
| `POST` | `/api/registrations` | Submit registration (requires JWT) |
| `POST` | `/api/contact-messages` | Submit contact form |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login, returns JWT |

### Authenticated (JWT bearer)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/me` | Current user profile |
| `GET` | `/api/announcements` | Published announcements |
| `GET` | `/api/registrations/my` | My registrations |

### Admin API (JWT + ADMIN role)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/stats` | Dashboard stats |
| `GET/PATCH/DELETE` | `/api/admin/users` | User management |
| `GET/PATCH` | `/api/admin/registrations` | Registration management |
| `GET/PUT` | `/api/admin/site-content` | Edit site content |
| `GET/POST/PUT/DELETE` | `/api/admin/activities` | Edit activities |
| `GET/PUT` | `/api/admin/schedule` | Edit schedule |
| `GET/PATCH/DELETE` | `/api/admin/contact-messages` | Manage messages |
| `GET/POST/PUT/DELETE` | `/api/admin/announcements` | Manage announcements |

## Admin Dashboard (web UI)

Navigate to `http://localhost:5000/admin`  
Login with the admin credentials set in `.env`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled production build |
| `npm run db:seed` | Seed database with defaults |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Drop and re-seed (destructive) |

## Production deploy

Build: `npm run build`  
Start: `npm start`  
Run migrations before starting: `npx prisma migrate deploy`
