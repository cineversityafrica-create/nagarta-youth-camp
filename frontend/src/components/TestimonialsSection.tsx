const testimonials = [
  {
    quote: "NAGARTA didn't just give me leadership skills — it gave me the confidence to believe I was born to lead. That week in December changed my life.",
    name: 'Akosua M.',
    detail: 'NAGARTA 2025 Alumna · Accra',
  },
  {
    quote: "The mentorship sessions were unlike anything I experienced in school. Industry leaders poured into us with no holding back. I left with a vision, a team, and a plan.",
    name: 'Kofi A.',
    detail: 'NAGARTA 2025 Alumnus · Kumasi',
  },
  {
    quote: "As a parent, I was skeptical. But what my son came back with — the discipline, the fire in his eyes — was worth every cedi of the registration fee.",
    name: 'Mrs. Owusu-Darkwah',
    detail: 'Parent of NAGARTA 2025 Camper',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-maroon">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="label-caps text-gold/60 tracking-widest2 mb-4">Voices</p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-cream italic">
            Transformed Lives
          </h2>
          <div className="gold-divider mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-burgundy/30 border border-burgundy rounded-lg p-8 hover:border-gold/40 transition-colors"
            >
              {/* Gold quote mark */}
              <div className="font-serif text-6xl text-gold/30 leading-none mb-4 select-none">&ldquo;</div>
              <p className="font-serif italic text-cream/90 text-lg leading-relaxed mb-6">{t.quote}</p>
              <div className="border-t border-burgundy pt-4">
                <p className="font-semibold text-gold text-sm">{t.name}</p>
                <p className="text-xs text-cream/40 mt-1">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
