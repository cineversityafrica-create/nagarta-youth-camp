'use client';
import { useState } from 'react';

export default function GlowDivider() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative w-full flex items-center justify-center cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: '1px',
        background: '#301317',
      }}
    >
      {/* Single glowing line */}
      <div
        className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
        style={{
          height: '1px',
          width: hovered ? '80%' : '60%',
          background: hovered
            ? 'linear-gradient(to right, transparent 5%, rgba(251, 191, 36, 1) 50%, transparent 95%)'
            : 'linear-gradient(to right, transparent 10%, rgba(203, 163, 107, 0.6) 50%, transparent 90%)',
          boxShadow: hovered
            ? '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.5)'
            : '0 0 8px rgba(203, 163, 107, 0.3)',
        }}
      />
    </div>
  );
}
