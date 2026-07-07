'use client';
import { useState } from 'react';

interface BankDetailsProps {
  referenceCode?: string;
  camperName?: string;
  compact?: boolean;
}

export default function BankDetails({ referenceCode, camperName, compact = false }: BankDetailsProps) {
  const [copied, setCopied] = useState<string>('');

  function copy(text: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(label);
        setTimeout(() => setCopied(''), 1500);
      });
    }
  }

  return (
    <div className={compact ? '' : 'max-w-xl mx-auto'}>
      {/* Reference number highlight */}
      {referenceCode && (
        <div className="mb-5 rounded-2xl border-2 border-gold bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-burgundy/70 mb-1">
            {camperName ? `${camperName}'s ` : ''}Reference Number
          </p>
          <button
            type="button"
            onClick={() => copy(referenceCode, 'ref')}
            className="text-2xl md:text-3xl font-mono font-bold text-maroon tracking-wide break-all hover:text-gold transition-colors"
            title="Click to copy"
          >
            {referenceCode}
          </button>
          <p className="text-[10px] text-burgundy/50 mt-1">{copied === 'ref' ? '✅ Copied!' : 'Tap to copy'}</p>
        </div>
      )}

      {/* Bank details card */}
      <div className="rounded-2xl border-2 border-emerald-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 text-white">
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            🏦 Bank Transfer Details
          </h3>
          <p className="text-xs text-white/80">Pay via bank transfer or mobile banking</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-burgundy/60">Account Name</p>
              <p className="text-base font-bold text-maroon">SOABAPA GREEN PROJECT</p>
            </div>
            <button
              type="button"
              onClick={() => copy('SOABAPA GREEN PROJECT', 'name')}
              className="text-xs text-emerald-600 font-semibold hover:text-emerald-800 flex-shrink-0"
            >
              {copied === 'name' ? '✅' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-burgundy/60">Account Number</p>
              <p className="text-xl font-mono font-bold text-maroon tracking-wider">1028000006418</p>
            </div>
            <button
              type="button"
              onClick={() => copy('1028000006418', 'number')}
              className="text-xs text-emerald-600 font-semibold hover:text-emerald-800 flex-shrink-0"
            >
              {copied === 'number' ? '✅' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Notice — reference warning */}
      <div className="mt-5 rounded-xl border-l-4 border-rose-500 bg-rose-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">⚠️ Payment Notice</p>
        <p className="text-xs text-rose-800 leading-relaxed">
          Use your child&apos;s reference number as your payment reference. This helps us match your payment
          to your child. Incorrect or missing references may delay payment confirmation.
        </p>
      </div>
    </div>
  );
}
