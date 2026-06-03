export default function AdminSecurityPage() {
  return (
    <div>
      <div className="ad-page-hd">
        <div><h1>Security</h1><p>Platform security settings and activity logs.</p></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.1rem' }}>
        <div className="ad-card">
          <div className="ad-card-hd"><h3>Admin Access</h3></div>
          {[
            { label: 'Two-Factor Authentication', status: 'Enabled', color: '#10B981' },
            { label: 'Session Timeout (mins)', status: '30', color: '#6B7280' },
            { label: 'Failed Login Lockout', status: 'After 5 attempts', color: '#6B7280' },
          ].map(item => (
            <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--ad-border)' }}>
              <span style={{ fontSize:'0.82rem', color:'var(--ad-text2)' }}>{item.label}</span>
              <span style={{ fontSize:'0.82rem', fontWeight:600, color: item.color }}>{item.status}</span>
            </div>
          ))}
        </div>
        <div className="ad-card">
          <div className="ad-card-hd"><h3>Recent Admin Activity</h3></div>
          {[
            { action: 'Admin login', time: '2024-12-19 09:12', ip: '102.91.4.22' },
            { action: 'User u4 suspended', time: '2024-12-18 14:33', ip: '102.91.4.22' },
            { action: 'Vendor v4 suspended', time: '2024-12-17 11:05', ip: '102.91.4.22' },
            { action: 'Settings updated', time: '2024-12-16 16:44', ip: '102.91.4.22' },
          ].map((a, i) => (
            <div key={i} style={{ padding:'9px 0', borderBottom:'1px solid var(--ad-border)' }}>
              <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--ad-text1)' }}>{a.action}</div>
              <div style={{ fontSize:'0.7rem', color:'var(--ad-text3)', marginTop:'2px' }}>{a.time} · {a.ip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
