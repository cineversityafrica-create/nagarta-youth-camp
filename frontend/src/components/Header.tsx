'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getStoredUser, clearAuth } from '@/lib/auth';

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#schedule', label: 'Schedule' },
  { href: '/register', label: 'Register' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashboardHref = user?.role === 'PARENT' ? '/dashboard/parent' : '/dashboard/camper';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-maroon/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
          <Image src="/logo.png" alt="NAGARTA Youth Camp" width={48} height={48} priority className="object-contain" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-cream/80 hover:text-gold text-sm tracking-wide transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="text-cream/80 hover:text-gold text-sm tracking-wide transition-colors"
              >
                {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={() => { clearAuth(); setUser(null); window.location.href = '/'; }}
                className="text-xs text-beige/60 hover:text-gold transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/sign-in"
              className="border border-gold text-gold px-5 py-2 rounded-full text-sm font-medium tracking-wider hover:bg-gold hover:text-maroon transition-all"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-cream p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-maroon border-t border-burgundy px-6 pb-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-cream/80 hover:text-gold text-sm tracking-wide transition-colors py-2"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link href={dashboardHref} className="block text-gold text-sm">My Dashboard</Link>
          ) : (
            <Link href="/auth/sign-in" className="block border border-gold text-gold px-4 py-2 rounded-full text-sm text-center font-medium">
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
