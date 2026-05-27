interface AboutProps {
  heading: string;
  para1: string;
  para2: string;
  para3: string;
}

export default function AboutSection({ heading, para1, para2, para3 }: AboutProps) {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text column */}
          <div>
            <p className="label-caps text-gold tracking-widest2 mb-4">About NAGARTA</p>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-maroon italic leading-tight mb-6">
              {heading}
            </h2>
            <div className="w-16 h-px bg-gold mb-8" />
            <div className="space-y-5 text-maroon/75 leading-relaxed text-base">
              <p>{para1}</p>
              <p>{para2}</p>
              <p className="italic text-burgundy font-medium">{para3}</p>
            </div>
          </div>

          {/* Image column */}
          <div className="relative">
            {/* Gold frame */}
            <div className="absolute -top-4 -right-4 w-full h-full border-2 border-gold rounded-lg z-0" />
            <div className="relative z-10 bg-beige rounded-lg overflow-hidden aspect-[4/5] flex items-center justify-center">
              <div className="text-center p-12">
                <div className="w-24 h-24 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-burgundy/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs tracking-widest uppercase text-burgundy/50 font-semibold">Camp Photo</p>
                <p className="text-xs text-burgundy/30 mt-1">NAGARTA 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
