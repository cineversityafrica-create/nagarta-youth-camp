'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fileToCompressedDataUrl } from '@/lib/image';

const MAX_DIM = 1400;
const QUALITY = 0.8;

interface Props {
  label: string;
  hint?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  /** 'environment' = rear camera (documents), 'user' = front camera (selfie). */
  facing?: 'environment' | 'user';
  previewClass?: string;
}

/**
 * Upload an image or capture one with the device camera.
 *
 * The camera opens in-page via getUserMedia so it works on laptops too; if that
 * is unavailable or the user blocks it, we fall back to a file input carrying
 * `capture`, which opens the native camera app on phones.
 */
export default function PhotoCapture({ label, hint, value, onChange, facing = 'environment', previewClass = 'w-44 h-28' }: Props) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const fallbackRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOpen, setCamOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  useEffect(() => {
    if (!camOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch {
        if (cancelled) return;
        setCamOpen(false);
        fallbackRef.current?.click(); // phones: native camera app
      }
    })();
    return () => { cancelled = true; };
  }, [camOpen, facing]);

  function openCam() {
    setErr('');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      fallbackRef.current?.click();
      return;
    }
    setCamOpen(true);
  }

  function closeCam() { stopStream(); setCamOpen(false); }

  function shoot() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    let w = v.videoWidth;
    let h = v.videoHeight;
    if (w > MAX_DIM || h > MAX_DIM) {
      if (w >= h) { h = Math.round((h * MAX_DIM) / w); w = MAX_DIM; }
      else { w = Math.round((w * MAX_DIM) / h); h = MAX_DIM; }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facing === 'user') { ctx.translate(w, 0); ctx.scale(-1, 1); } // un-mirror the selfie
    ctx.drawImage(v, 0, 0, w, h);
    onChange(canvas.toDataURL('image/jpeg', QUALITY));
    closeCam();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file after a removal
    if (!file) return;
    setErr('');
    if (file.size > 15 * 1024 * 1024) { setErr('That image is over 15MB. Please choose a smaller one.'); return; }
    try {
      onChange(await fileToCompressedDataUrl(file, MAX_DIM, QUALITY));
    } catch {
      setErr('Could not read that image. Please try another one.');
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold tracking-wider uppercase text-gold mb-1.5">{label}</label>
      <input ref={uploadRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      <input ref={fallbackRef} type="file" accept="image/*" capture={facing} onChange={onFile} className="hidden" />

      {value ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className={`${previewClass} object-cover rounded-lg border border-white/25`} />
          <div className="flex flex-col gap-2">
            <button type="button" onClick={openCam} className="text-xs px-3 py-1.5 rounded-full border border-white/25 text-cream/80 hover:bg-white/10 transition-colors">Retake</button>
            <button type="button" onClick={() => uploadRef.current?.click()} className="text-xs px-3 py-1.5 rounded-full border border-white/25 text-cream/80 hover:bg-white/10 transition-colors">Replace</button>
            <button type="button" onClick={() => onChange('')} className="text-xs px-3 py-1.5 rounded-full border border-white/25 text-cream/50 hover:bg-white/10 transition-colors">Remove</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={() => uploadRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-white/30 text-cream/80 text-xs hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload
          </button>
          <button type="button" onClick={openCam} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-white/30 text-cream/80 text-xs hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Take Photo
          </button>
        </div>
      )}

      {hint && <p className="text-[11px] text-cream/40 mt-1.5">{hint}</p>}
      {err && <p className="text-xs text-red-300 mt-1.5">{err}</p>}

      {camOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4" role="dialog" aria-modal="true">
          <p className="text-cream text-sm font-semibold mb-3">{label}</p>
          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden border border-white/20 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full block"
              style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
            />
            {!ready && <div className="absolute inset-0 flex items-center justify-center text-cream/70 text-sm">Starting camera…</div>}
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button type="button" onClick={closeCam} className="px-5 py-2.5 rounded-full border border-white/30 text-cream/80 text-sm hover:bg-white/10 transition-colors">Cancel</button>
            <button type="button" onClick={shoot} disabled={!ready} className="px-7 py-2.5 rounded-full bg-gold text-maroon text-sm font-bold tracking-wider uppercase hover:bg-amber-500 transition-colors disabled:opacity-40">Capture</button>
          </div>
        </div>
      )}
    </div>
  );
}
