'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getMe, getAnnouncements, getMyRegistrations, submitRegistration, submitContactMessage, type User, type Announcement, type Registration } from '@/lib/api';
import { getToken, getStoredUser, clearAuth } from '@/lib/auth';
import BankDetails from '@/components/BankDetails';
import Barcode from '@/components/Barcode';
import { CAMP_FEE_GHS, formatGhs } from '@/lib/pricing';
import { fileToCompressedDataUrl } from '@/lib/image';

const inputClass = 'w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold';
const labelClass = 'block label-caps text-burgundy mb-1.5';
const emptyChild = { name: '', age: '', gender: '', school: '', dietaryNeeds: '', medicalNotes: '', emergencyContactName: '', emergencyContactPhone: '' };

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
    // Block letters for data fields; leave the gender dropdown value untouched
    setNewChild((p) => ({ ...p, [field]: field === 'gender' ? val : val.toUpperCase() }));
  }

  // Prefill the parent/guardian details from the most recent registration so a
  // parent adding a sibling doesn't start from scratch. Child-specific fields
  // (photo, name, gender, etc.) stay blank — each child is different.
  function openAddChild() {
    const last = registrations[0];
    if (last) {
      const hasMother = Boolean(last.motherName || last.motherPhone || last.motherEmail);
      const hasFather = Boolean(last.fatherName || last.fatherPhone || last.fatherEmail);
      if (hasMother) {
        setMother({
          name: last.motherName || '',
          address: last.motherAddress || '',
          phone: last.motherPhone || '',
          email: last.motherEmail || '',
          emergencyContact: last.motherEmergencyContact || '',
        });
      }
      if (hasFather) {
        setFather({
          name: last.fatherName || '',
          address: last.fatherAddress || '',
          phone: last.fatherPhone || '',
          email: last.fatherEmail || '',
          emergencyContact: last.fatherEmergencyContact || '',
        });
      }
      if (hasMother && hasFather) setParentType('both');
      else if (hasFather) setParentType('father');
      else if (hasMother) setParentType('mother');
    }
    // Child identity always starts fresh
    setNewChild(emptyChild);
    setNewChildPhoto('');
    setNewChildPhotoPreview('');
    setPhotoError('');
    setAddChildError('');
    setAddChildRef(null);
    setShowAddChild(true);
  }

  function updateMother(field: string, val: string) {
    // Uppercase everything except the email (case matters for login)
    setMother((p) => ({ ...p, [field]: field === 'email' ? val : val.toUpperCase() }));
  }

  function updateFather(field: string, val: string) {
    setFather((p) => ({ ...p, [field]: field === 'email' ? val : val.toUpperCase() }));
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

    // Validate file size (15MB) — the image is compressed client-side before upload
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setPhotoError('File size must be less than 15MB');
      return;
    }

    setPhotoError('');
    setNewChildPhotoPreview(URL.createObjectURL(file));
    fileToCompressedDataUrl(file)
      .then((dataUrl) => setNewChildPhoto(dataUrl))
      .catch(() => setPhotoError('Failed to process image. Please try another photo.'));
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
        child: {
          ...newChild,
          age: parseInt(newChild.age) || 0,
          photo: newChildPhoto || undefined,
          emergencyContact: [newChild.emergencyContactName, newChild.emergencyContactPhone].filter(Boolean).join(' — ') || undefined,
        },
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
    } catch {
      setAddChildError('Registration failed. Please try again.');
    } finally {
      setAddingChild(false);
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
    // Keep the parent/guardian details (same for siblings) — only reset the
    // child's own fields (photo, name, gender, age, etc.).
    setNewChild(emptyChild);
    setNewChildPhoto('');
    setNewChildPhotoPreview('');
    setPhotoError('');
    setAddChildError('');
    setAddChildRef(null);
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

  // Derived summary totals
  const totalChildren = registrations.length;
  const totalPaid = registrations.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const confirmedCount = registrations.filter((r) => r.status === 'CONFIRMED').length;
  const firstName = (user?.name || 'Parent').split(' ')[0];

  const tabs = [
    { key: 'overview', label: '🏠 Overview' },
    { key: 'announcements', label: `📢 News (${announcements.length})` },
    { key: 'messages', label: '💬 Messages' },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(circle at 12% 0%, rgba(203,163,107,0.12), transparent 45%), radial-gradient(circle at 88% 8%, rgba(16,185,129,0.10), transparent 45%), #f6f1ea' }}>
      {/* ── Hero header ─────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #301317 0%, #531c22 55%, #3b1f14 100%)' }}>
        {/* decorative glows */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #cba36b, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-28 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
        <div className="pointer-events-none absolute inset-0" style={{ background: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23ffffff' stroke-opacity='0.03' stroke-width='1'/%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-6xl mx-auto px-6">
          {/* top nav row */}
          <div className="flex items-center justify-between py-4">
            <Link href="/"><Image src="/logo-full.png" alt="NAGARTA" width={44} height={44} className="object-contain" /></Link>
            <button onClick={() => { clearAuth(); router.push('/'); }} className="inline-flex items-center gap-1.5 text-xs text-beige/60 hover:text-gold transition-colors border border-white/10 hover:border-gold/40 rounded-full px-3 py-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>

          {/* greeting */}
          <div className="flex items-center gap-4 pt-4 pb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-maroon shadow-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f5d38a, #cba36b)' }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold/80">Parent Portal</p>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-cream italic leading-tight">Hi, {firstName} 👋</h1>
              <p className="text-xs text-beige/50 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* summary stat cards — sit inside the hero, fully visible on every screen */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pb-8">
            {[
              { label: 'Children', value: String(totalChildren), icon: '🧒', from: '#3b82f6', to: '#1d4ed8' },
              { label: 'Total Paid', value: formatGhs(totalPaid), icon: '💰', from: '#10b981', to: '#047857' },
              { label: 'Confirmed', value: String(confirmedCount), icon: '✅', from: '#f59e0b', to: '#d97706' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/95 backdrop-blur p-3 sm:p-5 shadow-xl border border-white/50" style={{ boxShadow: '0 18px 40px -18px rgba(0,0,0,0.45)' }}>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-burgundy/50 truncate">{s.label}</span>
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm shadow-md flex-shrink-0" style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}>{s.icon}</span>
                </div>
                <p className="text-sm sm:text-2xl font-bold text-maroon leading-tight break-words">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Saved Form Reminder */}
        <SavedFormReminder />

        {/* Tabs — pills */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 border border-beige/60 w-fit shadow-sm">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                activeTab === key
                  ? 'bg-gradient-to-r from-maroon to-burgundy text-gold shadow-md'
                  : 'text-maroon/60 hover:text-maroon hover:bg-white'
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
                  onClick={openAddChild}
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
              <div className="grid gap-4 sm:grid-cols-2">
                {registrations.map((reg) => (
                  <div key={reg.id} className="group relative bg-white rounded-2xl p-5 border border-beige/70 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    {/* top accent by payment status */}
                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{
                      background: reg.paymentStatus === 'PAID'
                        ? 'linear-gradient(90deg,#10b981,#047857)'
                        : reg.paymentStatus === 'PARTIAL'
                        ? 'linear-gradient(90deg,#3b82f6,#1d4ed8)'
                        : 'linear-gradient(90deg,#f59e0b,#d97706)',
                    }} />

                    <div className="flex items-start gap-4">
                      {/* Photo */}
                      <div className="flex-shrink-0">
                        {reg.child?.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={reg.child.photo} alt={reg.child.name || 'Camper'}
                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-gold/60 shadow-md" />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md"
                            style={{ background: 'linear-gradient(135deg,#cba36b,#a97c3f)' }}>
                            {(reg.child?.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-lg font-bold text-maroon truncate">{reg.child?.name || 'Self Registration'}</p>
                        {reg.child && <p className="text-xs text-burgundy/70">Age {reg.child.age}{reg.child.school ? ` · ${reg.child.school}` : ''}</p>}
                        <p className="text-[11px] text-gold font-mono mt-1 truncate">Ref: {reg.referenceCode}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                            reg.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                            reg.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {reg.status === 'CONFIRMED' ? '✅ Confirmed' : reg.status === 'PENDING' ? '⏳ Pending' : reg.status}
                          </span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                            reg.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                            reg.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {reg.paymentStatus === 'PAID' ? '💰 Paid' : reg.paymentStatus === 'PARTIAL' ? '💳 Partial' : '⏱️ Unpaid'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount paid strip */}
                    <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
                      style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)' }}>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700/70">Amount Paid</span>
                      <span className="text-lg font-bold text-emerald-700">
                        {formatGhs(reg.amountPaid || 0)}
                      </span>
                    </div>

                    {/* Balance due + reminder — only when not fully paid */}
                    {reg.paymentStatus !== 'PAID' && (() => {
                      const balance = Math.max(0, CAMP_FEE_GHS - (reg.amountPaid || 0));
                      return (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between rounded-xl px-4 py-3"
                            style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)' }}>
                            <div>
                              <span className="block text-[11px] font-bold uppercase tracking-wider text-orange-700/70">Balance Due</span>
                              <span className="block text-[10px] text-orange-700/60">Pay via bank transfer below</span>
                            </div>
                            <span className="text-lg font-bold text-orange-700">{formatGhs(balance)}</span>
                          </div>

                          {reg.paymentStatus === 'UNPAID' && <PayCountdown createdAt={reg.createdAt} />}
                        </div>
                      );
                    })()}

                    {/* Check-in barcode — scan this at the camp gate */}
                    <div className="mt-3 rounded-xl bg-white border border-beige/70 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-burgundy/50 mb-1">Check-In Pass — show at the gate</p>
                      <Barcode value={reg.referenceCode} className="mx-auto max-w-full h-auto" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Permanent payment info — how to pay via bank transfer */}
            {registrations.length > 0 && !showAddChild && (
              <div className="bg-white border-2 border-emerald-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-maroon mb-4 flex items-center gap-2">
                  💳 How to Pay
                </h3>
                <BankDetails
                  referenceCode={registrations[0]?.referenceCode}
                  camperName={registrations[0]?.child?.name || undefined}
                  compact
                />
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
                  <div className="py-4">
                    <div className="text-center mb-5">
                      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="font-serif text-xl text-maroon italic">Child registered! 🎉</p>
                      <p className="text-sm text-burgundy/70 mt-1">Complete payment using the bank details below</p>
                    </div>

                    <BankDetails referenceCode={addChildRef} camperName={newChild.name} compact />

                    <div className="flex gap-3 justify-center mt-6">
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
                        <label className={labelClass}>Gender</label>
                        <select required value={newChild.gender} onChange={e => updateNewChild('gender', e.target.value)} className={inputClass}>
                          <option value="" disabled>Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
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
                      <div>
                        <label className={labelClass}>Emergency Contact Name</label>
                        <input type="text" value={newChild.emergencyContactName} onChange={e => updateNewChild('emergencyContactName', e.target.value)} placeholder="e.g. Aunt Ama Mensah" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Emergency Contact Number</label>
                        <input type="tel" value={newChild.emergencyContactPhone} onChange={e => updateNewChild('emergencyContactPhone', e.target.value)} placeholder="+233 20 000 0000" className={inputClass} />
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
                      disabled={addingChild}
                      className="w-full bg-gradient-to-r from-gold via-amber-500 to-orange-500 text-maroon font-bold py-4 rounded-xl tracking-wider uppercase text-sm hover:shadow-lg transition-all disabled:opacity-50 mt-6 shadow-md"
                    >
                      {addingChild ? '⏳ Registering...' : '🎯 Register Child'}
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
                <a href="mailto:info@nagartayouthcamp.tech" className="text-sm text-maroon font-semibold hover:text-gold break-all">
                  info@nagartayouthcamp.tech
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

// 24-hour countdown to pay. When it hits zero the backend auto-releases the
// unpaid spot on the next portal load, so this warns the parent in real time.
const PAY_WINDOW_MS = 24 * 60 * 60 * 1000;

function PayCountdown({ createdAt }: { createdAt: string }) {
  const deadline = new Date(createdAt).getTime() + PAY_WINDOW_MS;
  const [remaining, setRemaining] = useState(() => deadline - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(deadline - Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (remaining <= 0) {
    return (
      <div className="mt-2.5 rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-center">
        <p className="text-xs font-bold text-red-700">⛔ Payment window closed</p>
        <p className="text-[11px] text-red-600/80 mt-0.5">This unpaid spot will be cancelled and removed automatically.</p>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = Math.floor(remaining / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);
  const secs = Math.floor((remaining % 60_000) / 1000);
  const urgent = remaining < 3_600_000; // under 1 hour

  return (
    <div className={`mt-2.5 rounded-xl px-4 py-3 border ${urgent ? 'bg-red-50 border-red-200' : 'bg-rose-50 border-rose-200'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${urgent ? 'text-red-700' : 'text-rose-700'}`}>
            ⏳ Pay within
          </p>
          <p className="text-[10px] text-rose-700/70 leading-tight">or this spot closes &amp; is deleted automatically</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {[{ v: hours, l: 'H' }, { v: mins, l: 'M' }, { v: secs, l: 'S' }].map((t, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`rounded-lg px-2 py-1 text-center ${urgent ? 'bg-red-600' : 'bg-rose-600'}`}>
                <span className="block text-sm font-bold text-white tabular-nums leading-none">{pad(t.v)}</span>
                <span className="block text-[8px] text-white/70 font-semibold">{t.l}</span>
              </div>
              {i < 2 && <span className="text-rose-400 font-bold">:</span>}
            </div>
          ))}
        </div>
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
