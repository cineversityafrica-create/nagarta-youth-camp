'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-maroon via-burgundy to-maroon flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-gold/30">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-cream italic mb-3">
            Something went wrong
          </h1>
          <p className="text-beige/80 text-sm mb-8 leading-relaxed">
            We&apos;re sorry, but something unexpected happened. Please try again, or return to the homepage.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="bg-gold text-maroon font-semibold px-6 py-3 rounded-full text-sm tracking-widest uppercase hover:bg-amber-400 transition-all"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="border border-gold/70 text-gold px-6 py-3 rounded-full text-sm tracking-widest uppercase hover:bg-gold/10 transition-all"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
