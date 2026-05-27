'use client';
import { useEffect, useState } from 'react';

const CAMP_DATE = new Date('2026-12-19T08:00:00');

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calculate() {
      const diff = CAMP_DATE.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: 'Days',    value: timeLeft.days },
    { label: 'Hours',   value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-4 md:gap-8">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-start gap-4">
          <div className="text-center">
            <div className="countdown-digit">{pad(value)}</div>
            <p className="label-caps text-gold/50 mt-2">{label}</p>
          </div>
          {i < units.length - 1 && (
            <span className="text-4xl md:text-5xl font-serif text-gold/40 mt-1">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
