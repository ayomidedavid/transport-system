import { useAdmin } from '../../_context/AdminContext';
import { useUser } from '../../_context/UserContext';
import { useNavigate } from 'react-router-dom';
import { LucideMoon, LucideSun, LucideLogOut, LucideSettings } from 'lucide-react';

export default function AdminSettingsPage() {
  const { theme, setTheme } = useAdmin();
  const { logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="ad-dashboard-grid">
      <div>
        <h1 className="ad-page-title" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Platform Settings</h1>
        <p className="ad-page-sub" style={{ color: 'var(--ad-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Global configuration and system preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Core Settings */}
        <div className="ad-card">
          <div className="ad-card-hd"><h3>Core Configuration</h3></div>
          {[
            { label: 'Platform Name', value: 'UNIRIDE' },
            { label: 'Default University', value: "Redeemer's University, Ede" },
            { label: 'Admin Email', value: 'admin@uniride.ng' },
            { label: 'Support Email', value: 'support@uniride.ng' },
          ].map(item => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 0', borderBottom:'1px solid var(--ad-border)' }}>
              <span style={{ fontSize:'0.85rem', color:'var(--ad-text-muted)' }}>{item.label}</span>
              <span style={{ fontSize:'0.85rem', fontWeight:600 }}>{item.value}</span>
            </div>
          ))}
          <div style={{ marginTop:'1.5rem' }}>
            <button className="ad-btn-primary">Update System Configuration</button>
          </div>
        </div>

        {/* Appearance & Session */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="ad-card">
            <div className="ad-card-hd"><h3>Appearance</h3></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--ad-text-muted)', marginBottom: '1.5rem' }}>Customize how the dashboard looks for you.</p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className={`ad-sidebar-link ${theme === 'light' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setTheme('light')}
              >
                <LucideSun size={18} /> Light
              </button>
              <button 
                className={`ad-sidebar-link ${theme === 'dark' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setTheme('dark')}
              >
                <LucideMoon size={18} /> Dark
              </button>
            </div>
          </div>

          <div className="ad-card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="ad-card-hd"><h3 style={{ color: '#EF4444' }}>Session</h3></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--ad-text-muted)', marginBottom: '1.5rem' }}>Terminate your current administrative session.</p>
            <button 
              className="ad-btn-primary" 
              style={{ background: '#EF4444', color: '#fff', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={handleLogout}
            >
              <LucideLogOut size={18} /> Sign Out
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
