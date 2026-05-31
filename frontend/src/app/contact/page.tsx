'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { submitContactMessage } from '@/lib/api';

const inputClass = 'w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold';
const labelClass = 'block label-caps text-burgundy mb-1.5';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function handleChange(field: string, val: string) {
    setForm((p) => ({ ...p, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitContactMessage(form);
      setSuccess(true);
    } catch {
      setError('Failed to send message. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <div className="bg-maroon py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/"><Image src="/logo-full.png" alt="NAGARTA" width={40} height={40} className="object-contain" /></Link>
          <Link href="/" className="text-xs text-beige/50 hover:text-gold transition-colors">&larr; Back to home</Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="label-caps text-gold tracking-widest2 mb-4">Get in Touch</p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-maroon italic">Contact Us</h1>
          <div className="gold-divider mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Contact form */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-beige p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-maroon mb-6 italic">Send a Message</h2>

            {success ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-serif text-xl text-maroon italic">Message sent!</p>
                <p className="text-sm text-burgundy mt-2">We&apos;ll get back to you within 24–48 hours.</p>
                <button
                  onClick={() => { setSuccess(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                  className="mt-6 text-xs text-gold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">{error}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input type="text" required value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ama Mensah" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" required value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="you@example.com" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Phone (optional)</label>
                    <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+233 20 000 0000" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Subject</label>
                    <input type="text" value={form.subject} onChange={e => handleChange('subject', e.target.value)} placeholder="Registration enquiry" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Message</label>
                  <textarea
                    required rows={5}
                    value={form.message}
                    onChange={e => handleChange('message', e.target.value)}
                    placeholder="How can we help?"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-maroon font-semibold py-4 rounded-lg tracking-widest uppercase text-sm hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-maroon rounded-xl p-7 text-cream">
              <h3 className="font-serif text-xl font-semibold text-gold mb-6">Contact Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="label-caps text-gold/50 mb-1">Email</p>
                  <a href="mailto:info@nagartacamp.com" className="text-beige hover:text-gold transition-colors text-sm">
                    info@nagartacamp.com
                  </a>
                </div>
                <div>
                  <p className="label-caps text-gold/50 mb-1">Phone</p>
                  <a href="tel:+233200000000" className="text-beige hover:text-gold transition-colors text-sm">
                    +233 20 000 0000
                  </a>
                </div>
                <div>
                  <p className="label-caps text-gold/50 mb-1">Location</p>
                  <p className="text-beige text-sm">Accra, Ghana</p>
                </div>
                <div>
                  <p className="label-caps text-gold/50 mb-1">Camp Dates</p>
                  <p className="text-beige text-sm">19–23 December 2026</p>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-beige rounded-xl p-6 border border-beige text-center">
              <div className="w-full h-48 bg-maroon/10 rounded-lg flex items-center justify-center mb-3">
                <div className="text-center">
                  <svg className="w-10 h-10 text-burgundy/30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-xs text-burgundy/50">Accra, Ghana</p>
                </div>
              </div>
              <p className="text-xs text-burgundy/60">Venue details will be shared with registered participants</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
