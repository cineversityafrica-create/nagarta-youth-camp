'use client';
import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

// Renders the camper's reference code as a Code128 barcode the check-in station
// can scan. Shows the code as text underneath too.
export default function Barcode({ value, className }: { value: string; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 13,
        height: 46,
        margin: 6,
        background: '#ffffff',
        lineColor: '#301317',
      });
    } catch {
      /* invalid value — ignore */
    }
  }, [value]);

  return <svg ref={ref} className={className} />;
}
