import Link from 'next/link';

/**
 * Landing page for a shareable poster link. The poster is the social preview
 * (set via each page's Open Graph metadata); this is what a person sees after
 * they tap the link — the poster plus a clear path into the site.
 */
export default function SharePoster({ image, alt }: { image: string; alt: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8" style={{ background: 'linear-gradient(160deg,#301317 0%,#1a0a0e 70%,#0d0508 100%)' }}>
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Poster — the whole image is a link into registration */}
        <Link href="/register" aria-label="Reserve a spot at NAGARTA Youth Camp" className="w-full block rounded-2xl overflow-hidden shadow-2xl border border-gold/20 transition-transform hover:scale-[1.01]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={alt} className="w-full h-auto block" />
        </Link>

        {/* Actions */}
        <div className="w-full mt-6 flex flex-col gap-3">
          <Link
            href="/register"
            className="w-full text-center bg-gold text-maroon font-bold py-4 rounded-full text-sm tracking-widest uppercase hover:bg-amber-400 transition-colors shadow-lg shadow-gold/20"
          >
            Reserve a Spot
          </Link>
          <Link
            href="/"
            className="w-full text-center border border-gold/50 text-gold py-3.5 rounded-full text-sm tracking-widest uppercase hover:bg-gold/10 transition-colors"
          >
            Visit Website
          </Link>
        </div>

        <p className="text-beige/40 text-xs text-center mt-6 tracking-wide">
          NAGARTA Youth Camp • 19–23 December 2026 • Accra, Ghana
        </p>
      </div>
    </div>
  );
}
