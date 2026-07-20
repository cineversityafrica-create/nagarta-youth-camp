'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LogoWatermark() {
  const [opacity, setOpacity] = useState(0.10);
  const [size, setSize] = useState(1200);

  useEffect(() => {
    function calculateSize() {
      // Responsive: fill ~150% of the smaller viewport dimension, max 1200px
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      setSize(Math.min(vmin * 1.5, 1200));
    }

    function onScroll() {
      const heroHeight = window.innerHeight;
      // innerHeight can be 0 during hydration or in a hidden tab. That makes
      // scroll/heroHeight 0/0 = NaN, and Math.max(0, NaN) is NaN — which React
      // then writes out as `opacity: NaN`. Bail out while the height is unusable.
      if (!heroHeight) return;
      const next = 0.1 * (1 - window.scrollY / heroHeight);
      setOpacity(Number.isFinite(next) ? Math.min(0.1, Math.max(0, next)) : 0);
    }

    calculateSize();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', calculateSize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', calculateSize);
    };
  }, []);

  if (opacity === 0) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          opacity,
          mixBlendMode: 'screen',
          maskImage: 'radial-gradient(ellipse 55% 55% at 50% 50%, black 30%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse 55% 55% at 50% 50%, black 30%, transparent 72%)',
          transition: 'opacity 0.1s linear',
        }}
      >
        <Image src="/logo-full.png" alt="" fill style={{ objectFit: 'contain' }} />
      </div>
    </div>
  );
}
