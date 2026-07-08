'use client';
import { useState } from 'react';

interface BankDetailsProps {
  referenceCode?: string;
  camperName?: string;
  compact?: boolean;
}

const ACCOUNT_NAME = 'SOABAPA GREEN PROJECT';
const ACCOUNT_NUMBER = '1028000006418';
const BANK_NAME = 'ACCESS BANK';

export default function BankDetails({ referenceCode, camperName }: BankDetailsProps) {
  const [copied, setCopied] = useState<string>('');

  function copy(text: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(label);
        setTimeout(() => setCopied(''), 1600);
      });
    }
  }

  return (
    <div className="w-full">
      {/* ── Reference ticket ─────────────────────────────── */}
      {referenceCode && (
        <button
          type="button"
          onClick={() => copy(referenceCode, 'ref')}
          className="group relative block w-full text-left mb-6 focus:outline-none"
        >
          {/* side notches */}
          <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/70 z-10" />
          <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/70 z-10" />
          <div
            className="relative overflow-hidden rounded-2xl px-5 py-4 transition-transform duration-300 group-hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 45%, #fcd34d 100%)',
              boxShadow: '0 12px 30px -10px rgba(203,163,107,0.65), inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            {/* dashed divider */}
            <span className="pointer-events-none absolute inset-y-3 left-1/2 border-l border-dashed border-amber-700/25" />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800/80 mb-0.5">
                  {camperName ? `${camperName}'s ` : ''}Reference
                </p>
                <p className="text-2xl md:text-3xl font-mono font-extrabold text-[#7a4a12] tracking-wide break-all leading-none">
                  {referenceCode}
                </p>
              </div>
              <span
                className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-md transition-colors"
                style={{ background: copied === 'ref' ? '#059669' : '#b45309' }}
              >
                {copied === 'ref' ? (
                  <>✓ Copied</>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </span>
            </div>
          </div>
        </button>
      )}

      {/* ── Bank transfer heading ────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #0f766e)' }}>
          <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-maroon leading-tight">Bank Transfer Details</p>
          <p className="text-[11px] text-burgundy/60 leading-tight">Transfer to the account below — no card needed</p>
        </div>
      </div>

      {/* ── The bank card ────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #0f766e 40%, #047857 70%, #064e3b 100%)',
          boxShadow: '0 25px 50px -12px rgba(6,95,70,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-52 h-52 rounded-full opacity-30 blur-2xl"
          style={{ background: 'radial-gradient(circle, #34d399, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-20 -left-10 w-52 h-52 rounded-full opacity-25 blur-2xl"
          style={{ background: 'radial-gradient(circle, #cba36b, transparent 70%)' }} />
        {/* diagonal sheen */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.10) 50%, transparent 60%)' }} />

        <div className="relative">
          {/* top row */}
          <div className="flex items-start justify-between mb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
              </svg>
              Bank Transfer
            </span>
            <span className="text-sm font-bold tracking-wide text-white drop-shadow-sm">{BANK_NAME}</span>
          </div>

          {/* account number */}
          <button
            type="button"
            onClick={() => copy(ACCOUNT_NUMBER, 'number')}
            className="block w-full text-left group mb-6"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 mb-1">Account Number</p>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <p className="text-xl sm:text-2xl md:text-3xl font-mono font-bold tracking-[0.08em] sm:tracking-[0.15em] text-white drop-shadow-sm break-all">
                {ACCOUNT_NUMBER}
              </p>
              <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 transition-colors ${copied === 'number' ? 'bg-emerald-300 text-emerald-900' : 'bg-white/15 text-white/80 group-hover:bg-white/25'}`}>
                {copied === 'number' ? '✓ Copied' : 'Copy'}
              </span>
            </div>
          </button>

          {/* bottom row: name + bank */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => copy(ACCOUNT_NAME, 'name')}
              className="text-left group w-full sm:min-w-0"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 mb-0.5">Account Name</p>
              <p className="text-sm md:text-base font-bold tracking-wide text-white break-words group-hover:text-amber-200 transition-colors">
                {ACCOUNT_NAME}
                <span className={`ml-2 inline-block align-middle text-[9px] font-bold uppercase rounded-full px-1.5 py-0.5 ${copied === 'name' ? 'bg-emerald-300 text-emerald-900' : 'bg-white/15 text-white/70'}`}>
                  {copied === 'name' ? '✓ Copied' : 'copy'}
                </span>
              </p>
            </button>
            <div className="flex-shrink-0 flex items-center gap-1.5 sm:block sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Currency</p>
              <p className="text-sm font-bold text-white">GH₵</p>
            </div>
          </div>
        </div>
      </div>

      {/* quick copy-all row */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: 'Name', value: ACCOUNT_NAME, key: 'name' },
          { label: 'Number', value: ACCOUNT_NUMBER, key: 'number' },
          { label: 'Bank', value: BANK_NAME, key: 'bank' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => copy(f.value, f.key)}
            className={`rounded-xl py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
              copied === f.key
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {copied === f.key ? '✓ Copied' : `Copy ${f.label}`}
          </button>
        ))}
      </div>

      {/* ── Payment notice ───────────────────────────────── */}
      <div className="mt-5 flex gap-3 rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fef3c7 100%)', border: '1px solid #fecdd3' }}>
        <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">Payment Notice</p>
          <p className="text-xs text-rose-900/80 leading-relaxed">
            Use your child&apos;s <strong>reference number</strong> as your payment reference. This helps us match
            your payment to your child. Incorrect or missing references may delay payment confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}
