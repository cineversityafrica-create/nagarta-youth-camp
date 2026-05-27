import Link from 'next/link';

interface HeroProps {
  eyebrow: string;
  heading: string;
  subheading: string;
  urgency: string;
}

export default function HeroSection({ eyebrow, heading, subheading, urgency }: HeroProps) {
  const parts = heading.split(' & ');
  const firstWord = parts[0] || heading;
  const restWords = parts[1] ? `& ${parts[1]}` : '';

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden grain-overlay"
      style={{ background: 'linear-gradient(170deg, #301317 0%, #1a0a0e 60%, #0d0508 100%)' }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(83,28,34,0.5) 0%, transparent 70%)',
        }}
      />


      {/* Gold top rule */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="relative z-10 px-6 max-w-5xl mx-auto">
        {/* Eyebrow */}
        <p className="label-caps text-gold tracking-widest2 mb-8 opacity-90">{eyebrow}</p>

        {/* Main heading */}
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

        {/* Gold rule */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-px bg-gold/60" />
        </div>

        {/* Subheading */}
        <p className="text-beige/80 text-lg md:text-xl font-sans mb-10 tracking-wide">{subheading}</p>

        {/* CTAs */}
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

        {/* Urgency */}
        <p className="label-caps text-gold/60 tracking-widest text-xs">{urgency}</p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 animate-bounce">
        <div className="w-px h-8 bg-gradient-to-b from-gold/60 to-transparent" />
        <svg className="w-4 h-4 text-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
