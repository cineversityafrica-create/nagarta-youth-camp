'use client';
import Image from 'next/image';

/**
 * Animated camp photo.
 * Stays invisible for 7 seconds, then slides in with a rotation + fade over 7 seconds.
 * Placed right after the site logo / hero section.
 */
export default function CampDrawingPhoto() {
  return (
    <section className="relative bg-maroon overflow-hidden py-6 md:py-10">
      {/* Decorative gold rule top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 md:gap-14">

        {/* Animated image — invisible for 7 s, then slides in with rotation */}
        <div className="camp-photo-animate w-full md:w-1/2 flex-shrink-0">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-4 ring-gold/20">
            <Image
              src="/camp-hero-4.jpg"
              alt="NAGARTA camp activity"
              width={720}
              height={480}
              className="w-full h-auto object-cover"
              priority
            />
            {/* Subtle gold vignette overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(203,163,107,0.08) 0%, transparent 60%)',
              }}
            />
          </div>
        </div>

        {/* Text alongside the photo — fades in together */}
        <div className="camp-photo-animate w-full md:w-1/2 text-center md:text-left">
          <p className="label-caps text-gold mb-3 tracking-widest">Creativity in Action</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-cream italic mb-4 leading-tight">
            Where Young Minds Come Alive
          </h2>
          <p className="text-beige/70 text-base leading-relaxed mb-6">
            At NAGARTA Youth Camp, every camper is encouraged to dream, create and
            express themselves. From art and music to leadership drills — there is
            something extraordinary waiting for every young person.
          </p>
          <a
            href="/auth/sign-up"
            className="inline-block bg-gold text-maroon font-semibold px-7 py-3 rounded-full text-sm tracking-widest uppercase hover:bg-amber-400 transition-all shadow-lg shadow-gold/20"
          >
            Join the Camp
          </a>
        </div>
      </div>

      {/* Decorative gold rule bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </section>
  );
}
