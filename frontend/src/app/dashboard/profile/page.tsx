import { useState, useEffect } from 'react';
import { LucideShieldCheck, LucideSun, LucideMoon } from 'lucide-react';
import { useUser } from '../../_context/UserContext';
import { api } from '../../../lib/api';

export default function ProfilePage() {
  const { user, updateUser, theme, toggleTheme, loading } = useUser();
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);

  const [data, setData] = useState({
    firstName:  user?.firstName  ?? '',
    lastName:   user?.lastName   ?? '',
    email:      user?.email      ?? '',
    phone:      user?.phone      ?? '',
    matric:     user?.matric     ?? '',
    department: user?.department ?? '',
  });

  useEffect(() => {
    if (user) {
      setData({
        firstName:  user.firstName,
        lastName:   user.lastName,
        email:      user.email,
        phone:      user.phone,
        matric:     user.matric,
        department: user.department,
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:'1rem' }}>
        <div className="dash-avatar" style={{ width:48, height:48, animation:'pulse 1.5s infinite' }}>?</div>
        <p style={{ color:'var(--text3)', fontSize:'0.9rem', fontWeight:500 }}>Loading your profile...</p>
      </div>
    );
  }

  function update(k: keyof typeof data, v: string) {
    setData(d => ({ ...d, [k]: v }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        firstName:  data.firstName,
        lastName:   data.lastName,
        phone:      data.phone       || null,
        department: data.department  || null,
      });
      if (res.data.ok) {
        updateUser({ ...user, ...data });
        setSaved(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const initials = `${data.firstName[0] ?? ''}${data.lastName[0] ?? ''}`.toUpperCase();

  return (
    <div className="dash-profile-wrap">
      <div className="dash-profile-grid">
        {/* Left */}
        <div className="dash-card profile-side">
          <div className="profile-avatar">{initials}</div>
          <p className="profile-name">{data.firstName} {data.lastName}</p>
          <p className="profile-id">Student ID: {user?.studentId ?? '—'}</p>
          <span className="profile-verified"><LucideShieldCheck size={12} /> Verified Student</span>
        </div>

        {/* Right */}
        <div className="dash-card profile-form">
          <p className="profile-form-title">Personal Information</p>

          {saved && (
            <div className="form-success">
              <LucideShieldCheck size={15} /> Profile updated successfully.
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-grid">
              {([ ['firstName','First Name'], ['lastName','Last Name'], ['email','Email Address'], ['phone','Phone Number'], ['matric','Matric Number'], ['department','Department'], ] as [keyof typeof data, string][]).map(([key, label]) => (
                <div key={key} className="form-field">
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    className="form-input"
                    type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                    value={data[key]}
                    onChange={e => update(key, e.target.value)}
                    disabled={key === 'matric' || key === 'email'}
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      <div className="dash-card profile-pref-card">
        <p className="profile-form-title">Account Preferences</p>
        <div className="pref-grid">
          <div className="pref-item">
            <div className="pref-info">
              <h4>Display Theme</h4>
              <p>Switch between light and dark mode for your dashboard.</p>
            </div>
            <div className="theme-toggle-group">
              <button 
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => theme === 'dark' && toggleTheme()}
              >
                <LucideSun size={14} /> Light
              </button>
              <button 
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => theme === 'light' && toggleTheme()}
              >
                <LucideMoon size={14} /> Dark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
