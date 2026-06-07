import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-maroon via-burgundy to-maroon flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-gold/30">
          <p className="font-serif text-8xl font-bold text-gold italic mb-2">404</p>
          <h1 className="font-serif text-3xl font-semibold text-cream italic mb-3">
            Page Not Found
          </h1>
          <p className="text-beige/80 text-sm mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-block bg-gold text-maroon font-semibold px-8 py-3 rounded-full text-sm tracking-widest uppercase hover:bg-amber-400 transition-all"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
