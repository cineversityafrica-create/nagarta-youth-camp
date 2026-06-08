'use client';
import { useState } from 'react';

export default function GlowDivider() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative w-full h-32 overflow-hidden cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(to bottom, #301317 0%, #531c22 50%, #301317 100%)',
      }}
    >
      {/* Top edge - golden glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px transition-all duration-700"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(203, 163, 107, 0.8), transparent)',
          boxShadow: hovered
            ? '0 0 30px rgba(203, 163, 107, 1), 0 0 60px rgba(251, 191, 36, 0.6)'
            : '0 0 15px rgba(203, 163, 107, 0.5)',
        }}
      />

      {/* Bottom edge - golden glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px transition-all duration-700"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(203, 163, 107, 0.8), transparent)',
          boxShadow: hovered
            ? '0 0 30px rgba(203, 163, 107, 1), 0 0 60px rgba(251, 191, 36, 0.6)'
            : '0 0 15px rgba(203, 163, 107, 0.5)',
        }}
      />

      {/* Animated light beam that crosses on hover */}
      <div
        className="absolute top-0 bottom-0 transition-all duration-1000 ease-out"
        style={{
          width: '300px',
          left: hovered ? '100%' : '-300px',
          background: 'linear-gradient(to right, transparent, rgba(203, 163, 107, 0.4), rgba(251, 191, 36, 0.6), rgba(203, 163, 107, 0.4), transparent)',
          filter: 'blur(20px)',
          transform: 'skewX(-15deg)',
        }}
      />

      {/* Center decorative element */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative transition-all duration-500"
          style={{
            transform: hovered ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          {/* Glowing dot in center */}
          <div
            className="w-3 h-3 rounded-full transition-all duration-500"
            style={{
              background: hovered
                ? 'radial-gradient(circle, #fbbf24 0%, #f59e0b 40%, #cba36b 100%)'
                : 'radial-gradient(circle, #cba36b 0%, rgba(203,163,107,0.5) 100%)',
              boxShadow: hovered
                ? '0 0 30px rgba(251, 191, 36, 1), 0 0 60px rgba(251, 191, 36, 0.6), 0 0 90px rgba(251, 191, 36, 0.3)'
                : '0 0 15px rgba(203, 163, 107, 0.5)',
            }}
          />

          {/* Pulsing ring */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-500 pointer-events-none"
            style={{
              border: '1px solid rgba(203, 163, 107, 0.5)',
              animation: hovered ? 'glowPulse 1.5s ease-out infinite' : 'none',
            }}
          />

          {/* Outer glow ring */}
          <div
            className="absolute -inset-4 rounded-full opacity-0 transition-opacity duration-500"
            style={{
              border: '1px solid rgba(251, 191, 36, 0.4)',
              opacity: hovered ? 1 : 0,
              animation: hovered ? 'glowPulse 2s ease-out infinite' : 'none',
            }}
          />
        </div>
      </div>

      {/* Side decorative dashes - light up on hover */}
      <div className="absolute inset-0 flex items-center justify-center gap-4 pointer-events-none">
        <div
          className="h-px transition-all duration-700"
          style={{
            width: hovered ? '100px' : '60px',
            background: hovered
              ? 'linear-gradient(to right, transparent, #fbbf24)'
              : 'linear-gradient(to right, transparent, rgba(203, 163, 107, 0.4))',
            boxShadow: hovered ? '0 0 10px rgba(251, 191, 36, 0.8)' : 'none',
          }}
        />
        <div className="w-20" />
        <div
          className="h-px transition-all duration-700"
          style={{
            width: hovered ? '100px' : '60px',
            background: hovered
              ? 'linear-gradient(to left, transparent, #fbbf24)'
              : 'linear-gradient(to left, transparent, rgba(203, 163, 107, 0.4))',
            boxShadow: hovered ? '0 0 10px rgba(251, 191, 36, 0.8)' : 'none',
          }}
        />
      </div>

      {/* Light rays radiating from center on hover */}
      {hovered && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="absolute w-full h-full"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.2) 0%, transparent 50%)',
              animation: 'fadeIn 0.5s ease-out',
            }}
          />
        </div>
      )}
    </div>
  );
}
