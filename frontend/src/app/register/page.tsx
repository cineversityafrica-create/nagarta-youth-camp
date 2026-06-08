'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { submitRegistration } from '@/lib/api';
import { getToken, isLoggedIn } from '@/lib/auth';
import PricingSection from '@/components/PricingSection';

const SAVED_FORM_KEY = 'nagarta_saved_registration';

const inputClass = 'w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold';
const labelClass = 'block label-caps text-burgundy mb-1.5';

const emptyChild = { name: '', age: '', gender: '', school: '', dietaryNeeds: '', medicalNotes: '', emergencyContact: '' };

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ referenceCode: string; name: string } | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savedReminder, setSavedReminder] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [child, setChild] = useState(emptyChild);
  const [childNotes, setChildNotes] = useState('');
  const [childPhoto, setChildPhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [parent, setParent] = useState({ name: '', address: '', phone: '' });
  const [parentType, setParentType] = useState<'mother' | 'father' | 'both'>('both');
  const [mother, setMother] = useState({ name: '', address: '', phone: '', email: '', emergencyContact: '' });
  const [father, setFather] = useState({ name: '', address: '', phone: '', email: '', emergencyContact: '' });

  // Load saved progress on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(SAVED_FORM_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.child) setChild(data.child);
        if (data.childNotes) setChildNotes(data.childNotes);
        if (data.parent) setParent(data.parent);
        if (data.parentType) setParentType(data.parentType);
        if (data.mother) setMother(data.mother);
        if (data.father) setFather(data.father);
        setSavedReminder(true);
      } catch (e) {
        console.error('Failed to load saved progress:', e);
      }
    }
  }, []);

  function saveProgress() {
    if (typeof window === 'undefined') return;
    const data = { child, childNotes, parent, parentType, mother, father, savedAt: new Date().toISOString() };
    localStorage.setItem(SAVED_FORM_KEY, JSON.stringify(data));
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setSaveModalOpen(true);
    }, 800);
  }

  function clearSavedProgress() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SAVED_FORM_KEY);
    setSavedReminder(false);
  }

  function dismissReminder() {
    setSavedReminder(false);
  }

  function updateChild(field: string, val: string) {
    setChild((p) => ({ ...p, [field]: val }));
  }

  function updateParent(field: string, val: string) {
    setParent((p) => ({ ...p, [field]: val }));
  }

  function updateMother(field: string, val: string) {
    setMother((p) => ({ ...p, [field]: val }));
  }

  function updateFather(field: string, val: string) {
    setFather((p) => ({ ...p, [field]: val }));
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Please upload a JPG, PNG, or WEBP image');
      return;
    }

    // Validate file size (5MB = 5242880 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setPhotoError('File size must be less than 5MB');
      return;
    }

    setPhotoError('');
    setPhotoPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => setChildPhoto(reader.result as string);
    reader.onerror = () => setPhotoError('Failed to read file');
    reader.readAsDataURL(file);
  }

  function resetForAnother() {
    setSuccess(null);
    setChild(emptyChild);
    setChildNotes('');
    setChildPhoto('');
    setPhotoPreview('');
    setPhotoError('');
    setParent({ name: '', address: '', phone: '' });
    setParentType('both');
    setMother({ name: '', address: '', phone: '', email: '', emergencyContact: '' });
    setFather({ name: '', address: '', phone: '', email: '', emergencyContact: '' });
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
      const payload: Record<string, unknown> = {
        type: 'CHILD',
        notes: childNotes,
        child: { ...child, age: parseInt(child.age) || 0, photo: childPhoto || undefined },
        parentName: parent.name || undefined,
        parentAddress: parent.address || undefined,
        parentPhone: parent.phone || undefined,
      };

      // Add mother's information if selected
      if (parentType === 'mother' || parentType === 'both') {
        payload.motherName = mother.name || undefined;
        payload.motherAddress = mother.address || undefined;
        payload.motherPhone = mother.phone || undefined;
        payload.motherEmail = mother.email || undefined;
        payload.motherEmergencyContact = mother.emergencyContact || undefined;
      }

      // Add father's information if selected
      if (parentType === 'father' || parentType === 'both') {
        payload.fatherName = father.name || undefined;
        payload.fatherAddress = father.address || undefined;
        payload.fatherPhone = father.phone || undefined;
        payload.fatherEmail = father.email || undefined;
        payload.fatherEmergencyContact = father.emergencyContact || undefined;
      }

      const result = await submitRegistration(payload, token) as { referenceCode: string };
      setSuccess({ referenceCode: result.referenceCode, name: child.name });
      // Clear saved progress on successful registration
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SAVED_FORM_KEY);
      }
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

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="label-caps text-gold tracking-widest2 mb-3">NAGARTA 2026</p>
          <h1 className="font-serif text-4xl font-semibold text-maroon italic">Register an Attendee</h1>
          <div className="gold-divider mx-auto mt-4" />
          <p className="text-sm text-maroon/60 mt-4">Complete the form below to reserve a spot for your camper.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

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
                        {photoError && <p className="text-xs text-red-600 font-medium mt-1.5">⚠️ {photoError}</p>}
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
                  <p className="text-sm text-burgundy font-semibold mb-4">Parent / Guardian Information</p>

                  {/* Parent Type Selector */}
                  <div className="mb-6 p-4 bg-gold/5 rounded-lg border border-gold/20">
                    <p className="text-xs label-caps text-burgundy mb-3">Who will provide information?</p>
                    <div className="flex flex-wrap gap-3">
                      <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-colors ${
                        parentType === 'both' ? 'bg-gold/10 border border-gold/30' : 'hover:bg-gold/5'
                      }`}>
                        <input
                          type="radio"
                          name="parentType"
                          value="both"
                          checked={parentType === 'both'}
                          onChange={() => setParentType('both')}
                          className="w-4 h-4 accent-gold"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-maroon font-semibold">Both Parents</span>
                          <span className="text-xs text-gold font-medium">Recommended</span>
                        </div>
                      </label>
                      <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-colors ${
                        parentType === 'mother' ? 'bg-gold/10 border border-gold/30' : 'hover:bg-gold/5'
                      }`}>
                        <input
                          type="radio"
                          name="parentType"
                          value="mother"
                          checked={parentType === 'mother'}
                          onChange={() => setParentType('mother')}
                          className="w-4 h-4 accent-gold"
                        />
                        <span className="text-sm text-maroon font-medium">Mother Only</span>
                      </label>
                      <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-colors ${
                        parentType === 'father' ? 'bg-gold/10 border border-gold/30' : 'hover:bg-gold/5'
                      }`}>
                        <input
                          type="radio"
                          name="parentType"
                          value="father"
                          checked={parentType === 'father'}
                          onChange={() => setParentType('father')}
                          className="w-4 h-4 accent-gold"
                        />
                        <span className="text-sm text-maroon font-medium">Father Only</span>
                      </label>
                    </div>
                  </div>

                  {/* Mother's Information */}
                  {(parentType === 'mother' || parentType === 'both') && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-maroon mb-3">Mother's Information</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Mother's Full Name</label>
                          <input type="text" value={mother.name} onChange={e => updateMother('name', e.target.value)} placeholder="Ama Mensah" className={inputClass} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Mother's Address</label>
                          <input type="text" value={mother.address} onChange={e => updateMother('address', e.target.value)} placeholder="123 Ring Road, Accra" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Mother's Contact Number</label>
                          <input type="tel" value={mother.phone} onChange={e => updateMother('phone', e.target.value)} placeholder="+233 20 000 0000" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Mother's Email</label>
                          <input type="email" value={mother.email} onChange={e => updateMother('email', e.target.value)} placeholder="ama@example.com" className={inputClass} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Mother's Emergency Contact</label>
                          <input type="text" value={mother.emergencyContact} onChange={e => updateMother('emergencyContact', e.target.value)} placeholder="Alternative phone or person to contact" className={inputClass} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Father's Information */}
                  {(parentType === 'father' || parentType === 'both') && (
                    <div>
                      <p className="text-sm font-semibold text-maroon mb-3">Father's Information</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Father's Full Name</label>
                          <input type="text" value={father.name} onChange={e => updateFather('name', e.target.value)} placeholder="Kwame Mensah" className={inputClass} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Father's Address</label>
                          <input type="text" value={father.address} onChange={e => updateFather('address', e.target.value)} placeholder="123 Ring Road, Accra" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Father's Contact Number</label>
                          <input type="tel" value={father.phone} onChange={e => updateFather('phone', e.target.value)} placeholder="+233 20 000 0000" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Father's Email</label>
                          <input type="email" value={father.email} onChange={e => updateFather('email', e.target.value)} placeholder="kwame@example.com" className={inputClass} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Father's Emergency Contact</label>
                          <input type="text" value={father.emergencyContact} onChange={e => updateFather('emergencyContact', e.target.value)} placeholder="Alternative phone or person to contact" className={inputClass} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-maroon font-semibold py-4 rounded-lg tracking-widest uppercase text-sm hover:bg-amber-500 transition-colors disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Submitting...' : 'Reserve Spot'}
              </button>

              {/* Save Progress Button */}
              <button
                type="button"
                onClick={saveProgress}
                className="w-full border-2 border-dashed border-burgundy/30 text-burgundy font-semibold py-3 rounded-lg tracking-wider uppercase text-xs hover:bg-burgundy/5 hover:border-burgundy/50 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                💾 Save Progress & Continue Later
              </button>

              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 text-center font-semibold animate-pulse">
                  ✅ Progress saved!
                </div>
              )}

              <p className="text-xs text-center text-maroon/40 mt-3">
                You must be{' '}
                <Link href="/auth/sign-in" className="text-gold hover:underline">signed in</Link>
                {' '}to register.
              </p>
            </div>
          </form>
        </div>
          </div>

          {/* Pricing Sidebar - shown beside the form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <PricingSection compact />
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal — appears after clicking Save Progress */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSaveModalOpen(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-gold to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl font-bold text-maroon mb-2">Progress Saved! 🎉</h3>
              <p className="text-sm text-burgundy/70 mb-3">
                Your form is saved. To continue later from your portal, sign in or create an account.
              </p>
              <p className="text-xs text-burgundy/60 italic">
                💡 Your saved form will be linked to your account so you can finish it anytime.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/sign-up?continue=register"
                className="block w-full bg-gradient-to-r from-burgundy to-maroon text-gold font-semibold py-3 rounded-lg text-center tracking-wider uppercase text-sm hover:opacity-90 transition shadow-lg"
              >
                ✨ Create Account & Save
              </Link>
              <Link
                href="/auth/sign-in?continue=register"
                className="block w-full border-2 border-burgundy text-burgundy font-semibold py-3 rounded-lg text-center tracking-wider uppercase text-sm hover:bg-burgundy/5 transition"
              >
                🔑 Sign In & Continue
              </Link>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="block w-full text-xs text-maroon/60 hover:text-maroon mt-4"
              >
                Continue anonymously (saved in this browser only) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Progress Reminder — shown when user returns with saved data */}
      {savedReminder && !saveModalOpen && !success && (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-2xl animate-pulse-once">
          <div className="flex items-start gap-3">
            <div className="text-3xl">📝</div>
            <div className="flex-1">
              <h4 className="font-bold text-burgundy mb-1">Complete Your Form</h4>
              <p className="text-xs text-burgundy/70 mb-3">
                We restored your saved progress. Please finish filling out the form to reserve your spot.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={dismissReminder}
                  className="text-xs bg-burgundy text-gold px-3 py-1.5 rounded-full font-semibold hover:opacity-90"
                >
                  Got it
                </button>
                <button
                  onClick={clearSavedProgress}
                  className="text-xs text-burgundy/60 hover:text-burgundy underline"
                >
                  Clear saved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
