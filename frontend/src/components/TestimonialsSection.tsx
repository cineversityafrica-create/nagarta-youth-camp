const speakers = [
  {
    quote: 'Visually impaired but not vision impaired; Inspiring hope; creating possibilities in the midst of challenges.',
    name: 'Ivan Heathcote - Fumador',
    role: 'Head of Academics, Abofra World School',
    initials: 'IH',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    glow: 'rgba(251, 146, 60, 0.5)',
  },
  {
    quote: 'To meet young hearts and minds; each with a teachable spirit.',
    name: 'Yaw Okraku-Yirenkyi, PhD',
    credentials: 'MIEEE, MGhIE, MACM',
    role: 'Director (RiSE) & Founding Member (GRAF)',
    initials: 'YO',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    glow: 'rgba(20, 184, 166, 0.5)',
  },
  {
    quote: 'Inspiring curiosity, creativity, and purpose; cultivating critical thinking and problem-solving.',
    name: 'Francis Feehi Torgbor, PhD',
    role: 'Founding Director, AMI Ghana & GHAIDEMS Ltd',
    initials: 'FT',
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
    glow: 'rgba(168, 85, 247, 0.5)',
  },
  {
    quote: 'Empowering the next generation through faith, integrity, and excellence — preparing leaders for purposeful impact.',
    name: 'Distinguished Speaker',
    role: 'Featured Mentor & Guest Speaker',
    initials: 'DS',
    gradient: 'from-blue-400 via-indigo-500 to-purple-600',
    glow: 'rgba(99, 102, 241, 0.5)',
  },
  {
    quote: null, // Mystery speaker - to be revealed
    name: 'Surprise Speaker',
    role: 'Identity to be revealed soon...',
    initials: '?',
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    glow: 'rgba(107, 114, 128, 0.5)',
    mystery: true,
  },
];

interface SpeakerType {
  quote: string | null;
  name: string;
  credentials?: string;
  role: string;
  initials: string;
  gradient: string;
  glow: string;
  mystery?: boolean;
}

function SpeakerCard({ s }: { s: SpeakerType }) {
  if (s.mystery) {
    return (
      <div
        className="relative rounded-2xl p-8 border-2 border-dashed border-gold/40 backdrop-blur-sm hover:border-gold/80 transition-all duration-500 hover:scale-105 group overflow-hidden"
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          background: 'linear-gradient(135deg, rgba(83,28,34,0.4) 0%, rgba(48,19,23,0.6) 100%)',
        }}
      >
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{ animation: 'shimmer 2s linear infinite' }}></div>

        <div className="relative">
          {/* Mystery avatar */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border-2 border-gold/30 shadow-lg">
            <span className="text-5xl font-bold text-gold/70">?</span>
          </div>

          {/* Lock icon */}
          <div className="text-center mb-3">
            <svg className="w-6 h-6 text-gold/50 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <p className="font-serif italic text-cream/60 text-base text-center leading-relaxed mb-6 blur-sm select-none">
            ●●●●●● ●●●●●●● ●●●●●●●●● ●●●●●●●● ●●●●●●●●● ●●●●●●●
          </p>

          <div className="border-t border-burgundy/40 pt-4 text-center">
            <p className="font-semibold text-gold text-sm mb-1" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{s.name}</p>
            <p className="text-xs text-cream/40 italic" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{s.role}</p>
          </div>

          {/* Coming Soon Badge */}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-gold to-amber-600 text-maroon text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full shadow-lg">
            Coming Soon
          </div>
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:scale-105 group overflow-hidden"
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(83,28,34,0.3) 100%)',
        border: '1px solid rgba(203,163,107,0.25)',
        boxShadow: `0 20px 40px -10px ${s.glow}, 0 0 0 1px rgba(255,255,255,0.05) inset`,
      }}
    >
      {/* Speaker initials avatar */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className={`w-16 h-16 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-xl flex-shrink-0`}
          style={{ boxShadow: `0 8px 20px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.3)` }}
        >
          <span className="text-2xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {s.initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gold text-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{s.name}</p>
          {s.credentials && (
            <p className="text-[11px] text-gold/70 mt-0.5" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{s.credentials}</p>
          )}
        </div>
      </div>

      {/* Quote */}
      <div className="relative">
        <div className={`absolute -top-2 -left-2 text-4xl bg-gradient-to-br ${s.gradient} bg-clip-text text-transparent leading-none opacity-50 select-none`}>
          &ldquo;
        </div>
        <p className="text-cream/95 text-sm leading-relaxed pl-6 italic" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          {s.quote}
        </p>
      </div>

      {/* Role */}
      <div className="mt-5 pt-4 border-t border-burgundy/50">
        <p className="text-xs text-cream/60 leading-relaxed" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          {s.role}
        </p>
      </div>

      {/* Speaker badge */}
      <div className={`absolute top-3 right-3 bg-gradient-to-r ${s.gradient} text-white text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full shadow-lg`}>
        ★ Speaker
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="relative py-24 overflow-hidden" style={{
      background: 'linear-gradient(135deg, #301317 0%, #1a0a0e 50%, #301317 100%)',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }}>
      {/* Decorative background blobs */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-br from-amber-500/20 to-rose-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-violet-500/15 to-purple-500/15 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{
            background: 'linear-gradient(135deg, #cba36b, #fbbf24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }} suppressHydrationWarning>
            ✨ Anticipation
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-cream italic mb-3">
            Meet Our Speakers
          </h2>
          <p className="text-base text-cream/70 max-w-2xl mx-auto" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            Distinguished mentors and visionaries who will inspire, challenge, and equip our young leaders.
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-6" />
        </div>

        {/* Top row — 3 speakers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {speakers.slice(0, 3).map((s, i) => (
            <SpeakerCard key={i} s={s} />
          ))}
        </div>

        {/* Bottom row — 2 speakers centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {speakers.slice(3).map((s, i) => (
            <SpeakerCard key={i + 3} s={s} />
          ))}
        </div>

        {/* More speakers coming */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-burgundy/40 border border-gold/30 backdrop-blur-sm">
            <svg className="w-5 h-5 text-gold animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <p className="text-sm text-gold font-semibold" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              More distinguished speakers to be announced
            </p>
            <svg className="w-5 h-5 text-gold animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
