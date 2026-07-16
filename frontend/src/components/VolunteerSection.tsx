import Link from 'next/link';

export default function VolunteerSection() {
  return (
    <section id="volunteer" className="py-20 px-6" style={{ background: 'linear-gradient(135deg,#301317 0%,#531c22 60%,#3b1f14 100%)' }}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-gold mb-3">Join the Team</p>
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-cream italic mb-4">Become a NAGARTA Volunteer</h2>
        <p className="text-beige/70 text-sm md:text-base max-w-2xl mx-auto mb-8">
          Help shape the next generation of leaders. Gain valuable experience, earn a Certificate of Service,
          and be part of a lasting legacy of youth development. Volunteers make the camp possible.
        </p>
        <Link
          href="/volunteer"
          className="inline-flex items-center gap-2 bg-gold text-maroon px-8 py-3.5 rounded-full text-sm font-bold tracking-wider uppercase hover:bg-amber-500 transition-colors shadow-lg"
        >
          Learn More
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
      </div>
    </section>
  );
}
