import { useState } from 'react';
import { LucideSearch, LucideUserCheck, LucideUserX, LucideUsers, LucideActivity, LucideShieldAlert, LucideWallet, LucideDownload } from 'lucide-react';
import { useAdmin } from '../../_context/AdminContext';
import { downloadUsersPDF } from '../../../lib/pdf-export';

export default function AdminUsersPage() {
  const { users, suspendUser, activateUser } = useAdmin();
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const filtered = users.filter(u => {
    const matchQuery = !query || `${u.firstName} ${u.lastName} ${u.email} ${u.matric}`.toLowerCase().includes(query.toLowerCase());
    const matchFilter = filter === 'all' || u.status === filter;
    return matchQuery && matchFilter;
  });

  const totalSpent = users.reduce((s, u) => s + u.totalSpent, 0);
  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const totalBookings = users.reduce((s, u) => s + u.totalBookings, 0);

  const stats = [
    { label: 'Total Students', value: users.length,     icon: <LucideUsers size={20} color="#3B82F6" />, trend: 'Registered' },
    { label: 'Active',         value: activeCount,      icon: <LucideActivity size={20} color="#10B981" />, trend: 'Normal' },
    { label: 'Suspended',      value: suspendedCount,   icon: <LucideShieldAlert size={20} color="#EF4444" />, trend: 'Restricted' },
    { label: 'Wallet Volume',  value: `₦${(totalSpent/1000).toFixed(0)}K`, icon: <LucideWallet size={20} color="#F59E0B" />, trend: 'Total Spent' },
  ];

  return (
    <div className="ad-dashboard-grid">
      
      {/* ── Stats ── */}
      <div className="ad-horizontal-stats">
        {stats.map((s, i) => (
          <div key={i} className="ad-stat-card-premium">
            <div className="ad-stat-card-icon">{s.icon}</div>
            <div className="ad-stat-card-label">{s.label}</div>
            <div className="ad-stat-card-value">{s.value}</div>
            <div className="ad-stat-card-trend">{s.trend}</div>
          </div>
        ))}
      </div>

      <div className="ad-card">
        <div className="ad-toolbar" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>Student Accounts</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--ad-text-muted)' }}>Monitor student activity and manage account statuses.</p>
          </div>
          <div className="ad-header-search" style={{ background: 'var(--ad-bg)', border: '1px solid var(--ad-border)' }}>
            <LucideSearch size={14} color="var(--ad-text-muted)" />
            <input placeholder="Search students..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className="ad-tabs" style={{ background: 'var(--ad-bg)', padding: '4px', borderRadius: '12px', width: 'max-content' }}>
            {(['all','active','suspended'] as const).map(f => (
              <button key={f} className={`ad-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <button 
             onClick={() => {
               const exportData = filtered.map(u => ({
                 'First Name': u.firstName,
                 'Last Name': u.lastName,
                 'Email': u.email,
                 'Matric Number': u.matric,
                 'Department': u.department,
                 'Phone': u.phone,
                 'Total Bookings': u.totalBookings,
                 'Total Spent': u.totalSpent,
                 'Status': u.status,
                 'Date Joined': new Date(u.joinedAt).toLocaleDateString()
               }));
               downloadUsersPDF(exportData, `student_accounts_${new Date().toISOString().split('T')[0]}.pdf`);
             }}
             className="ad-btn-primary"
             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem', background: '#DC2626' }}
          >
             <LucideDownload size={16} /> Export PDF
          </button>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Identity</th>
                <th>Contact</th>
                <th>Activity</th>
                <th>Volume</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="ad-empty" style={{ textAlign: 'center', padding: '4rem', color: 'var(--ad-text-muted)' }}>No student accounts found.</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--ad-green-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', fontWeight:800, color:'var(--ad-green)' }}>
                        {u.firstName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.matric}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>{u.department}</div>
                  </td>
                  <td>{u.phone}</td>
                  <td><strong>{u.totalBookings}</strong> Bookings</td>
                  <td style={{ color: 'var(--ad-green)', fontWeight: 600 }}>₦{u.totalSpent.toLocaleString()}</td>
                  <td><span className={`ad-badge ${u.status}`}>{u.status}</span></td>
                  <td>
                    {u.status === 'active'
                      ? <button className="ad-action-btn" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => suspendUser(u.id)}>Suspend</button>
                      : <button className="ad-btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => activateUser(u.id)}>Activate</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
