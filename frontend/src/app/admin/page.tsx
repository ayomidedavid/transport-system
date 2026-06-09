import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LucideCalendar, LucideChevronRight, LucideArrowUpRight,
  LucideUsers, LucideTruck, LucideTicket, LucideCreditCard,
  LucideMoreVertical, LucideTrendingUp, LucideClock, LucideShieldCheck,
  LucideActivity, LucideAlertCircle
} from 'lucide-react';
import { useAdmin } from '../_context/AdminContext';

/* ─── Donut chart via SVG ─── */
function DonutChart({ segments }: { segments: { value: number; color: string }[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 54; const cx = 70; const cy = 70;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.value / total) * circumference;
    const gap  = circumference - dash;
    const arc  = { color: seg.color, dash, gap, offset };
    offset += dash;
    return arc;
  });
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
      {arcs.map((a, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={a.color} strokeWidth="16"
          strokeDasharray={animated ? `${a.dash} ${a.gap}` : `0 ${circumference}`}
          strokeDashoffset={-a.offset}
          strokeLinecap="butt"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px', transition: 'stroke-dasharray 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      ))}
    </svg>
  );
}

export default function AdminOverview() {
  const { users, vendors, bookings, transactions } = useAdmin();
  const navigate = useNavigate();

  const totalRevenue = transactions.filter(t => t.status === 'successful' && t.type === 'booking')
    .reduce((s, t) => s + t.amount, 0);
  
  const verifiedVendors = vendors.filter(v => v.verificationStatus === 'approved').length;
  const pendingVendors  = vendors.filter(v => v.verificationStatus === 'pending').length;
  const activeTrips     = bookings.filter(b => b.status === 'confirmed').length;
  const suspendedUsers  = users.filter(u => u.status === 'suspended').length || 0;

  const recentBookings = [...bookings].sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 8);

  const stats = [
    { label: 'Verified Vendors', value: verifiedVendors, icon: <LucideShieldCheck size={20} color="#10B981" />, trend: '+12% from last month' },
    { label: 'Pending Review',  value: pendingVendors,  icon: <LucideClock size={20} color="#F59E0B" />, trend: 'Action required' },
    { label: 'Active Bookings', value: activeTrips,      icon: <LucideActivity size={20} color="#3B82F6" />, trend: 'Live now' },
    { label: 'Suspended Users', value: suspendedUsers,   icon: <LucideAlertCircle size={20} color="#EF4444" />, trend: 'Manual check' },
  ];

  return (
    <div className="ad-dashboard-grid">
      
      {/* ── Horizontal Premium Stats ── */}
      <div className="ad-horizontal-stats">
        {stats.map((s, i) => (
          <div key={i} className="ad-stat-card-premium">
            <div className="ad-stat-card-icon">{s.icon}</div>
            <div className="ad-stat-card-label">{s.label}</div>
            <div className="ad-stat-card-value">{s.value}</div>
            <div className={`ad-stat-card-trend ${s.label === 'Verified Vendors' ? 'up' : ''}`}>
              {s.trend}
            </div>
          </div>
        ))}
      </div>

      {/* ── Secondary Row ── */}
      <div className="ad-top-row">
        {/* Main Wallet Card */}
        <div className="ad-card-main" style={{ background: 'linear-gradient(135deg, #11141D 0%, #06080F 100%)', border: '1px solid var(--ad-border)', color: '#fff' }}>
          <div>
            <div className="ad-card-main-header" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span>Platform Financial Summary</span>
              <span>Total Earnings</span>
            </div>
            <div className="ad-card-main-title">
              <div className="ad-card-main-val" style={{ fontSize: '2.8rem', marginBottom: '0.5rem', color: '#fff' }}>
                ₦{(totalRevenue / 1000).toLocaleString()}K
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                <LucideTrendingUp size={14} style={{ marginRight: 4, display: 'inline' }} color="#10B981" />
                Growth this month: +18.4%
              </p>
            </div>
          </div>
          
          <div className="ad-card-main-footer">
            <button className="ad-btn-primary" onClick={() => navigate('/admin/transactions')}>Financial Reports</button>
            <button className="ad-btn-secondary" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }} onClick={() => navigate('/admin/settings')}>Audit Logs</button>
          </div>
        </div>

        {/* Action Card */}
        <div className="ad-card-accent" style={{ background: 'var(--ad-green)', color: '#fff' }}>
          <div>
            <h2 style={{ color: '#fff' }}>Network Expansion</h2>
            <p style={{ color: 'rgba(255,255,255,0.85)' }}>You have {pendingVendors} logistics partners awaiting verification. Reviewing applications promptly improves platform availability.</p>
          </div>
          <button className="ad-btn-white" style={{ background: '#fff', color: 'var(--ad-green)' }} onClick={() => navigate('/admin/vendors')}>Verify Partners</button>
        </div>
      </div>

      {/* ── Bottom Content Grid ── */}
      <div className="ad-bottom-row" style={{ gridTemplateColumns: '1.8fr 1.2fr' }}>
        
        {/* Activity Feed */}
        <div className="ad-card">
          <div className="ad-card-hd">
            <h3>Platform Activity</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ad-tab active">All</button>
              <button className="ad-tab">Bookings</button>
              <button className="ad-tab">Payouts</button>
            </div>
          </div>
          <table className="ad-table-minimal">
            <tbody>
              {recentBookings.map((bk, i) => (
                <tr key={bk.id || i}>
                  <td className="date">{bk.date?.split(' ')[0] || 'Today'}</td>
                  <td>
                    <div className="name">{bk.studentName}</div>
                    <div className="type">{bk.route}</div>
                  </td>
                  <td>
                    <div className="category">
                      <span className="category-dot" style={{ background: bk.status === 'completed' ? '#10B981' : '#F59E0B' }} />
                      {bk.vendorName}
                    </div>
                  </td>
                  <td className="amount pos">₦{bk.amount.toLocaleString()}</td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8', padding: '4rem' }}>No recent activity detected</td></tr>
              )}
            </tbody>
          </table>
          <button className="ad-see-more" onClick={() => navigate('/admin/transactions')}>View Full Audit Trail →</button>
        </div>

        {/* Performance Chart */}
        <div className="ad-card">
          <div className="ad-card-hd">
            <h3>Booking Distribution</h3>
          </div>
          
          <div className="ad-donut-container" style={{ flexDirection: 'column', gap: '2rem' }}>
            <div className="ad-donut-svg-wrap" style={{ width: 140, height: 140, margin: '0 auto' }}>
              <DonutChart segments={[
                { value: bookings.filter(b=>b.status==='completed').length || 1, color: '#10B981' },
                { value: bookings.filter(b=>b.status==='confirmed').length || 1, color: '#3B82F6' },
                { value: bookings.filter(b=>b.status==='pending').length   || 1, color: '#F59E0B' },
                { value: bookings.filter(b=>b.status==='cancelled').length || 1, color: '#EF4444' },
              ]} />
              <div className="ad-donut-center">
                <strong style={{ fontSize: '1.5rem' }}>{bookings.length}</strong>
                <span style={{ fontSize: '0.8rem' }}>Total</span>
              </div>
            </div>

            <div className="ad-donut-legend" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="ad-donut-leg-item"><span className="ad-donut-leg-dot" style={{ background: '#10B981' }} /><span>Completed</span></div>
              <div className="ad-donut-leg-item"><span className="ad-donut-leg-dot" style={{ background: '#3B82F6' }} /><span>Confirmed</span></div>
              <div className="ad-donut-leg-item"><span className="ad-donut-leg-dot" style={{ background: '#F59E0B' }} /><span>Pending</span></div>
              <div className="ad-donut-leg-item"><span className="ad-donut-leg-dot" style={{ background: '#EF4444' }} /><span>Cancelled</span></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
