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

// The 3 images to rotate through in the hero
const HERO_IMAGES = [
  { src: '/camp-hero-1.jpg', objectPosition: 'center 30%' },
  { src: '/camp-hero-3.jpg', objectPosition: 'center 30%' },
  { src: '/camp-hero-4.jpg', objectPosition: 'center 25%' },
];

const SLIDE_DURATION = 5000; // 5 seconds per image

export default function HeroSection({ eyebrow, heading, subheading, urgency }: HeroProps) {
  const parts = (heading ?? 'Arise & Lead').split(' & ');
  const firstWord = parts[0] || heading;
  const restWords = parts[1] ? `& ${parts[1]}` : '';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEarlyBird, setShowEarlyBird] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  // Check if early bird is still active (before November 1, 2026)
  useEffect(() => {
    const checkEarlyBird = () => {
      const now = new Date();
      const endDate = new Date('2026-11-01T00:00:00'); // Early bird ends Oct 31, 2026
      const diff = endDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setShowEarlyBird(diff > 0);
      setDaysLeft(days);
    };
    checkEarlyBird();
    // Re-check every hour
    const interval = setInterval(checkEarlyBird, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate through images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">

      {/* ── LAYER 1 (bottom): permanent dark maroon background ─────────────── */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(170deg, #301317 0%, #1a0a0e 60%, #0d0508 100%)' }}
      />

      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(83,28,34,0.5) 0%, transparent 70%)',
        }}
      />

      {/* ── ROTATING HERO IMAGES — All 3 with smooth crossfade ─────────────── */}
      {HERO_IMAGES.map((img, idx) => (
        <div
          key={idx}
          className="absolute inset-0 z-10 transition-opacity duration-[1500ms]"
          style={{
            opacity: currentIndex === idx ? 1 : 0,
          }}
        >
          <Image
            src={img.src}
            alt=""
            fill
            priority={idx === 0}
            style={{ objectFit: 'cover', objectPosition: img.objectPosition }}
            sizes="100vw"
          />
          {/* Dark gradient overlay so text stays readable */}
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
      ))}

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

      {/* ── EARLY BIRD FLOATING LABEL — Auto-hides after October 2026 ─────── */}
      {showEarlyBird && (
        <Link
          href="/register"
          className="early-bird-label fixed top-24 right-4 md:right-8 z-40 group"
        >
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 opacity-60 blur-md animate-pulse"></div>

            {/* Main label */}
            <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white rounded-2xl px-4 py-3 shadow-2xl border-2 border-white/30 cursor-pointer transform group-hover:scale-110 transition-all duration-300"
              style={{
                boxShadow: '0 10px 40px rgba(251, 146, 60, 0.6), 0 0 0 4px rgba(251, 191, 36, 0.3)',
              }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐦</span>
                <div className="text-left">
                  <p className="text-[9px] font-bold tracking-widest uppercase opacity-90">Limited Time</p>
                  <p className="text-xs md:text-sm font-bold leading-tight">Early Bird Registration</p>
                  <p className="text-[10px] md:text-xs opacity-95 mt-0.5">
                    Ends Oct 31 • <span className="font-bold">{daysLeft} days left</span>
                  </p>
                </div>
              </div>
              {/* Click hint */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-white text-rose-600 px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                CLICK TO REGISTER →
              </div>
            </div>
          </div>

        </Link>
      )}

      {/* ── LAYER 4 (top): hero text ─────────────────────────────────────────── */}
      <div className="relative z-30 px-6 max-w-5xl mx-auto" suppressHydrationWarning>
        <div className="label-caps text-gold tracking-widest mb-8 opacity-90" suppressHydrationWarning>{eyebrow}</div>

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

        <div className="text-beige/80 text-lg md:text-xl font-sans mb-10 tracking-wide" suppressHydrationWarning>
          {subheading}
        </div>

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
          <Link
            href="/volunteer"
            className="border border-gold/70 text-gold px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-gold/10 transition-all"
          >
            Volunteer
          </Link>
        </div>

        <div className="label-caps text-gold/60 tracking-widest text-xs" suppressHydrationWarning>{urgency}</div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-px h-8 bg-gradient-to-b from-gold/60 to-transparent" />
        <svg className="w-4 h-4 text-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Image indicator dots */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {HERO_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className="transition-all duration-300"
            style={{
              width: currentIndex === idx ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: currentIndex === idx ? 'rgba(203, 163, 107, 0.9)' : 'rgba(203, 163, 107, 0.4)',
            }}
            aria-label={`Go to image ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
