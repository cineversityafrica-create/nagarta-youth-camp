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
      // Validate before sending
      if (form.name.length < 2) throw new Error('Please enter your full name (at least 2 characters)');
      if (!form.email.includes('@')) throw new Error('Please enter a valid email address');
      if (form.message.length < 10) throw new Error('Please enter a message (at least 10 characters)');

      await submitContactMessage(form);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message. Please try again or email us directly.';
      setError(message);
      console.error('Contact form error:', err);
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
                  <a href="mailto:info@nagartayouthcamp.tech" className="text-beige hover:text-gold transition-colors text-sm">
                    info@nagartayouthcamp.tech
                  </a>
                </div>
                <div>
                  <p className="label-caps text-gold/50 mb-1">Phone</p>
                  <div className="text-beige text-sm space-y-1">
                    <p>0550 17 17 17</p>
                    <p>0243 60 88 72</p>
                  </div>
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

            {/* Map section */}
            <div className="bg-beige rounded-xl overflow-hidden border border-beige">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.8287408936566!2d-0.20689!3d5.5520!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9a2a5da5a5a5d%3A0x5a5a5a5a5a5a5a5a!2sAccra%2C%20Ghana!5e0!3m2!1sen!2sgh!4v1234567890"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
              <div className="p-6 text-center bg-white">
                <p className="text-sm font-semibold text-maroon mb-2">📍 Accra, Ghana</p>
                <p className="text-xs text-burgundy/60">Specific venue details will be shared with registered participants</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
