import Link from 'next/link';

interface FooterProps {
  content: Record<string, string>;
}

export default function Footer({ content }: FooterProps) {
  const socials = [
    { key: 'social_instagram', label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
    { key: 'social_facebook', label: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
    { key: 'social_twitter', label: 'X', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
    { key: 'social_tiktok', label: 'TikTok', icon: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.52V6.76a4.85 4.85 0 01-1.02-.07z' },
  ];

  return (
    <footer className="bg-maroon pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-3xl font-semibold text-gold tracking-widest mb-3">NAGARTA</h3>
            <p className="text-beige/70 text-sm leading-relaxed mb-4">
              A transformative 5-day leadership experience for the next generation of African leaders.
            </p>
            <div className="flex gap-4">
              {socials.map(({ key, label, icon }) => (
                <a
                  key={key}
                  href={content[key] || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-beige/50 hover:text-gold transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d={icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="label-caps text-gold mb-4">Quick Links</p>
            <ul className="space-y-2">
              {[
                { href: '#about', label: 'About NAGARTA' },
                { href: '#experience', label: 'The Experience' },
                { href: '#schedule', label: 'Schedule' },
                { href: '/register', label: 'Register Now' },
                { href: '/contact', label: 'Contact Us' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-beige/70 hover:text-gold text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="label-caps text-gold mb-4">Contact</p>
            <div className="space-y-2 text-sm text-beige/70">
              <p>
                <a href={`mailto:${content.contact_email}`} className="hover:text-gold transition-colors">
                  {content.contact_email || 'info@nagartacamp.com'}
                </a>
              </p>
              <p>
                <a href={`tel:${content.contact_phone}`} className="hover:text-gold transition-colors">
                  {content.contact_phone || '+233 20 000 0000'}
                </a>
              </p>
              <p>{content.contact_address || 'Accra, Ghana'}</p>
              <p className="pt-2 text-beige/40 text-xs">
                {content.camp_dates || '19–23 December 2026'}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-burgundy pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-beige/40">
            &copy; {new Date().getFullYear()} NAGARTA Youth Camp. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-beige/40">
            <Link href="/contact" className="hover:text-gold transition-colors">Contact</Link>
            <Link href="/auth/sign-in" className="hover:text-gold transition-colors">Parent Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
