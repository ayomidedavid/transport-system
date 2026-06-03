import { LucideTrendingUp, LucideWallet, LucideUsers, LucideActivity, LucidePieChart, LucideBarChart3 } from 'lucide-react';
import { useAdmin } from '../../_context/AdminContext';

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REV_DATA    = [42000, 58000, 51000, 74000, 66000, 89000];
const BOOK_DATA   = [12, 18, 14, 22, 19, 28];

function BigBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div>
      <div className="ad-big-chart">
        {data.map((v, i) => (
          <div key={i} className="ad-big-bar" style={{ height: `${(v / max) * 100}%`, background: color, opacity: i === data.length - 1 ? 1 : 0.55 }} />
        ))}
      </div>
      <div className="ad-chart-labels">
        {MONTHS.map(m => <div key={m} className="ad-chart-label" style={{ color: 'var(--ad-text-muted)' }}>{m}</div>)}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { users, vendors, bookings, transactions } = useAdmin();

  const totalRev = transactions.filter(t => t.status === 'successful' && t.type === 'booking').reduce((s,t) => s+t.amount, 0);
  const avgPerBooking = bookings.length ? Math.round(totalRev / bookings.length) : 0;
  const completionRate = bookings.length ? Math.round((bookings.filter(b=>b.status==='completed').length/bookings.length)*100) : 0;

  const stats = [
    { label: 'Total Revenue', value: `₦${(totalRev/1000).toFixed(0)}K`, icon: <LucideWallet size={20} color="#10B981" />, trend: 'Gross' },
    { label: 'Avg Booking',   value: `₦${avgPerBooking.toLocaleString()}`, icon: <LucideTrendingUp size={20} color="#3B82F6" />, trend: 'Per user' },
    { label: 'Completion',    value: `${completionRate}%`,              icon: <LucideActivity size={20} color="#8B5CF6" />, trend: 'Success rate' },
    { label: 'Platform Users', value: users.length + vendors.length,      icon: <LucideUsers size={20} color="#F59E0B" />, trend: 'Total' },
  ];

  const routeCounts = bookings.reduce<Record<string,number>>((acc, b) => {
    acc[b.route] = (acc[b.route] || 0) + 1; return acc;
  }, {});
  const topRoutes = Object.entries(routeCounts).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const maxRouteCount = Math.max(...topRoutes.map(r => r[1]));

  const vendorCounts = bookings.reduce<Record<string,number>>((acc, b) => {
    acc[b.vendorName] = (acc[b.vendorName] || 0) + 1; return acc;
  }, {});
  const topVendors = Object.entries(vendorCounts).sort((a,b) => b[1]-a[1]).slice(0, 4);

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

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
        
        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="ad-card">
            <div className="ad-card-hd"><h3><LucideBarChart3 size={18} style={{ marginRight: 8 }} />Revenue Forecast</h3></div>
            <BigBarChart data={REV_DATA} color="var(--ad-green)" />
          </div>
          <div className="ad-card">
            <div className="ad-card-hd"><h3><LucideActivity size={18} style={{ marginRight: 8 }} />Booking Volume</h3></div>
            <BigBarChart data={BOOK_DATA} color="#3B82F6" />
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="ad-card">
            <div className="ad-card-hd"><h3><LucidePieChart size={18} style={{ marginRight: 8 }} />Top Routes</h3></div>
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', marginTop: '1rem' }}>
              {topRoutes.map(([route, count]) => (
                <div key={route}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{route}</span>
                    <span style={{ color: 'var(--ad-text-muted)' }}>{count} bookings</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--ad-bg)', borderRadius: 10 }}>
                    <div style={{ height: '100%', width: `${(count/maxRouteCount)*100}%`, background: 'var(--ad-green)', borderRadius: 10 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ad-card">
            <div className="ad-card-hd"><h3>Partner Performance</h3></div>
            <div style={{ marginTop:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              {vendors.slice(0, 5).map(v => (
                <div key={v.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:32, height:32, borderRadius:'8px', background:'var(--ad-green-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:800, color:'var(--ad-green)' }}>{v.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{v.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ad-text-muted)' }}>{v.totalBookings} bookings</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--ad-green)', fontSize: '0.9rem' }}>₦{(v.totalRevenue/1000).toFixed(0)}K</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
