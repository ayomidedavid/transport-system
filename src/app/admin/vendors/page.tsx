import { useState } from 'react';
import {
  LucideSearch, LucideUserCheck, LucideUserX, LucideShieldCheck, LucideX,
  LucideTruck, LucideClock, LucideAlertCircle, LucideCreditCard, LucideBus, LucideWallet, LucideDownload
} from 'lucide-react';
import { useAdmin } from '../../_context/AdminContext';
import { downloadCSV } from '../../../lib/csv-export';

type Filter = 'all' | 'approved' | 'pending' | 'suspended' | 'verifications';

export default function AdminVendorsPage() {
  const { vendors, suspendVendor, activateVendor, approveVendor, rejectVendor } = useAdmin();
  const [query,        setQuery]        = useState('');
  const [filter,       setFilter]       = useState<Filter>('all');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = vendors.filter(v => {
    const matchQ = !query || `${v.name} ${v.email} ${v.registrationNumber} ${v.contactPerson}`.toLowerCase().includes(query.toLowerCase());
    const matchF =
      filter === 'all'           ? true :
      filter === 'verifications' ? v.verificationStatus === 'pending' :
      filter === 'pending'       ? v.verificationStatus === 'pending' :
      filter === 'approved'      ? v.verificationStatus === 'approved' :
      filter === 'suspended'     ? v.status === 'suspended' :
      true;
    return matchQ && matchF;
  });

  const pendingCount = vendors.filter(v => v.verificationStatus === 'pending').length;
  const verifiedCount = vendors.filter(v => v.verificationStatus === 'approved').length;
  const suspendedCount = vendors.filter(v => v.status === 'suspended' && v.verificationStatus !== 'pending').length;
  const totalRev = vendors.reduce((s, v) => s + (v.totalRevenue || 0), 0);

  function handleReject(id: string) {
    rejectVendor(id, rejectReason.trim());
    setRejectTarget(null);
    setRejectReason('');
  }

  const stats = [
    { label: 'Verified Vendors', value: vendors.filter(v=>v.verificationStatus==='approved').length, icon: <LucideShieldCheck size={20} color="#10B981" />, trend: 'Active Partners' },
    { label: 'Pending Review',  value: pendingCount, icon: <LucideClock size={20} color="#F59E0B" />, trend: 'Action Required' },
    { label: 'Platform Revenue', value: `₦${(totalRev/1000).toFixed(0)}K`, icon: <LucideWallet size={20} color="#10B981" />, trend: 'Total Earnings' },
    { label: 'Total Trips',      value: vendors.reduce((s,v)=>s+(v.totalTrips||0), 0), icon: <LucideBus size={20} color="#3B82F6" />, trend: 'Lifetime' },
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
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>Vendor Management</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--ad-text-muted)' }}>Manage logistics partners, verify new registrations, and monitor performance.</p>
          </div>
          <div className="ad-header-search" style={{ background: 'var(--ad-bg)', border: '1px solid var(--ad-border)' }}>
            <LucideSearch size={14} color="var(--ad-text-muted)" />
            <input placeholder="Search vendors..." value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className="ad-tabs" style={{ background: 'var(--ad-bg)', padding: '4px', borderRadius: '12px', width: 'max-content' }}>
            {(['all','approved','pending','suspended', 'verifications'] as const).map(f => (
              <button key={f} className={`ad-tab${filter===f?' active':''}`} onClick={()=>setFilter(f)}>
                {f === 'verifications' ? 'Authentication' : f.charAt(0).toUpperCase()+f.slice(1)}
                {f === 'verifications' && pendingCount > 0 && <span style={{ marginLeft: 6, background: '#EF4444', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: '0.7rem' }}>{pendingCount}</span>}
              </button>
            ))}
          </div>

          <button 
             onClick={() => {
               const exportData = filtered.map(v => ({
                 'Company Name': v.name,
                 'Contact Person': v.contactPerson,
                 'Email': v.email,
                 'Phone': v.phone,
                 'Reg Number': v.registrationNumber,
                 'Total Trips': v.totalTrips || 0,
                 'Total Revenue': v.totalRevenue || 0,
                 'Verification Status': v.verificationStatus,
                 'Status': v.status,
                 'Date Joined': v.joinedAt ? new Date(v.joinedAt).toLocaleDateString() : 'N/A'
               }));
               downloadCSV(exportData, `vendors_list_${new Date().toISOString().split('T')[0]}.csv`, true);
             }}
             className="ad-btn-primary"
             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
          >
             <LucideDownload size={16} /> Export CSV
          </button>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Contact Info</th>
                <th>Trips</th>
                <th>Revenue</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="ad-empty" style={{ textAlign: 'center', padding: '4rem', color: 'var(--ad-text-muted)' }}>No vendors found in this category.</td></tr>
              )}
              {filtered.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:40, height:40, borderRadius:'10px', background:'var(--ad-green-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', fontWeight:800, color:'var(--ad-green)' }}>
                        {v.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{v.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>{v.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{v.phone}</td>
                  <td><strong>{v.totalTrips || 0}</strong></td>
                  <td style={{ color: 'var(--ad-green)', fontWeight: 600 }}>₦{(v.totalRevenue || 0).toLocaleString()}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--ad-text-muted)' }}>{v.joinedAt ? new Date(v.joinedAt).toLocaleDateString() : 'N/A'}</td>
                  <td><span className={`ad-badge ${v.verificationStatus}`}>{v.verificationStatus}</span></td>
                  <td>
                    {v.verificationStatus === 'pending' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="ad-btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => approveVendor(v.id)}>Verify</button>
                        <button className="ad-action-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }} onClick={() => setRejectTarget(v.id)}>Reject</button>
                      </div>
                    ) : v.verificationStatus === 'approved' ? (
                      <button className="ad-action-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }} onClick={() => suspendVendor(v.id)}>Suspend</button>
                    ) : (
                      <button className="ad-btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => activateVendor(v.id)}>Re-activate</button>
                    )}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:8 }}>
                      {v.verificationStatus === 'pending' ? (
                        <>
                          <button className="ad-btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => approveVendor(v.id)}>
                            Verify
                          </button>
                          <button className="ad-action-btn" style={{ margin: 0 }} onClick={() => { setRejectTarget(v.id); setRejectReason(''); }}>
                            Reject
                          </button>
                        </>
                      ) : v.status === 'active' ? (
                        <button className="ad-action-btn" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => suspendVendor(v.id)}>
                          Suspend
                        </button>
                      ) : (
                        <button className="ad-btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => activateVendor(v.id)}>
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
          <div className="ad-card" style={{ maxWidth: 420, width: '100%' }}>
            <div className="ad-card-hd"><h3>Reject Registration</h3></div>
            <p style={{ fontSize:'0.85rem', color:'var(--ad-text-muted)', marginBottom: '1.5rem' }}>The vendor will be notified with the reason for rejection.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={4}
              style={{ width:'100%', background:'var(--ad-bg)', border:'1px solid var(--ad-border)', borderRadius:12, padding:'12px', color:'var(--ad-text-main)', fontSize:'0.85rem', outline:'none', marginBottom: '1.5rem' }}
            />
            <div style={{ display:'flex', gap:'1rem' }}>
              <button className="ad-btn-primary" style={{ flex: 1, background: '#EF4444' }} onClick={() => handleReject(rejectTarget)}>Confirm Rejection</button>
              <button className="ad-btn-secondary" style={{ flex: 1 }} onClick={() => setRejectTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
