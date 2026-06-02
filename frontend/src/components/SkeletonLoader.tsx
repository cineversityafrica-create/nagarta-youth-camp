'use client';

/**
 * SkeletonLoader Component
 * Reusable animated placeholder for loading states
 * Shows a pulsing gradient animation while content loads
 */

interface SkeletonLoaderProps {
  /** Number of skeleton lines to show (default: 3) */
  lines?: number;
  /** Whether to show a full card with padding (default: false) */
  variant?: 'lines' | 'card' | 'table';
  /** Additional CSS classes */
  className?: string;
}

export default function SkeletonLoader({
  lines = 3,
  variant = 'lines',
  className = ''
}: SkeletonLoaderProps) {
  // Animated gradient background
  const skeletonBg = 'bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse';

  if (variant === 'card') {
    return (
      <div className={`rounded-xl border border-beige p-6 ${className}`}>
        {/* Header skeleton */}
        <div className={`${skeletonBg} h-6 rounded w-2/3 mb-4`}></div>

        {/* Content skeleton lines */}
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className={`${skeletonBg} h-4 rounded`}></div>
          ))}
        </div>

        {/* Button skeleton */}
        <div className={`${skeletonBg} h-10 rounded-lg w-32 mt-6`}></div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`rounded-xl border border-gray-100 overflow-hidden ${className}`}>
        {/* Header row */}
        <div className="bg-gray-50 p-4 flex gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`${skeletonBg} h-4 flex-1 rounded`}></div>
          ))}
        </div>

        {/* Body rows */}
        {[1, 2, 3].map((row) => (
          <div key={row} className="p-4 border-b border-gray-100 flex gap-4">
            {[1, 2, 3, 4, 5, 6].map((col) => (
              <div key={col} className={`${skeletonBg} h-4 flex-1 rounded`}></div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Default: lines variant
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${skeletonBg} h-4 rounded ${
            i === lines - 1 ? 'w-5/6' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
}
