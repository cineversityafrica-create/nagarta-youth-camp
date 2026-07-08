// Browser uses relative URL (proxied by Nginx to backend)
// Server-side rendering uses direct backend URL
const BASE_URL = typeof window !== 'undefined'
  ? '' // Browser: empty so /api/... goes to same origin (Nginx routes to backend)
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

// Static fallbacks — used if the backend is unreachable
const FALLBACK: Record<string, unknown> = {
  siteContent: {
    hero_eyebrow: 'DEC 19 – 23 · 2026 · ACCRA',
    hero_heading: 'Arise & Lead',
    hero_subheading: 'A transformative 5-day experience',
    hero_urgency: 'Limited Spots Available — Register Now, Before You Lose the Spot!',
    about_heading: 'Shaping the Leaders of Tomorrow',
    about_para1: 'NAGARTA Youth Camp is a premier leadership development experience for young people aged 12–18.',
    about_para2: 'Founded on the conviction that great leaders are built, and not just born.',
    about_para3: 'Every session is intentionally designed to draw out courage, discipline and vision.',
    camp_dates: '19th – 23rd December 2026',
    camp_location: 'Accra, Ghana',
    camp_venue: 'Premium University Campus',
    camp_duration: '5 Days',
    cta_heading: 'Your spot is waiting.',
    contact_email: 'info@nagartayouthcamp.tech',
    contact_phone: '0550 17 17 17 / 0243 60 88 72',
    contact_address: 'Accra, Ghana',
    social_instagram: 'https://instagram.com/nagartacamp',
    social_facebook: 'https://facebook.com/nagartacamp',
    social_twitter: 'https://x.com/nagartacamp',
    social_tiktok: 'https://tiktok.com/@nagartacamp',
  },
  activities: [
    { id: '1', title: 'Leadership Seminars', subtitle: 'World-class facilitators deliver high-impact sessions on influence, vision and character.', iconName: 'presentation', displayOrder: 1 },
    { id: '2', title: 'Outdoor Adventures', subtitle: 'Rope courses, orienteering and team challenges that forge resilience and trust.', iconName: 'mountain', displayOrder: 2 },
    { id: '3', title: 'Discipline & Drills', subtitle: 'Structured physical training sessions that instil focus, perseverance and order.', iconName: 'shield', displayOrder: 3 },
    { id: '4', title: 'Mentorship & Life Skills', subtitle: 'One-on-one and small-group mentoring from industry leaders.', iconName: 'users', displayOrder: 4 },
    { id: '5', title: 'Faith Sessions', subtitle: 'Morning devotionals and evening reflections to anchor purpose and build inner strength.', iconName: 'heart', displayOrder: 5 },
    { id: '6', title: 'Competitions & Talent Showcase', subtitle: 'Debates, oratory contests and creative arts — every gift celebrated.', iconName: 'trophy', displayOrder: 6 },
    { id: '7', title: 'Awards Night', subtitle: 'A gala ceremony honouring excellence, growth and outstanding leadership.', iconName: 'star', displayOrder: 7 },
  ],
  schedule: [
    { id: '1', dayNumber: 1, date: 'Saturday, 19 December', title: 'Arrival & Orientation', summary: 'Welcome ceremony, campus tour, team assignments, icebreakers and opening ceremony with keynote address.' },
    { id: '2', dayNumber: 2, date: 'Sunday, 20 December', title: 'Identity & Vision', summary: 'Morning devotional, leadership seminar on personal identity, outdoor adventure activities and evening reflections.' },
    { id: '3', dayNumber: 3, date: 'Monday, 21 December', title: 'Character & Courage', summary: 'Discipline drills at dawn, character formation seminar, mentorship sessions and team competitions.' },
    { id: '4', dayNumber: 4, date: 'Tuesday, 22 December', title: 'Service & Influence', summary: 'Community service project, seminar on servant leadership, life skills workshop and evening campfire.' },
    { id: '5', dayNumber: 5, date: 'Wednesday, 23 December', title: 'Commissioning & Awards', summary: 'Final leadership challenge, testimonies, grand Awards Night gala and commissioning ceremony.' },
  ],
};

// Custom error class so callers can distinguish HTTP errors from network errors
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Core fetch wrapper.
 * @param timeoutMs  How long to wait before aborting (default 5 s for data, pass 60000 for auth)
 */
async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  fallbackKey?: string,
  timeoutMs = 5000,
): Promise<T> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      // Try to extract a human-readable error from the JSON body
      let message = `HTTP ${res.status}`;
      try {
        const body = await res.json() as { error?: string };
        if (body?.error) message = body.error;
      } catch { /* ignore parse errors */ }
      throw new ApiError(res.status, message);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    // Use fallback data for public pages when the backend is unreachable
    if (fallbackKey && FALLBACK[fallbackKey]) {
      console.warn(`[api] Backend unreachable, using fallback for ${fallbackKey}`);
      return FALLBACK[fallbackKey] as T;
    }
    throw err;
  }
}

// ── Public endpoints ─────────────────────────────────────────────────────────

export function getSiteContent(): Promise<Record<string, string>> {
  return apiFetch('/api/site-content', { next: { revalidate: 5 } } as RequestInit, 'siteContent');
}

export function getActivities(): Promise<Activity[]> {
  return apiFetch('/api/activities', { next: { revalidate: 5 } } as RequestInit, 'activities');
}

export function getSchedule(): Promise<ScheduleDay[]> {
  return apiFetch('/api/schedule', { next: { revalidate: 5 } } as RequestInit, 'schedule');
}

export async function submitRegistration(data: unknown, token: string) {
  return apiFetch('/api/registrations', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  }, undefined, 30000);
}

export async function submitContactMessage(data: unknown) {
  return apiFetch('/api/contact-messages', { method: 'POST', body: JSON.stringify(data) }, undefined, 30000);
}

// ── Auth — 60 s timeout so Render has time to wake up ────────────────────────

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    undefined,
    60000, // 60 s — Render free tier can take up to ~50 s to wake
  );
}

export async function register(data: RegisterPayload): Promise<AuthResponse> {
  return apiFetch(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify(data) },
    undefined,
    60000,
  );
}

// ── Authenticated endpoints ──────────────────────────────────────────────────

export async function getMe(token: string): Promise<User> {
  return apiFetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }, undefined, 30000);
}

export async function getAnnouncements(token: string): Promise<Announcement[]> {
  return apiFetch('/api/announcements', { headers: { Authorization: `Bearer ${token}` } }, undefined, 30000);
}

export async function getMyRegistrations(token: string): Promise<Registration[]> {
  return apiFetch('/api/registrations/my', { headers: { Authorization: `Bearer ${token}` } }, undefined, 30000);
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface Activity {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  displayOrder: number;
}

export interface ScheduleDay {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  summary: string;
  details?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'PARENT' | 'CAMPER' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'PARENT' | 'CAMPER';
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  referenceCode: string;
  type: string;
  status: string;
  paymentStatus: string;
  child?: {
    name: string;
    age: number;
    school?: string;
    photo?: string;
  };
  parentName?: string;
  parentAddress?: string;
  parentPhone?: string;
  motherName?: string;
  motherAddress?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherEmergencyContact?: string;
  fatherName?: string;
  fatherAddress?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherEmergencyContact?: string;
  createdAt: string;
  amountPaid?: number; // in Ghana Cedis, summed from transactions
  transactions?: {
    id: string;
    amount: number; // stored in pesewas (÷100 for cedis)
    method: string;
    reference?: string | null;
    note?: string | null;
    createdAt: string;
  }[];
}
