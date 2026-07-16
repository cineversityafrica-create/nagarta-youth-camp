'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CheckinQR from '@/components/CheckinQR';

const BENEFITS = [
  'Be part of a movement shaping the next generation of leaders.',
  'Gain valuable leadership and event management experience.',
  'Learn from respected professionals and mentors.',
  'Build meaningful networks with volunteers from diverse backgrounds.',
  'Receive structured training before the camp.',
  'Earn an official Certificate of Service.',
  'Access future leadership and volunteer opportunities within NAGARTA.',
  'Contribute to a lasting legacy of youth development in Ghana and beyond.',
];

export default function VolunteerPage() {
  const [applyUrl, setApplyUrl] = useState('/volunteer/apply');
  useEffect(() => {
    if (typeof window !== 'undefined') setApplyUrl(`${window.location.origin}/volunteer/apply`);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#221738 0%,#2a2f45 50%,#3c7055 100%)' }}>
      <div className="py-4 px-6">
        <Link href="/"><Image src="/logo-full.png" alt="NAGARTA" width={44} height={44} className="object-contain" /></Link>
      </div>

      <div className="max-w-3xl mx-auto px-5 pb-16">
        {/* Benefits */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-gold mb-2">Volunteer</p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-cream italic">Why Volunteer with NAGARTA?</h1>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 md:p-8 mb-10">
          <ul className="space-y-3.5">
            {BENEFITS.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-cream/90 text-sm md:text-base">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* QR code */}
        <div className="bg-white rounded-2xl p-7 text-center shadow-2xl max-w-sm mx-auto">
          <h2 className="font-serif text-xl font-bold text-maroon mb-1">Ready to apply?</h2>
          <p className="text-sm text-burgundy/70 mb-5">Scan this QR code to open the volunteer application form.</p>
          <div className="inline-block p-3 rounded-xl border-2 border-beige">
            <CheckinQR value={applyUrl} size={200} />
          </div>
          <p className="text-[11px] text-maroon/40 mt-4">Or open it directly:</p>
          <Link href="/volunteer/apply" className="inline-block mt-2 bg-gold text-maroon px-6 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase hover:bg-amber-500 transition-colors">
            Fill the Form
          </Link>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-xs text-beige/50 hover:text-gold transition-colors">&larr; Back to home</Link>
        </div>
      </div>
    </div>
  );
}
