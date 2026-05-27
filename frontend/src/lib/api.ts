const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Static fallbacks — used if the backend is unreachable
const FALLBACK: Record<string, unknown> = {
  siteContent: {
    hero_eyebrow: 'DEC 19 – 23 · 2026 · ACCRA',
    hero_heading: 'Arise & Lead',
    hero_subheading: 'A transformative 5-day experience',
    hero_urgency: 'Limited Spots Available — Register Now, Before You Lose the Spot!',
    about_heading: 'Shaping the Leaders of Tomorrow',
    about_para1: 'NAGARTA Youth Camp is a premier leadership development experience for young people aged 13–25.',
    about_para2: 'Founded on the conviction that great leaders are built, not born.',
    about_para3: 'Every session is intentionally designed to draw out courage, discipline, and vision.',
    camp_dates: '19th – 23rd December 2026',
    camp_location: 'Accra, Ghana',
    camp_venue: 'Premium University Campus',
    camp_duration: '5 Days',
    cta_heading: 'Your spot is waiting.',
    contact_email: 'info@nagartacamp.com',
    contact_phone: '+233 20 000 0000',
    contact_address: 'Accra, Ghana',
    social_instagram: 'https://instagram.com/nagartacamp',
    social_facebook: 'https://facebook.com/nagartacamp',
    social_twitter: 'https://x.com/nagartacamp',
    social_tiktok: 'https://tiktok.com/@nagartacamp',
  },
  activities: [
    { id: '1', title: 'Leadership Seminars', subtitle: 'World-class facilitators deliver high-impact sessions on influence, vision, and character.', iconName: 'presentation', displayOrder: 1 },
    { id: '2', title: 'Outdoor Adventures', subtitle: 'Rope courses, orienteering, and team challenges that forge resilience and trust.', iconName: 'mountain', displayOrder: 2 },
    { id: '3', title: 'Discipline & Drills', subtitle: 'Structured physical training sessions that instil focus, perseverance, and order.', iconName: 'shield', displayOrder: 3 },
    { id: '4', title: 'Mentorship & Life Skills', subtitle: 'One-on-one and small-group mentoring from industry leaders.', iconName: 'users', displayOrder: 4 },
    { id: '5', title: 'Faith Sessions', subtitle: 'Morning devotionals and evening reflections to anchor purpose and build inner strength.', iconName: 'heart', displayOrder: 5 },
    { id: '6', title: 'Competitions & Talent Showcase', subtitle: 'Debates, oratory contests, and creative arts — every gift celebrated.', iconName: 'trophy', displayOrder: 6 },
    { id: '7', title: 'Awards Night', subtitle: 'A gala ceremony honoring excellence, growth, and outstanding leadership.', iconName: 'star', displayOrder: 7 },
  ],
  schedule: [
    { id: '1', dayNumber: 1, date: 'Saturday, 19 December', title: 'Arrival & Orientation', summary: 'Welcome ceremony, campus tour, team assignments, icebreakers, and opening ceremony with keynote address.' },
    { id: '2', dayNumber: 2, date: 'Sunday, 20 December', title: 'Identity & Vision', summary: 'Morning devotional, leadership seminar on personal identity, outdoor adventure activities, and evening reflections.' },
    { id: '3', dayNumber: 3, date: 'Monday, 21 December', title: 'Character & Courage', summary: 'Discipline drills at dawn, character formation seminar, mentorship sessions, and team competitions.' },
    { id: '4', dayNumber: 4, date: 'Tuesday, 22 December', title: 'Service & Influence', summary: 'Community service project, seminar on servant leadership, life skills workshop, and evening campfire.' },
    { id: '5', dayNumber: 5, date: 'Wednesday, 23 December', title: 'Commissioning & Awards', summary: 'Final leadership challenge, testimonies, grand Awards Night gala, and commissioning ceremony.' },
  ],
};

async function apiFetch<T>(path: string, options?: RequestInit, fallbackKey?: string): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err) {
    if (fallbackKey && FALLBACK[fallbackKey]) {
      console.warn(`[api] Backend unreachable, using fallback for ${fallbackKey}`);
      return FALLBACK[fallbackKey] as T;
    }
    throw err;
  }
}

// ── Public endpoints ─────────────────────────────────────────────────────────

export function getSiteContent(): Promise<Record<string, string>> {
  return apiFetch('/api/site-content', { next: { revalidate: 60 } } as RequestInit, 'siteContent');
}

export function getActivities(): Promise<Activity[]> {
  return apiFetch('/api/activities', { next: { revalidate: 60 } } as RequestInit, 'activities');
}

export function getSchedule(): Promise<ScheduleDay[]> {
  return apiFetch('/api/schedule', { next: { revalidate: 60 } } as RequestInit, 'schedule');
}

export async function submitRegistration(data: unknown, token: string) {
  return apiFetch('/api/registrations', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function submitContactMessage(data: unknown) {
  return apiFetch('/api/contact-messages', { method: 'POST', body: JSON.stringify(data) });
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function register(data: RegisterPayload): Promise<AuthResponse> {
  return apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
}

// ── Authenticated endpoints ──────────────────────────────────────────────────

export async function getMe(token: string): Promise<User> {
  return apiFetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAnnouncements(token: string): Promise<Announcement[]> {
  return apiFetch('/api/announcements', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getMyRegistrations(token: string): Promise<Registration[]> {
  return apiFetch('/api/registrations/my', { headers: { Authorization: `Bearer ${token}` } });
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
  };
  createdAt: string;
}
