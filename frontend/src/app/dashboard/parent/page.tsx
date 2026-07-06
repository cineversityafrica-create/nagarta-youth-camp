'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getMe, getAnnouncements, getMyRegistrations, submitRegistration, submitContactMessage, type User, type Announcement, type Registration } from '@/lib/api';
import { getToken, getStoredUser, clearAuth } from '@/lib/auth';

const inputClass = 'w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold';
const labelClass = 'block label-caps text-burgundy mb-1.5';
const emptyChild = { name: '', age: '', school: '', dietaryNeeds: '', medicalNotes: '', emergencyContact: '' };

export default function ParentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'announcements' | 'messages'>('overview');

  // Messages state
  const [messageForm, setMessageForm] = useState({ subject: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [loading, setLoading] = useState(true);

  // Add-a-child state
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChild, setNewChild] = useState(emptyChild);
  const [newChildPhoto, setNewChildPhoto] = useState('');
  const [newChildPhotoPreview, setNewChildPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [addingChild, setAddingChild] = useState(false);
  const [addChildError, setAddChildError] = useState('');
  const [addChildRef, setAddChildRef] = useState<string | null>(null);
  const [parentType, setParentType] = useState<'mother' | 'father' | 'both'>('both');
  const [mother, setMother] = useState({ name: '', address: '', phone: '', email: '', emergencyContact: '' });
  const [father, setFather] = useState({ name: '', address: '', phone: '', email: '', emergencyContact: '' });

  // Package selection for add-a-child
  const [selectedPackage, setSelectedPackage] = useState<'Early Bird' | 'Regular Package'>('Early Bird');
  const packagePrice = selectedPackage === 'Early Bird' ? '235' : '260';

  // Paystack payment popup state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_fcb37013accb3e3d1151fd2ae10613fb9c043301';

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/auth/sign-in'); return; }

    const stored = getStoredUser<User>();
    if (stored && stored.role !== 'PARENT' && stored.role !== 'ADMIN') {
      router.push('/dashboard/camper');
      return;
    }

    (async () => {
      try {
        const [me, anns, regs] = await Promise.all([
          getMe(token!),
          getAnnouncements(token!).catch(() => [] as Announcement[]),
          getMyRegistrations(token!).catch(() => [] as Registration[]),
        ]);
        setUser(me);
        setAnnouncements(anns);
        setRegistrations(regs);
      } catch {
        clearAuth();
        router.push('/auth/sign-in');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function updateNewChild(field: string, val: string) {
    setNewChild((p) => ({ ...p, [field]: val }));
  }

  function updateMother(field: string, val: string) {
    setMother((p) => ({ ...p, [field]: val }));
  }

  function updateFather(field: string, val: string) {
    setFather((p) => ({ ...p, [field]: val }));
  }

  function handleNewChildPhoto(e: React.ChangeEvent<HTMLInputElement>) {
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
    setNewChildPhotoPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => setNewChildPhoto(reader.result as string);
    reader.onerror = () => setPhotoError('Failed to read file');
    reader.readAsDataURL(file);
  }

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) { router.push('/auth/sign-in'); return; }
    setAddChildError('');

    // Photo is mandatory
    if (!newChildPhoto) {
      setAddChildError('Please upload a photo of the attendee before submitting.');
      return;
    }

    setAddingChild(true);
    try {
      const payload: Record<string, unknown> = {
        type: 'CHILD',
        child: { ...newChild, age: parseInt(newChild.age) || 0, photo: newChildPhoto || undefined },
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
      setAddChildRef(result.referenceCode);
      const regs = await getMyRegistrations(token);
      setRegistrations(regs);

      // Auto-trigger Paystack payment popup after successful registration
      setTimeout(() => {
        openPaystackPayment(result.referenceCode, newChild.name);
      }, 500);
    } catch {
      setAddChildError('Registration failed. Please try again.');
    } finally {
      setAddingChild(false);
    }
  }

  // Load Paystack script dynamically
  function loadPaystackScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as unknown as { PaystackPop?: unknown }).PaystackPop) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Open Paystack popup for payment
  async function openPaystackPayment(registrationRef: string, camperName: string) {
    setPaymentProcessing(true);
    try {
      const loaded = await loadPaystackScript();
      const PaystackPop = (window as unknown as {
        PaystackPop?: { setup: (config: Record<string, unknown>) => { openIframe: () => void } };
      }).PaystackPop;

      if (!loaded || !PaystackPop) {
        alert('Failed to load Paystack. Please try again.');
        setPaymentProcessing(false);
        return;
      }

      const parentEmail = mother.email || father.email || user?.email || '';
      const parentName = mother.name || father.name || user?.name || 'Parent';
      const parentPhone = mother.phone || father.phone || user?.phone || '';
      const reference = `NAGARTA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const amountInGHS = parseInt(packagePrice) * 12;
      const amountInPesewas = amountInGHS * 100;

      const paystack = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: parentEmail,
        amount: amountInPesewas,
        currency: 'GHS',
        ref: reference,
        metadata: {
          fullName: parentName,
          phone: parentPhone,
          package: selectedPackage,
          camperName,
          registrationRef,
          custom_fields: [
            { display_name: 'Camper Name', variable_name: 'camper_name', value: camperName },
            { display_name: 'Package', variable_name: 'package', value: selectedPackage },
            { display_name: 'NAGARTA Ref', variable_name: 'nagarta_ref', value: registrationRef },
          ],
        },
        callback: (response: { reference: string }) => {
          // Payment successful - verify + redirect
          fetch(`/api/paystack/verify/${response.reference}`)
            .catch(() => {})
            .finally(() => {
              window.location.href = `/payment/success?ref=${response.reference}&amount=${packagePrice}&package=${encodeURIComponent(selectedPackage)}&email=${encodeURIComponent(parentEmail)}&campRef=${encodeURIComponent(registrationRef)}`;
            });
        },
        onClose: () => {
          setPaymentProcessing(false);
        },
      });

      paystack.openIframe();
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentProcessing(false);
    }
  }

  function resetAddChild() {
    setShowAddChild(false);
    setNewChild(emptyChild);
    setNewChildPhoto('');
    setNewChildPhotoPreview('');
    setPhotoError('');
    setAddChildError('');
    setAddChildRef(null);
    setParentType('both');
    setMother({ name: '', address: '', phone: '', email: '', emergencyContact: '' });
    setFather({ name: '', address: '', phone: '', email: '', emergencyContact: '' });
  }

  function addAnother() {
    setNewChild(emptyChild);
    setNewChildPhoto('');
    setNewChildPhotoPreview('');
    setPhotoError('');
    setAddChildError('');
    setAddChildRef(null);
    setParentType('both');
    setMother({ name: '', address: '', phone: '', email: '', emergencyContact: '' });
    setFather({ name: '', address: '', phone: '', email: '', emergencyContact: '' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-maroon flex items-center justify-center">
        <p className="text-gold font-serif text-lg italic">Loading your dashboard...</p>
      </div>
    );
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    setMessageError('');
    if (!messageForm.message.trim() || messageForm.message.length < 10) {
      setMessageError('Please enter a message (at least 10 characters)');
      return;
    }
    setSendingMessage(true);
    try {
      await submitContactMessage({
        name: user?.name || 'Parent',
        email: user?.email || '',
        phone: user?.phone || '',
        subject: messageForm.subject || 'Message from Parent Portal',
        message: messageForm.message,
      });
      setMessageSent(true);
      setMessageForm({ subject: '', message: '' });
      setTimeout(() => setMessageSent(false), 5000);
    } catch {
      setMessageError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  }

  const tabs = [
    { key: 'overview', label: '🏠 Overview' },
    { key: 'announcements', label: `📢 News (${announcements.length})` },
    { key: 'messages', label: '💬 Messages' },
  ] as const;

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <div className="bg-maroon border-b border-burgundy">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><Image src="/logo-full.png" alt="NAGARTA" width={40} height={40} className="object-contain" /></Link>
          <div className="flex items-center gap-4">
            <span className="text-cream/60 text-sm">Parent Portal</span>
            <button onClick={() => { clearAuth(); router.push('/'); }} className="text-xs text-beige/40 hover:text-gold transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <p className="label-caps text-gold mb-2">Welcome back</p>
          <h1 className="font-serif text-3xl font-semibold text-maroon italic">{user?.name}</h1>
          <p className="text-sm text-burgundy mt-1">{user?.email}</p>
        </div>

        {/* Saved Form Reminder */}
        <SavedFormReminder />

        {/* Tabs */}
        <div className="flex border-b border-beige mb-8 gap-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-medium tracking-wide transition-colors ${
                activeTab === key ? 'border-b-2 border-gold text-maroon' : 'text-maroon/50 hover:text-maroon'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-maroon">Registered Children</h2>
              {!showAddChild && (
                <button
                  onClick={() => setShowAddChild(true)}
                  className="flex items-center gap-2 bg-gold text-maroon px-5 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase hover:bg-amber-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add a Child
                </button>
              )}
            </div>

            {registrations.length === 0 && !showAddChild ? (
              <div className="bg-white border border-beige rounded-xl p-8 text-center">
                <p className="text-maroon/60 text-sm mb-4">No registrations yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {registrations.map((reg) => (
                  <div key={reg.id} className="bg-white border border-beige rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                    {/* Child Photo */}
                    <div className="flex-shrink-0">
                      {reg.child?.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={reg.child.photo}
                          alt={reg.child.name || 'Camper'}
                          className="w-20 h-20 rounded-full object-cover border-2 border-gold shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                          {(reg.child?.name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="font-semibold text-maroon text-lg">{reg.child?.name || 'Self Registration'}</p>
                      {reg.child && <p className="text-sm text-burgundy">Age {reg.child.age}{reg.child.school ? ` · ${reg.child.school}` : ''}</p>}
                      <p className="text-xs text-gold font-mono mt-1">Ref: {reg.referenceCode}</p>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${
                        reg.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 border border-green-300' :
                        reg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                        'bg-red-100 text-red-700 border border-red-300'
                      }`}>
                        {reg.status === 'CONFIRMED' ? '✅ CONFIRMED' : reg.status === 'PENDING' ? '⏳ PENDING' : reg.status}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${
                        reg.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                        reg.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                        'bg-orange-100 text-orange-700 border border-orange-300'
                      }`}>
                        {reg.paymentStatus === 'PAID' ? '💰 PAID' : reg.paymentStatus === 'PARTIAL' ? '💳 PARTIAL' : '⏱️ UNPAID'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add a Child inline form */}
            {showAddChild && (
              <div className="bg-white border border-gold/30 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-serif text-lg font-semibold text-maroon italic">Register a Child</h3>
                  <button onClick={resetAddChild} className="text-xs text-burgundy/50 hover:text-burgundy transition-colors">✕ Cancel</button>
                </div>

                {addChildRef ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-serif text-lg text-maroon italic">Child registered!</p>
                    <div className="bg-beige rounded px-3 py-2 inline-block mt-2">
                      <p className="label-caps text-burgundy text-xs mb-0.5">Reference Code</p>
                      <p className="font-mono text-maroon text-xs font-semibold break-all">{addChildRef}</p>
                    </div>
                    <div className="flex gap-3 justify-center mt-5">
                      <button onClick={addAnother} className="bg-gold text-maroon px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase hover:bg-amber-500 transition-colors">
                        Add Another Child
                      </button>
                      <button onClick={resetAddChild} className="border border-beige text-burgundy px-5 py-2 rounded-full text-xs hover:border-gold transition-colors">
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAddChild} className="space-y-4">
                    {addChildError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">{addChildError}</div>
                    )}

                    {/* PACKAGE SELECTION */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4">
                      <p className="text-sm font-bold text-maroon mb-3">💰 Select Package</p>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`relative cursor-pointer rounded-xl p-3 border-2 transition-all ${
                          selectedPackage === 'Early Bird'
                            ? 'border-orange-500 bg-gradient-to-br from-amber-50 to-orange-100 shadow-md'
                            : 'border-gray-200 bg-white'
                        }`}>
                          <input type="radio" checked={selectedPackage === 'Early Bird'} onChange={() => setSelectedPackage('Early Bird')} className="sr-only" />
                          <div className="text-center">
                            <p className="text-xs font-bold text-maroon">🐦 Early Bird</p>
                            <p className="text-2xl font-bold text-orange-600">$235</p>
                            <p className="text-[10px] text-rose-600 font-semibold">Save $25!</p>
                          </div>
                        </label>
                        <label className={`relative cursor-pointer rounded-xl p-3 border-2 transition-all ${
                          selectedPackage === 'Regular Package'
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-100 shadow-md'
                            : 'border-gray-200 bg-white'
                        }`}>
                          <input type="radio" checked={selectedPackage === 'Regular Package'} onChange={() => setSelectedPackage('Regular Package')} className="sr-only" />
                          <div className="text-center">
                            <p className="text-xs font-bold text-maroon">Regular</p>
                            <p className="text-2xl font-bold text-emerald-600">$260</p>
                            <p className="text-[10px] text-gray-500">Standard</p>
                          </div>
                        </label>
                      </div>
                      <p className="text-xs text-emerald-700 mt-2 text-center">
                        💳 Payment popup will appear after registration • Amount: <strong>GH₵ {(parseInt(packagePrice) * 12).toLocaleString()}</strong>
                      </p>
                    </div>

                    {/* Photo upload */}
                    <div>
                      <label className={labelClass}>Attendee Photo <span className="text-red-500">*</span></label>
                      <div className={`flex items-center gap-4 p-2 rounded-lg border-2 ${!newChildPhoto ? 'border-dashed border-red-300 bg-red-50/30' : 'border-transparent'}`}>
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-beige bg-cream flex items-center justify-center overflow-hidden flex-shrink-0">
                          {newChildPhotoPreview ? (
                            <img src={newChildPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-6 h-6 text-burgundy/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <label className="cursor-pointer inline-flex items-center gap-2 bg-beige text-maroon px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase hover:bg-gold/30 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {newChildPhotoPreview ? 'Change Photo' : 'Upload Photo (Required)'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleNewChildPhoto} />
                          </label>
                          {photoError && <p className="text-xs text-red-600 font-medium mt-1">⚠️ {photoError}</p>}
                          {!newChildPhotoPreview && !photoError && <p className="text-xs text-red-500 font-medium mt-1">⚠️ Photo is required</p>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Child&apos;s Full Name</label>
                        <input type="text" required value={newChild.name} onChange={e => updateNewChild('name', e.target.value)} placeholder="Kwame Asante" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Age</label>
                        <input type="number" required min="12" max="18" value={newChild.age} onChange={e => updateNewChild('age', e.target.value)} placeholder="15" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>School / Institution</label>
                        <input type="text" value={newChild.school} onChange={e => updateNewChild('school', e.target.value)} placeholder="Accra Academy" className={inputClass} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Dietary Needs (if any)</label>
                        <input type="text" value={newChild.dietaryNeeds} onChange={e => updateNewChild('dietaryNeeds', e.target.value)} placeholder="Vegetarian, allergies, etc." className={inputClass} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Medical Notes (if any)</label>
                        <textarea rows={2} value={newChild.medicalNotes} onChange={e => updateNewChild('medicalNotes', e.target.value)} placeholder="Any conditions the camp should know about..." className={inputClass} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Emergency Contact</label>
                        <input type="text" value={newChild.emergencyContact} onChange={e => updateNewChild('emergencyContact', e.target.value)} placeholder="Name & phone number" className={inputClass} />
                      </div>
                    </div>

                    {/* Parent Information Section */}
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

                    <button
                      type="submit"
                      disabled={addingChild || paymentProcessing}
                      className="w-full bg-gradient-to-r from-gold via-amber-500 to-orange-500 text-maroon font-bold py-4 rounded-xl tracking-wider uppercase text-sm hover:shadow-lg transition-all disabled:opacity-50 mt-6 shadow-md"
                    >
                      {addingChild ? '⏳ Registering...' : paymentProcessing ? '💳 Opening Payment...' : '🎯 Register & Pay Now'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Camp details summary */}
            <div className="bg-burgundy rounded-xl p-6 text-cream">
              <h3 className="font-serif text-lg font-semibold text-gold mb-4">Camp Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div><p className="text-gold/60 label-caps mb-1">Dates</p><p>19–23 December 2026</p></div>
                <div><p className="text-gold/60 label-caps mb-1">Location</p><p>Accra, Ghana</p></div>
                <div><p className="text-gold/60 label-caps mb-1">Venue</p><p>Premium University Campus</p></div>
              </div>
            </div>
          </div>
        )}

        {/* News/Announcements tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-gold/10 to-amber-100 border border-gold/30 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-gold to-amber-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-maroon mb-1">📢 Latest News from NAGARTA</h2>
                  <p className="text-sm text-burgundy/70">Stay updated with camp announcements, updates and important information</p>
                </div>
              </div>
            </div>

            {announcements.length === 0 ? (
              <div className="bg-white border border-beige rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-beige rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-maroon/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 15.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v4.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-maroon/50 text-sm">No news or announcements yet.</p>
                <p className="text-xs text-burgundy/40 mt-2">Check back soon for updates from NAGARTA!</p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="bg-white border-2 border-beige rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gold to-amber-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-white text-sm">📌</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-bold text-maroon">{ann.title}</h3>
                      <p className="text-xs text-gold font-semibold mt-0.5">
                        {new Date(ann.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-maroon/80 leading-relaxed whitespace-pre-wrap">{ann.body}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages tab — Send messages to NAGARTA */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Contact NAGARTA header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-maroon mb-1">💬 Message NAGARTA Team</h2>
                  <p className="text-sm text-burgundy/70">Have a question or need help? Send us a message directly</p>
                </div>
              </div>
            </div>

            {/* Send message form */}
            <div className="bg-white border-2 border-beige rounded-2xl p-6 shadow-sm">
              <h3 className="font-serif text-lg font-bold text-maroon mb-4">✉️ Send a Message</h3>

              {messageSent && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-bold text-green-700">✅ Message sent! NAGARTA will respond soon.</p>
                  </div>
                </div>
              )}

              {messageError && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">{messageError}</p>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className={labelClass}>Subject</label>
                  <input
                    type="text"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                    placeholder="What is this about?"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Your Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                    placeholder="Type your message here..."
                    className={`${inputClass} resize-none`}
                  />
                  <p className="text-xs text-burgundy/50 mt-1">{messageForm.message.length}/1000 characters</p>
                </div>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 rounded-xl tracking-wider uppercase text-sm hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {sendingMessage ? '⏳ Sending...' : '📤 Send Message'}
                </button>
              </form>
            </div>

            {/* Ways to reach NAGARTA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border-2 border-beige rounded-2xl p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs text-burgundy/60 uppercase font-bold tracking-wide mb-1">Email Us</p>
                <a href="mailto:info@nagartayouthcamp.com" className="text-sm text-maroon font-semibold hover:text-gold break-all">
                  info@nagartayouthcamp.com
                </a>
              </div>

              <div className="bg-white border-2 border-beige rounded-2xl p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-xs text-burgundy/60 uppercase font-bold tracking-wide mb-1">Call Us</p>
                <a href="tel:0550171717" className="block text-sm text-maroon font-semibold hover:text-gold">
                  0550 17 17 17
                </a>
                <a href="tel:0243608872" className="block text-sm text-maroon font-semibold hover:text-gold">
                  0243 60 88 72
                </a>
              </div>

              <div className="bg-white border-2 border-beige rounded-2xl p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-xs text-burgundy/60 uppercase font-bold tracking-wide mb-1">Visit Us</p>
                <p className="text-sm text-maroon font-semibold">Accra, Ghana</p>
                <p className="text-xs text-burgundy/50 mt-1">Premium University Campus</p>
              </div>
            </div>

            {/* Your info that NAGARTA has */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
              <h3 className="font-serif text-lg font-bold text-maroon mb-4 flex items-center gap-2">
                📞 How NAGARTA Can Reach You
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-amber-200">
                  <p className="text-xs text-burgundy/60 uppercase font-bold tracking-wide mb-1">Your Email</p>
                  <p className="text-sm text-maroon font-semibold">{user?.email || 'Not set'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-amber-200">
                  <p className="text-xs text-burgundy/60 uppercase font-bold tracking-wide mb-1">Your Phone</p>
                  <p className="text-sm text-maroon font-semibold">{user?.phone || 'Not set'}</p>
                </div>
              </div>
              <p className="text-xs text-burgundy/60 mt-3 italic">
                💡 NAGARTA will send updates to your email and can reach you at your phone number. Make sure they&apos;re current!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component that shows a reminder if there's a saved registration form
function SavedFormReminder() {
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('nagarta_saved_registration');
    setHasSaved(!!saved);
  }, []);

  if (!hasSaved) return null;

  return (
    <div className="mb-8 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-2 border-amber-300 rounded-2xl p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="text-4xl">📝</div>
        <div className="flex-1">
          <h3 className="font-serif text-xl font-bold text-maroon mb-1">
            Complete Your Registration Form
          </h3>
          <p className="text-sm text-burgundy/80 mb-3">
            You have an incomplete registration form saved. Continue where you left off to reserve your camper's spot.
          </p>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase hover:shadow-lg transition-all shadow-md"
            >
              ✨ Continue Form
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('nagarta_saved_registration');
                setHasSaved(false);
              }}
              className="text-xs text-burgundy/60 hover:text-burgundy underline px-3"
            >
              Discard saved form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
