'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { submitVolunteer } from '@/lib/api';
import { fileToCompressedDataUrl } from '@/lib/image';

const inputClass = 'w-full px-4 py-3 border border-white/25 rounded-lg bg-white/10 text-cream text-sm focus:outline-none focus:ring-2 focus:ring-gold placeholder-cream/40';
const selectClass = `${inputClass} [&>option]:bg-white [&>option]:text-maroon`;
const labelClass = 'block text-xs font-semibold tracking-wider uppercase text-gold mb-1.5';
const PAGE_BG = 'linear-gradient(135deg,#221738 0%,#2a2f45 50%,#3c7055 100%)';

const ID_TYPES = ['Ghana Card', 'Passport', "Voter's ID", "Driver's Licence", 'NHIS Card', 'Other'];

const SKILLS = ['Teaching','Youth Mentoring','Leadership Training','Public Speaking','Counselling','Event Management','First Aid','Nursing','Medicine','Psychology','Child Development','Media','Photography','Videography','Graphic Design','Marketing','Administration','Finance','IT Support','Security','Sports Coaching','Music','Drama','Dance','Entrepreneurship','Catering','Logistics','Driving','Other'];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gold text-maroon text-sm font-bold flex-shrink-0">{n}</span>
        <h2 className="font-serif text-lg font-bold text-cream">{title}</h2>
      </div>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={labelClass}>{label}</label>{children}</div>;
}

