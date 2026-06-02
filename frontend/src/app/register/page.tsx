'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { submitRegistration } from '@/lib/api';
import { getToken, isLoggedIn } from '@/lib/auth';

const inputClass = 'w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold';
const labelClass = 'block label-caps text-burgundy mb-1.5';

const emptyChild = { name: '', age: '', gender: '', school: '', dietaryNeeds: '', medicalNotes: '', emergencyContact: '' };

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ referenceCode: string; name: string } | null>(null);

  const [child, setChild] = useState(emptyChild);
  const [childNotes, setChildNotes] = useState('');
  const [childPhoto, setChildPhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [parent, setParent] = useState({ name: '', address: '', phone: '' });

  function updateChild(field: string, val: string) {
    setChild((p) => ({ ...p, [field]: val }));
  }

  function updateParent(field: string, val: string) {
    setParent((p) => ({ ...p, [field]: val }));
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => setChildPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  function resetForAnother() {
    setSuccess(null);
    setChild(emptyChild);
    setChildNotes('');
    setChildPhoto('');
    setPhotoPreview('');
    setParent({ name: '', address: '', phone: '' });
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn()) {
      router.push('/auth/sign-in');
      return;
    }
    setError('');
    setLoading(true);
    const token = getToken()!;
    try {
      const payload = {
        type: 'CHILD',
        notes: childNotes,
        child: { ...child, age: parseInt(child.age) || 0, photo: childPhoto || undefined },
        parentName: parent.name || undefined,
        parentAddress: parent.address || undefined,
        parentPhone: parent.phone || undefined,
      };
      const result = await submitRegistration(payload, token) as { referenceCode: string };
      setSuccess({ referenceCode: result.referenceCode, name: child.name });
    } catch {
      setError('Registration failed. Please check you are signed in and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <div className="bg-maroon py-3 px-6">
        <Link href="/">
          <Image src="/logo-full.png" alt="NAGARTA" width={40} height={40} className="object-contain" />
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="label-caps text-gold tracking-widest2 mb-3">NAGARTA 2026</p>
          <h1 className="font-serif text-4xl font-semibold text-maroon italic">Register an Attendee</h1>
          <div className="gold-divider mx-auto mt-4" />
          <p className="text-sm text-maroon/60 mt-4">Complete the form below to reserve a spot for your camper.</p>
        </div>

        {/* Success banner — stays visible above the form */}
        {success && (
          <div className="bg-white border border-green-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-maroon text-sm">
                  {`${success.name} is registered!`}
                </p>
                <p className="text-xs text-burgundy mt-0.5 mb-2">Spot reserved. Confirmation will be sent to your email.</p>
                <div className="bg-beige rounded px-3 py-2 inline-block">
                  <p className="label-caps text-burgundy text-xs mb-0.5">Reference Code</p>
                  <p className="font-mono text-maroon text-xs font-semibold break-all">{success.referenceCode}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4 flex-wrap">
              <button
                onClick={resetForAnother}
                className="bg-gold text-maroon px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase hover:bg-amber-500 transition-colors"
              >
                Register Another Child
              </button>
              <Link
                href="/dashboard/parent"
                className="border border-beige text-burgundy px-5 py-2 rounded-full text-xs hover:border-gold transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-beige p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm mb-6">
              {error}{' '}
              {error.includes('signed in') && (
                <Link href="/auth/sign-in" className="underline font-medium">Sign in here</Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Attendee Info */}
            <p className="text-sm text-burgundy font-semibold mb-3">Attendee&apos;s Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Photo upload */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Attendee Photo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-beige bg-cream flex items-center justify-center overflow-hidden flex-shrink-0">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-burgundy/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 bg-beige text-maroon px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase hover:bg-gold/30 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {photoPreview ? 'Change Photo' : 'Upload Photo'}
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                        <p className="text-xs text-burgundy/50 mt-1.5">Used by camp staff to identify the attendee on arrival. JPG, PNG or WEBP · Max 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Child&apos;s Full Name</label>
                    <input type="text" required value={child.name} onChange={e => updateChild('name', e.target.value)} placeholder="Kwame Asante" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Age</label>
                    <input type="number" required min="12" max="18" value={child.age} onChange={e => updateChild('age', e.target.value)} placeholder="15" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select required value={child.gender} onChange={e => updateChild('gender', e.target.value)} className={inputClass}>
                      <option value="" disabled>Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>School / Institution</label>
                    <input type="text" value={child.school} onChange={e => updateChild('school', e.target.value)} placeholder="Accra Academy" className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Dietary Needs (if any)</label>
                    <input type="text" value={child.dietaryNeeds} onChange={e => updateChild('dietaryNeeds', e.target.value)} placeholder="Vegetarian, allergies, etc." className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Medical Notes (if any)</label>
                    <textarea rows={2} value={child.medicalNotes} onChange={e => updateChild('medicalNotes', e.target.value)} placeholder="Any conditions the camp should know about..." className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Emergency Contact</label>
                    <input type="text" value={child.emergencyContact} onChange={e => updateChild('emergencyContact', e.target.value)} placeholder="Name & phone number" className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Additional Notes</label>
                    <textarea rows={2} value={childNotes} onChange={e => setChildNotes(e.target.value)} placeholder="Anything else we should know?" className={inputClass} />
                  </div>
                </div>

                {/* Parent Info */}
                <div className="border-t border-beige mt-6 pt-6">
                  <p className="text-sm text-burgundy font-semibold mb-3">Parent / Guardian Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Parent / Guardian Full Name</label>
                      <input type="text" value={parent.name} onChange={e => updateParent('name', e.target.value)} placeholder="Ama Mensah" className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Home Address</label>
                      <input type="text" value={parent.address} onChange={e => updateParent('address', e.target.value)} placeholder="123 Ring Road, Accra" className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Contact Number</label>
                      <input type="tel" value={parent.phone} onChange={e => updateParent('phone', e.target.value)} placeholder="+233 20 000 0000" className={inputClass} />
                    </div>
                  </div>
                </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-maroon font-semibold py-4 rounded-lg tracking-widest uppercase text-sm hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Reserve Spot'}
              </button>
              <p className="text-xs text-center text-maroon/40 mt-3">
                You must be{' '}
                <Link href="/auth/sign-in" className="text-gold hover:underline">signed in</Link>
                {' '}to register.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
