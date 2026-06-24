import { useState } from 'react';
import { LucideBriefcase, LucideMail, LucidePhone, LucideMapPin, LucideShieldCheck, LucideSave, LucideCamera } from 'lucide-react';
import { useVendor } from '../../_context/VendorContext';

export default function VendorProfilePage() {
  const { company, updateCompany } = useVendor();
  const [form, setForm] = useState({
    name:               company?.name || '',
    registrationNumber: company?.registrationNumber || '',
    contactPerson:      company?.contactPerson || '',
    phone:               company?.phone || '',
    address:             company?.address || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    await updateCompany({ ...company, ...form });
    setSaving(false);
  };

  if (!company) return null;

  return (
    <div className="vd-profile-page">
      <div className="card-header" style={{ padding: 0, marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Company Profile</h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Manage your logistics company information and branding.</p>
      </div>

      <div className="main-report-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Left Card: Branding */}
        <div className="side-stats">
          <div className="side-card" style={{ textAlign: 'center' }}>
             <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 24px' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 24, background: 'var(--vd-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, color: '#fff' }}>
                  {company.name[0]}
                </div>
                <button style={{ position: 'absolute', right: -10, bottom: -10, width: 40, height: 40, borderRadius: 12, background: '#fff', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <LucideCamera size={18} color="#64748B" />
                </button>
             </div>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{company.name}</h2>
             <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: 4 }}>{company.email}</p>
             
             <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LucideShieldCheck size={16} color="var(--vd-primary)" /></div>
                   <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8' }}>Status</span>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--vd-primary)' }}>Verified Logistics</strong>
                   </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LucideBriefcase size={16} color="#6366F1" /></div>
                   <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8' }}>ID Number</span>
                      <strong style={{ fontSize: '0.875rem' }}>{company.registrationNumber || 'Pending'}</strong>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Card: Settings Form */}
        <div className="card-main">
          <form onSubmit={handleSave}>
            <div className="vd-form-section">
               <div className="vd-form-section-title"><LucideBriefcase size={14} /> Basic Information</div>
               <div className="vd-field">
                  <label>Company Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
               </div>
               <div className="vd-form-row">
                  <div className="vd-field">
                    <label>Registration Number</label>
                    <input value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} />
                  </div>
                  <div className="vd-field">
                    <label>Contact Person</label>
                    <input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
                  </div>
               </div>
            </div>

            <div className="vd-form-section" style={{ marginTop: 32 }}>
               <div className="vd-form-section-title"><LucidePhone size={14} /> Contact Details</div>
               <div className="vd-form-row">
                  <div className="vd-field">
                    <label>Phone Number</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="vd-field">
                    <label>Business Email</label>
                    <input disabled value={company.email} style={{ background: '#F8FAFC', cursor: 'not-allowed' }} />
                  </div>
               </div>
               <div className="vd-field">
                  <label>Business Address</label>
                  <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
               </div>
            </div>

            <div style={{ marginTop: 40, borderTop: '1px solid #F1F5F9', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
               <button 
                 type="submit" 
                 disabled={saving}
                 className="vd-btn-primary" 
                 style={{ padding: '12px 32px', borderRadius: 12, background: 'var(--vd-primary)', color: '#fff', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
               >
                 {saving ? 'Saving...' : <><LucideSave size={18} /> Save Profile</>}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