export default function VolunteerApplyPage() {
  const [f, setF] = useState<Record<string, string>>({});
  const [skills, setSkills] = useState<string[]>([]);
  const [decl, setDecl] = useState<boolean[]>([false, false, false, false]);
  const [idPhoto, setIdPhoto] = useState('');
  const [photoErr, setPhotoErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function handleIdPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again after a removal
    if (!file) return;
    setPhotoErr('');
    if (file.size > 15 * 1024 * 1024) { setPhotoErr('That image is over 15MB. Please choose a smaller one.'); return; }
    try {
      setIdPhoto(await fileToCompressedDataUrl(file, 1200, 0.8));
    } catch {
      setPhotoErr('Could not read that image. Please try another one.');
    }
  }
  const toggleSkill = (s: string) => setSkills((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const Radio = ({ name, opts = ['Yes', 'No'] }: { name: string; opts?: string[] }) => (
    <div className="flex gap-4 mt-1">
      {opts.map((o) => (
        <label key={o} className="flex items-center gap-1.5 text-sm text-cream cursor-pointer">
          <input type="radio" name={name} checked={f[name] === o} onChange={() => setF((p) => ({ ...p, [name]: o }))} className="accent-gold w-4 h-4" />
          {o}
        </label>
      ))}
    </div>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!f.fullName || f.fullName.length < 2) { setError('Please enter your full name.'); return; }
    if (!f.email || !f.email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (!decl.every(Boolean)) { setError('Please tick all four declaration boxes to submit.'); return; }
    setLoading(true);
    try {
      await submitVolunteer({ ...f, skills, idPhoto, declaration: decl.every(Boolean) });
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Could not submit your application. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: PAGE_BG }}>
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-cream mb-2 italic">Application Received!</h1>
          <p className="text-sm text-cream/70 mb-6">Thank you for offering to volunteer with NAGARTA. Our team will review your application and be in touch.</p>
          <Link href="/" className="inline-block bg-gold text-maroon px-6 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase hover:bg-amber-500 transition-colors">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className="py-4 px-6">
        <Link href="/"><Image src="/logo-full.png" alt="NAGARTA" width={40} height={40} className="object-contain" /></Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-gold mb-2">Join the Team</p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-cream italic">Volunteer Application</h1>
          <div className="w-16 h-0.5 bg-gold mx-auto mt-4" />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section n={1} title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Field label="Full Name *"><input className={inputClass} value={f.fullName || ''} onChange={set('fullName')} required /></Field></div>
              <Field label="Date of Birth"><input type="date" className={inputClass} value={f.dob || ''} onChange={set('dob')} /></Field>
              <Field label="Gender"><select className={selectClass} value={f.gender || ''} onChange={set('gender')}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
              <Field label="Nationality"><input className={inputClass} value={f.nationality || ''} onChange={set('nationality')} /></Field>
              <Field label="Region / City of Residence"><input className={inputClass} value={f.region || ''} onChange={set('region')} /></Field>
              <div className="sm:col-span-2"><Field label="Residential Address"><input className={inputClass} value={f.address || ''} onChange={set('address')} /></Field></div>
              <Field label="Mobile Number"><input type="tel" className={inputClass} value={f.mobile || ''} onChange={set('mobile')} /></Field>
              <Field label="WhatsApp Number"><input type="tel" className={inputClass} value={f.whatsapp || ''} onChange={set('whatsapp')} /></Field>
              <Field label="Email Address *"><input type="email" className={inputClass} value={f.email || ''} onChange={set('email')} required /></Field>
              <Field label="Occupation"><input className={inputClass} value={f.occupation || ''} onChange={set('occupation')} /></Field>
              <Field label="Employer / Institution"><input className={inputClass} value={f.employer || ''} onChange={set('employer')} /></Field>
              <Field label="Highest Educational Qualification"><input className={inputClass} value={f.education || ''} onChange={set('education')} /></Field>
            </div>

            <div className="border-t border-white/15 mt-6 pt-5">
              <p className="text-sm font-semibold text-cream mb-4">Identification</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="ID Type">
                  <select className={selectClass} value={f.idType || ''} onChange={set('idType')}>
                    <option value="">Select</option>
                    {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="ID Number"><input className={inputClass} value={f.idNumber || ''} onChange={set('idNumber')} /></Field>
              </div>

              <div className="mt-4">
                <label className={labelClass}>ID Photo</label>
                <input ref={uploadRef} type="file" accept="image/*" onChange={handleIdPhoto} className="hidden" />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleIdPhoto} className="hidden" />

                {idPhoto ? (
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={idPhoto} alt="ID preview" className="w-44 h-28 object-cover rounded-lg border border-white/25" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => uploadRef.current?.click()} className="text-xs px-4 py-2 rounded-full border border-white/25 text-cream/80 hover:bg-white/10 transition-colors">Replace</button>
                      <button type="button" onClick={() => setIdPhoto('')} className="text-xs px-4 py-2 rounded-full border border-white/25 text-cream/60 hover:bg-white/10 transition-colors">Remove</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={() => uploadRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/30 text-cream/80 text-sm hover:bg-white/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Upload ID
                    </button>
                    <button type="button" onClick={() => cameraRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/30 text-cream/80 text-sm hover:bg-white/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Take Photo
                    </button>
                  </div>
                )}
                {photoErr && <p className="text-xs text-red-300 mt-2">{photoErr}</p>}
                <p className="text-[11px] text-cream/40 mt-2">A clear photo of the ID you selected above. Max 15MB.</p>
              </div>
            </div>
          </Section>

          <Section n={2} title="Emergency Contact">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Emergency Contact Name"><input className={inputClass} value={f.emgName || ''} onChange={set('emgName')} /></Field>
              <Field label="Relationship"><input className={inputClass} value={f.emgRelationship || ''} onChange={set('emgRelationship')} /></Field>
              <Field label="Telephone Number"><input type="tel" className={inputClass} value={f.emgPhone || ''} onChange={set('emgPhone')} /></Field>
              <Field label="Alternative Number"><input type="tel" className={inputClass} value={f.emgAltPhone || ''} onChange={set('emgAltPhone')} /></Field>
              <div className="sm:col-span-2"><Field label="Email (optional)"><input type="email" className={inputClass} value={f.emgEmail || ''} onChange={set('emgEmail')} /></Field></div>
            </div>
          </Section>

          <Section n={3} title="Skills & Experience">
            <label className={labelClass}>Have you volunteered before?</label>
            <Radio name="volunteeredBefore" />
            {f.volunteeredBefore === 'Yes' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Field label="Organisation"><input className={inputClass} value={f.prevOrg || ''} onChange={set('prevOrg')} /></Field>
                <Field label="Role"><input className={inputClass} value={f.prevRole || ''} onChange={set('prevRole')} /></Field>
                <Field label="Number of years"><input className={inputClass} value={f.prevYears || ''} onChange={set('prevYears')} /></Field>
              </div>
            )}
            <p className={`${labelClass} mt-6`}>Professional Skills — tick all that apply</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SKILLS.map((s) => (
                <label key={s} className={`flex items-center gap-2 text-sm cursor-pointer rounded-lg px-2.5 py-1.5 border ${skills.includes(s) ? 'bg-gold/25 border-gold text-cream' : 'border-white/20 text-cream/70 hover:bg-white/10'}`}>
                  <input type="checkbox" checked={skills.includes(s)} onChange={() => toggleSkill(s)} className="accent-gold w-4 h-4" />
                  {s}
                </label>
              ))}
            </div>
          </Section>

          <Section n={4} title="Availability">
            <label className={labelClass}>Can you attend the full camp?</label>
            <Radio name="attendFull" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Available from"><input type="date" className={inputClass} value={f.availFrom || ''} onChange={set('availFrom')} /></Field>
              <Field label="Available until"><input type="date" className={inputClass} value={f.availUntil || ''} onChange={set('availUntil')} /></Field>
            </div>
            <label className={`${labelClass} mt-4`}>Will you attend orientation?</label>
            <Radio name="attendOrientation" />
          </Section>

          <Section n={5} title="Child Protection & Background">
            <p className="text-xs text-cream/60 mb-4">Because this is a youth camp, safeguarding is extremely important.</p>
            <div className="space-y-4">
              <div><label className={labelClass}>Have you ever worked with children?</label><Radio name="workedChildren" /></div>
              <div><label className={labelClass}>Do you have any safeguarding training?</label><Radio name="safeguardingTraining" /></div>
              <div><label className={labelClass}>Have you ever been convicted of a criminal offence?</label><Radio name="convicted" />
                {f.convicted === 'Yes' && <textarea rows={2} className={`${inputClass} mt-2`} placeholder="Please provide details" value={f.convictedDetails || ''} onChange={set('convictedDetails')} />}
              </div>
              <div><label className={labelClass}>Would you be willing to undergo identity verification?</label><Radio name="identityVerification" /></div>
              <div><label className={labelClass}>Would you agree to abide by the NAGARTA Child Safeguarding Policy?</label><Radio name="safeguardingPolicy" /></div>
            </div>
          </Section>

          <Section n={6} title="Motivation">
            <div className="space-y-4">
              <Field label="Why would you like to volunteer for NAGARTA?"><textarea rows={3} className={inputClass} value={f.motWhy || ''} onChange={set('motWhy')} /></Field>
              <Field label="What leadership values are most important to you?"><textarea rows={3} className={inputClass} value={f.motValues || ''} onChange={set('motValues')} /></Field>
              <Field label="What unique skills or experiences would you bring to the camp?"><textarea rows={3} className={inputClass} value={f.motSkills || ''} onChange={set('motSkills')} /></Field>
              <Field label="Describe a time you worked successfully as part of a team."><textarea rows={3} className={inputClass} value={f.motTeam || ''} onChange={set('motTeam')} /></Field>
              <Field label="Why do you enjoy working with young people?"><textarea rows={3} className={inputClass} value={f.motYouth || ''} onChange={set('motYouth')} /></Field>
            </div>
          </Section>

          <Section n={7} title="Health Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Any medical conditions?"><textarea rows={2} className={inputClass} value={f.medConditions || ''} onChange={set('medConditions')} /></Field>
              <Field label="Food allergies?"><textarea rows={2} className={inputClass} value={f.allergies || ''} onChange={set('allergies')} /></Field>
              <Field label="Medications?"><textarea rows={2} className={inputClass} value={f.medications || ''} onChange={set('medications')} /></Field>
              <Field label="Physical limitations?"><textarea rows={2} className={inputClass} value={f.physicalLimits || ''} onChange={set('physicalLimits')} /></Field>
            </div>
          </Section>

          <Section n={8} title="References">
            {[1, 2].map((r) => (
              <div key={r} className="mb-5 last:mb-0">
                <p className="text-sm font-semibold text-cream mb-3">Reference {r === 1 ? 'One' : 'Two'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Name"><input className={inputClass} value={f[`ref${r}Name`] || ''} onChange={set(`ref${r}Name`)} /></Field>
                  <Field label="Position"><input className={inputClass} value={f[`ref${r}Position`] || ''} onChange={set(`ref${r}Position`)} /></Field>
                  <Field label="Organisation"><input className={inputClass} value={f[`ref${r}Org`] || ''} onChange={set(`ref${r}Org`)} /></Field>
                  <Field label="Phone"><input type="tel" className={inputClass} value={f[`ref${r}Phone`] || ''} onChange={set(`ref${r}Phone`)} /></Field>
                  <div className="sm:col-span-2"><Field label="Email"><input type="email" className={inputClass} value={f[`ref${r}Email`] || ''} onChange={set(`ref${r}Email`)} /></Field></div>
                </div>
              </div>
            ))}
          </Section>

          <Section n={9} title="Declaration">
            <div className="space-y-3">
              {[
                'I certify that the information provided is true.',
                'I agree to comply with all NAGARTA Leadership Youth Camp policies and procedures.',
                'I understand that submitting an application does not guarantee selection.',
                'I agree to uphold the values of NAGARTA and contribute to creating a safe, respectful, and positive environment for all participants.',
              ].map((t, i) => (
                <label key={i} className="flex items-start gap-3 text-sm text-cream cursor-pointer">
                  <input type="checkbox" checked={decl[i]} onChange={() => setDecl((p) => p.map((v, j) => (j === i ? !v : v)))} className="accent-gold w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <Field label="Digital Signature (type your full name)"><input className={inputClass} value={f.signature || ''} onChange={set('signature')} /></Field>
              <Field label="Date"><input type="date" className={inputClass} value={f.signDate || ''} onChange={set('signDate')} /></Field>
            </div>
          </Section>

          <button type="submit" disabled={loading} className="w-full bg-gold text-maroon font-bold py-4 rounded-xl tracking-widest uppercase text-sm hover:bg-amber-500 transition-colors disabled:opacity-50 shadow-lg">
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
