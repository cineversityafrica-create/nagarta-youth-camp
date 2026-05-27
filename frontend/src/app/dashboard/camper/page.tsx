'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getMe, getAnnouncements, type User, type Announcement } from '@/lib/api';
import { getToken, clearAuth } from '@/lib/auth';

const SCHEDULE = [
  { day: 'Day 1 — 19 Dec', title: 'Arrival & Orientation', time: 'From 9:00 AM' },
  { day: 'Day 2 — 20 Dec', title: 'Identity & Vision', time: 'Starts 7:00 AM' },
  { day: 'Day 3 — 21 Dec', title: 'Character & Courage', time: 'Starts 6:00 AM' },
  { day: 'Day 4 — 22 Dec', title: 'Service & Influence', time: 'Starts 6:30 AM' },
  { day: 'Day 5 — 23 Dec', title: 'Commissioning & Awards', time: 'Starts 8:00 AM' },
];

export default function CamperDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'announcements' | 'talent'>('schedule');
  const [talentEntry, setTalentEntry] = useState('');
  const [talentSubmitted, setTalentSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/auth/sign-in'); return; }

    (async () => {
      try {
        const [me, anns] = await Promise.all([
          getMe(token!),
          getAnnouncements(token!).catch(() => [] as Announcement[]),
        ]);
        setUser(me);
        setAnnouncements(anns);
      } catch {
        clearAuth();
        router.push('/auth/sign-in');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-maroon flex items-center justify-center">
        <p className="text-gold font-serif text-lg italic">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <div className="bg-maroon border-b border-burgundy">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><Image src="/logo.png" alt="NAGARTA" width={40} height={40} className="object-contain" /></Link>
          <div className="flex items-center gap-4">
            <span className="text-cream/60 text-sm">Camper Portal</span>
            <button onClick={() => { clearAuth(); router.push('/'); }} className="text-xs text-beige/40 hover:text-gold transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero welcome */}
        <div className="bg-burgundy rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <p className="label-caps text-gold/60 mb-2">Camper Dashboard</p>
            <h1 className="font-serif text-3xl font-semibold text-cream italic">{user?.name}</h1>
            <p className="text-beige/60 text-sm mt-1">NAGARTA 2026 · Arise & Lead</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-maroon/40 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-gold text-xs font-semibold tracking-wider">Camp opens Dec 19, 2026</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-beige mb-8 gap-6">
          {[
            { key: 'schedule', label: 'My Schedule' },
            { key: 'announcements', label: `Announcements (${announcements.length})` },
            { key: 'talent', label: 'Talent Showcase' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`pb-3 text-sm font-medium tracking-wide transition-colors ${
                activeTab === key
                  ? 'border-b-2 border-gold text-maroon'
                  : 'text-maroon/50 hover:text-maroon'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Schedule tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {SCHEDULE.map((day, i) => (
              <div key={i} className="bg-white border border-beige rounded-xl p-5 flex items-center gap-5">
                <div className="w-12 h-12 bg-burgundy rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-bold text-sm">{i + 1}</span>
                </div>
                <div>
                  <p className="label-caps text-gold mb-0.5">{day.day}</p>
                  <p className="font-serif text-lg font-semibold text-maroon">{day.title}</p>
                  <p className="text-xs text-burgundy mt-0.5">{day.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Announcements tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-maroon/50 text-sm text-center py-12">No announcements yet.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="bg-white border border-beige rounded-xl p-6">
                  <h3 className="font-serif text-lg font-semibold text-maroon">{ann.title}</h3>
                  <p className="text-xs text-gold font-medium mt-0.5 mb-3">
                    {new Date(ann.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-maroon/75 leading-relaxed">{ann.body}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Talent showcase tab */}
        {activeTab === 'talent' && (
          <div className="bg-white border border-beige rounded-xl p-8">
            <h2 className="font-serif text-2xl font-semibold text-maroon italic mb-2">Talent Showcase Signup</h2>
            <p className="text-sm text-burgundy mb-6">
              Sign up to perform during the Talent Showcase on Day 3. Tell us what your talent is.
            </p>
            {talentSubmitted ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-serif text-lg text-maroon italic">You&apos;re signed up!</p>
                <p className="text-sm text-burgundy mt-2">The camp team will be in touch with performance details.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); if (talentEntry.trim()) setTalentSubmitted(true); }}
                className="space-y-4"
              >
                <div>
                  <label className="block label-caps text-burgundy mb-1.5">Your Talent</label>
                  <textarea
                    rows={4}
                    value={talentEntry}
                    onChange={(e) => setTalentEntry(e.target.value)}
                    required
                    placeholder="Describe what you'll perform — e.g. spoken word poetry, singing, dance, comedy, instrumental..."
                    className="w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gold text-maroon px-6 py-3 rounded-lg text-sm font-semibold tracking-wider uppercase hover:bg-amber-500 transition-colors"
                >
                  Submit Entry
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
