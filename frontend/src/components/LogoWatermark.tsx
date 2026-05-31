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
      const scroll = window.scrollY;
      setOpacity(Math.max(0, 0.10 * (1 - scroll / heroHeight)));
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
