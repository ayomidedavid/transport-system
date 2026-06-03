import { useState } from 'react';
import { LucideSearch, LucideTicket, LucideClock, LucideCheckCircle, LucideShieldCheck, LucideXCircle, LucideCreditCard } from 'lucide-react';
import { useAdmin } from '../../_context/AdminContext';

export default function AdminBookingsPage() {
  const { bookings } = useAdmin();
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState<'all'|'pending'|'confirmed'|'completed'|'cancelled'>('all');

  const filtered = bookings.filter(b => {
    const matchQ = !query || `${b.studentName} ${b.vendorName} ${b.route} ${b.ref}`.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === 'all' || b.status === filter;
    return matchQ && matchF;
  });

  const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s,b) => s+b.amount, 0);

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: <LucideTicket size={20} color="#3B82F6" />, trend: 'All entries' },
    { label: 'Pending',       value: bookings.filter(b=>b.status==='pending').length, icon: <LucideClock size={20} color="#F59E0B" />, trend: 'Awaiting' },
    { label: 'Confirmed',     value: bookings.filter(b=>b.status==='confirmed').length, icon: <LucideShieldCheck size={20} color="#10B981" />, trend: 'Verified' },
    { label: 'Revenue',       value: `₦${(revenue/1000).toFixed(0)}K`, icon: <LucideCreditCard size={20} color="#10B981" />, trend: 'Gross' },
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
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>Ride Bookings</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--ad-text-muted)' }}>Audit and manage all trip reservations on the platform.</p>
          </div>
          <div className="ad-header-search" style={{ background: 'var(--ad-bg)', border: '1px solid var(--ad-border)' }}>
            <LucideSearch size={14} color="var(--ad-text-muted)" />
            <input placeholder="Search bookings..." value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
        </div>

        <div className="ad-tabs" style={{ marginBottom: '1.5rem', background: 'var(--ad-bg)', padding: '4px', borderRadius: '12px', width: 'max-content' }}>
          {(['all','pending','confirmed','completed','cancelled'] as const).map(f => (
            <button key={f} className={`ad-tab${filter===f?' active':''}`} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Student</th>
                <th>Vendor</th>
                <th>Route</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="ad-empty" style={{ textAlign: 'center', padding: '4rem', color: 'var(--ad-text-muted)' }}>No bookings found.</td></tr>
              )}
              {filtered.map(b => (
                <tr key={b.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{b.ref}</span></td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{b.studentName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>{b.studentEmail}</div>
                  </td>
                  <td>{b.vendorName}</td>
                  <td>{b.route}</td>
                  <td>{b.date}</td>
                  <td style={{ color: 'var(--ad-green)', fontWeight: 600 }}>₦{b.amount.toLocaleString()}</td>
                  <td><span className={`ad-badge ${b.status}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
