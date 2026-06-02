'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeroProps {
  eyebrow: string;
  heading: string;
  subheading: string;
  urgency: string;
}

export default function HeroSection({ eyebrow, heading, subheading, urgency }: HeroProps) {
  const parts = (heading ?? 'Arise & Lead').split(' & ');
  const firstWord = parts[0] || heading;
  const restWords = parts[1] ? `& ${parts[1]}` : '';

  // Bumping this remounts the photo layers, which restarts the CSS slideshow.
  // Covers: fresh load (0), client navigation back to "/" and browser
  // back/forward cache restores (pageshow with persisted=true).
  const [runId, setRunId] = useState(0);
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setRunId((id) => id + 1);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">

      {/* ── LAYER 1 (bottom): permanent dark maroon background ─────────────── */}
      {/* This is what you see after the photo exits                            */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(170deg, #301317 0%, #1a0a0e 60%, #0d0508 100%)' }}
      />

      {/* Subtle radial glow — part of the permanent dark scene */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(83,28,34,0.5) 0%, transparent 70%)',
        }}
      />

      {/* ── LAYER 2a: Photo 1 (drawing) — visible 0–5 s, then fades out ──────── */}
      <div key={`photo1-${runId}`} className="camp-photo-1-animate absolute inset-0 z-10">
        <Image
          src="/camp-drawing.jpg"
          alt=""
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
          sizes="100vw"
        />
        {/* Gradient veil so text stays readable while photo is showing */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              'linear-gradient(to bottom,',
              '  rgba(20,6,9,0.78)  0%,',
              '  rgba(20,6,9,0.42) 40%,',
              '  rgba(20,6,9,0.35) 62%,',
              '  rgba(20,6,9,0.70) 100%)',
            ].join(' '),
          }}
        />
      </div>

      {/* ── LAYER 2b: Photo 2 (painting) — fades in at 5 s, exits at ~13.5 s ─ */}
      <div key={`photo2-${runId}`} className="camp-photo-2-animate absolute inset-0 z-10">
        <Image
          src="/camp-painting.jpg"
          alt=""
          fill
          style={{ objectFit: 'cover', objectPosition: 'center 25%' }}
          sizes="100vw"
        />
        {/* Same gradient veil */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              'linear-gradient(to bottom,',
              '  rgba(20,6,9,0.78)  0%,',
              '  rgba(20,6,9,0.42) 40%,',
              '  rgba(20,6,9,0.35) 62%,',
              '  rgba(20,6,9,0.70) 100%)',
            ].join(' '),
          }}
        />
      </div>

      {/* ── LAYER 3: grain texture ───────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Gold top rule */}
      <div className="absolute top-0 left-0 right-0 h-px z-30 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* ── LAYER 4 (top): hero text ─────────────────────────────────────────── */}
      <div className="relative z-30 px-6 max-w-5xl mx-auto">
        <p className="label-caps text-gold tracking-widest mb-8 opacity-90">{eyebrow}</p>

        <h1 className="font-serif font-semibold leading-none mb-6 text-balance">
          <span
            className="block text-cream italic"
            style={{ fontSize: 'clamp(4rem, 10vw, 9rem)', lineHeight: 1 }}
          >
            {firstWord}
          </span>
          {restWords && (
            <span
              className="block text-gold italic"
              style={{ fontSize: 'clamp(4rem, 10vw, 9rem)', lineHeight: 1 }}
            >
              {restWords}
            </span>
          )}
        </h1>

        <div className="flex justify-center mb-8">
          <div className="w-24 h-px bg-gold/60" />
        </div>

        <p className="text-beige/80 text-lg md:text-xl font-sans mb-10 tracking-wide">
          {subheading}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/register"
            className="bg-gold text-maroon font-semibold px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-amber-400 transition-all shadow-lg shadow-gold/20 hover:shadow-gold/40"
          >
            Reserve a Spot
          </Link>
          <Link
            href="#about"
            className="border border-gold/70 text-gold px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-gold/10 transition-all"
          >
            Learn More
          </Link>
        </div>

        <p className="label-caps text-gold/60 tracking-widest text-xs">{urgency}</p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-px h-8 bg-gradient-to-b from-gold/60 to-transparent" />
        <svg className="w-4 h-4 text-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
