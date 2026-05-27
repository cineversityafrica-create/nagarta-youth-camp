# NARGATA Frontend — Next.js 14 Public Site

Next.js 14 (App Router) frontend for NARGATA Youth Camp 2026. Runs on port **3000**.

## Setup

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000 (or your deployed backend URL)

npm run dev
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, experience, about, schedule, testimonials, CTA |
| `/register` | Registration form (parent or self) |
| `/auth/sign-in` | Login (parent or camper) |
| `/auth/sign-up` | Account creation |
| `/dashboard/parent` | Parent portal — registrations, packing list, announcements |
| `/dashboard/camper` | Camper portal — schedule, announcements, talent signup |
| `/contact` | Contact form + details |

## Data fetching

All content (hero text, activities, schedule, etc.) is fetched from the backend API at request time using Next.js Server Components with `revalidate: 60`. The admin can edit any text in the backend admin dashboard and it appears on the public site within 60 seconds.

If the backend is unreachable, the frontend falls back to hardcoded default content so the site remains visible.

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (no trailing slash) |

## Deploy to Vercel

1. Push to GitHub.
2. Import into Vercel → set Root Directory to `frontend/` if using a monorepo.
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
4. Deploy.

After the frontend is deployed, update `FRONTEND_URL` in the backend's env to the Vercel URL, then redeploy the backend.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
