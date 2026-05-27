import type { ScheduleDay } from '@/lib/api';

interface ScheduleProps {
  days: ScheduleDay[];
}

export default function ScheduleSection({ days }: ScheduleProps) {
  return (
    <section id="schedule" className="py-24 bg-cream">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="label-caps text-burgundy tracking-widest2 mb-4">Programme</p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-maroon italic">
            Five Days of Transformation
          </h2>
          <div className="gold-divider mx-auto mt-6" />
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Gold vertical line — left on mobile, centered on desktop */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/80 via-gold/40 to-transparent" />

          <div className="space-y-10 md:space-y-12">
            {days.map((day, idx) => (
              <div
                key={day.id}
                className={`relative flex flex-col md:flex-row md:items-center gap-4 md:gap-6 pl-12 md:pl-0 ${
                  idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Mobile dot aligned to left-4 line */}
                <div className="md:hidden absolute left-[10px] top-3 w-3 h-3 rounded-full border-2 border-gold bg-cream z-10" />

                {/* Day pill */}
                <div className={`flex-shrink-0 z-10 ${
                  idx % 2 === 0 ? 'md:ml-auto md:order-2' : 'md:mr-auto md:order-2'
                }`}>
                  <div className="flex items-center gap-3 md:flex-col md:items-center">
                    <span className="bg-burgundy text-gold text-xs font-bold tracking-widest px-4 py-2 rounded-full uppercase shadow-md">
                      Day {day.dayNumber}
                    </span>
                    <span className="text-xs text-maroon/50 font-medium md:mt-1">{day.date}</span>
                  </div>
                </div>

                {/* Content card */}
                <div className={`flex-1 bg-white border border-beige rounded-lg p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow ${
                  idx % 2 === 0 ? 'md:order-1 md:text-right' : 'md:order-3 md:text-left'
                }`}>
                  <h3 className="font-serif text-lg md:text-xl font-semibold text-maroon mb-2">{day.title}</h3>
                  <p className="text-sm text-maroon/65 leading-relaxed">{day.summary}</p>
                </div>

                {/* Desktop dot on the center line */}
                <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-gold bg-cream z-10 order-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
