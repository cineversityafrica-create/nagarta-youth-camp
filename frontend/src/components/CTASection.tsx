import Link from 'next/link';
import CountdownTimer from './CountdownTimer';

interface CTAProps {
  heading: string;
}

export default function CTASection({ heading }: CTAProps) {
  return (
    <section className="py-24 bg-burgundy relative overflow-hidden">
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(203,163,107,0.1) 10px, rgba(203,163,107,0.1) 11px)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <p className="label-caps text-gold/60 tracking-widest2 mb-6">Registration Open</p>
        <h2 className="font-serif text-5xl md:text-7xl font-semibold text-cream italic leading-tight mb-4">
          {heading}
        </h2>
        <p className="text-beige/60 text-sm tracking-widest uppercase mb-12">
          Camp opens in
        </p>

        <div className="mb-12">
          <CountdownTimer />
        </div>

        <Link
          href="/register"
          className="inline-block bg-gold text-maroon font-semibold px-10 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-amber-400 transition-all shadow-xl shadow-maroon/30"
        >
          Register Now
        </Link>
      </div>
    </section>
  );
}
