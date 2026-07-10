'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { USD_TO_GHS, formatGhs } from '@/lib/pricing';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    PaystackPop?: any;
  }
}

interface PaystackButtonProps {
  email: string;
  amountUsd: number;
  referenceCode: string;
  packageName?: string; // 'Early Bird' | 'Regular'
  camperName?: string;
  onPaid?: () => void;
}

export default function PaystackButton({
  email,
  amountUsd,
  referenceCode,
  packageName = 'Regular',
  camperName,
  onPaid,
}: PaystackButtonProps) {
  const router = useRouter();
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Paystack inline script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.PaystackPop) { setReady(true); return; }
    const existing = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
    if (existing) {
      existing.addEventListener('load', () => setReady(true));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.async = true;
    s.onload = () => setReady(true);
    s.onerror = () => setError('Could not load the secure payment window. Check your connection or use bank transfer.');
    document.body.appendChild(s);
  }, []);

  function pay() {
    setError('');
    if (!publicKey) { setError('Online payment is not set up yet. Please use bank transfer below.'); return; }
    if (!email) { setError('We need your email to pay online. Please use bank transfer, or sign in first.'); return; }
    if (!ready || !window.PaystackPop) { setError('The secure payment window is still loading — please try again in a moment.'); return; }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email,
      amount: Math.round(amountUsd * USD_TO_GHS * 100), // charged in cedis (pesewas)
      currency: 'GHS',
      ref: `${referenceCode}_${Date.now()}`,
      metadata: {
        referenceCode,
        package: packageName,
        custom_fields: [
          { display_name: 'Camper', variable_name: 'camper', value: camperName || '' },
          { display_name: 'Reference', variable_name: 'reference_code', value: referenceCode },
        ],
      },
      callback: function (response: any) {
        setLoading(true);
        fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: response.reference }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d?.success) {
              if (onPaid) onPaid();
              else router.push('/dashboard/parent');
            } else {
              setError(d?.error || 'We could not confirm your payment. If you were charged, please contact us.');
              setLoading(false);
            }
          })
          .catch(() => {
            setError('We could not confirm your payment. If you were charged, please contact us.');
            setLoading(false);
          });
      },
      onClose: function () {
        // Parent closed the popup without paying — no action needed
      },
    });
    handler.openIframe();
  }

  return (
    <div>
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg transition-all disabled:opacity-60"
      >
        {loading ? (
          'Confirming payment…'
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay {formatGhs(amountUsd * USD_TO_GHS)} Online (Card / Mobile Money)
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-rose-600 font-medium text-center">{error}</p>}
    </div>
  );
}
