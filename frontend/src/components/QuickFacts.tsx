interface QuickFactsProps {
  location: string;
  duration: string;
  venue: string;
}

export default function QuickFacts({ location, duration, venue }: QuickFactsProps) {
  const facts = [
    { label: 'Location', value: location },
    { label: 'Duration', value: duration },
    { label: 'Venue', value: venue },
  ];

  return (
    <div className="bg-burgundy">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-maroon/40">
          {facts.map((fact) => (
            <div key={fact.label} className="py-8 px-8 text-center">
              <p className="label-caps text-gold/60 mb-2">{fact.label}</p>
              <p className="font-serif text-xl text-cream font-semibold">{fact.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
