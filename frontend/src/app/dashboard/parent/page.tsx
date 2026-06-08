'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getMe, getAnnouncements, getMyRegistrations, submitRegistration, type User, type Announcement, type Registration } from '@/lib/api';
import { getToken, getStoredUser, clearAuth } from '@/lib/auth';

const PACKING_LIST = [
  'Comfortable athletic wear (5 changes)',
  'Smart/formal outfit for Awards Night',
  'Running shoes & slippers',
  'Toiletries & personal hygiene items',
  'Bedsheet and light blanket',
  'Notebook & pens',
  'Bible or devotional material',
  'Water bottle',
  'Any prescribed medication',
  'Positive attitude & open mind',
];

const inputClass = 'w-full px-4 py-3 border border-beige rounded-lg bg-white text-maroon text-sm focus:outline-none focus:ring-2 focus:ring-gold';
const labelClass = 'block label-caps text-burgundy mb-1.5';
const emptyChild = { name: '', age: '', school: '', dietaryNeeds: '', medicalNotes: '', emergencyContact: '' };

export default function ParentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'packing' | 'announcements'>('overview');
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

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'packing', label: 'Packing List' },
    { key: 'announcements', label: `Announcements (${announcements.length})` },
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
                  <div key={reg.id} className="bg-white border border-beige rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-maroon">{reg.child?.name || 'Self Registration'}</p>
                      {reg.child && <p className="text-sm text-burgundy">Age {reg.child.age}{reg.child.school ? ` · ${reg.child.school}` : ''}</p>}
                      <p className="text-xs text-gold font-mono mt-1">{reg.referenceCode.slice(0, 20)}...</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        reg.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        reg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{reg.status}</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        reg.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                        reg.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>{reg.paymentStatus}</span>
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

                    {/* Photo upload */}
                    <div>
                      <label className={labelClass}>Attendee Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-beige bg-cream flex items-center justify-center overflow-hidden flex-shrink-0">
                          {newChildPhotoPreview ? (
                            <img src={newChildPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-6 h-6 text-burgundy/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <label className="cursor-pointer inline-flex items-center gap-2 bg-beige text-maroon px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase hover:bg-gold/30 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {newChildPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleNewChildPhoto} />
                        </label>
                        {photoError && <p className="text-xs text-red-600 font-medium mt-1">⚠️ {photoError}</p>}
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
                      disabled={addingChild}
                      className="w-full bg-gold text-maroon font-semibold py-3 rounded-lg tracking-wider uppercase text-sm hover:bg-amber-500 transition-colors disabled:opacity-50 mt-6"
                    >
                      {addingChild ? 'Registering...' : 'Register Child'}
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

        {/* Packing list tab */}
        {activeTab === 'packing' && (
          <div className="bg-white border border-beige rounded-xl p-8">
            <h2 className="font-serif text-2xl font-semibold text-maroon italic mb-6">Packing List</h2>
            <ul className="space-y-3">
              {PACKING_LIST.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-maroon">
                  <span className="w-5 h-5 flex-shrink-0 border-2 border-gold rounded mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-burgundy/60 mt-6 italic">Full details will be emailed closer to the camp date.</p>
          </div>
        )}

        {/* Announcements tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-maroon/50 text-sm text-center py-12">No announcements yet.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="bg-white border border-beige rounded-xl p-6">
                  <h3 className="font-serif text-lg font-semibold text-maroon">{ann.title}</h3>
                  <p className="text-xs text-gold font-medium mt-0.5 mb-3">{new Date(ann.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-sm text-maroon/75 leading-relaxed">{ann.body}</p>
                </div>
              ))
            )}
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
