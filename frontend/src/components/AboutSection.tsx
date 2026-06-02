'use client';
import Image from 'next/image';

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
            <div className="relative z-10 bg-beige rounded-lg overflow-hidden aspect-[4/5]">
              <Image
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=750&fit=crop"
                alt="NAGARTA Youth Camp - Young people engaged in camp activities"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
