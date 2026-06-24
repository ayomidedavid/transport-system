import { useNavigate } from 'react-router-dom';
import { LucideTrendingUp, LucideTrendingDown, LucideMoreVertical } from 'lucide-react';
import { useVendor } from '../_context/VendorContext';

export default function VendorOverview() {
  const { company, trips, vendorBookings } = useVendor();
  const navigate = useNavigate();

  const totalRevenue   = vendorBookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + b.amount, 0);

  const stats = [
    { label: 'Total Revenue', value: `₦${(totalRevenue / 1000).toFixed(1)}K`, trend: '+12.4%', up: true, sub: 'This Week', prev: 'Previous Week (₦235)' },
    { label: 'Total Bookings', value: vendorBookings.length.toString(), trend: '+8.4%', up: true, sub: 'All Time', prev: 'Previous Week (76)' },
    { label: 'Booking Status', value: vendorBookings.filter(b => b.status === 'pending').length.toString(), subText: 'Pending', secondVal: vendorBookings.filter(b => b.status === 'cancelled').length.toString(), secondSub: 'Cancelled' },
  ];

  return (
    <div className="vd-overview">
      {/* Stat Cards */}
      <div className="dash-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="head">
               <span className="title">{s.label}</span>
               <LucideMoreVertical size={16} color="#94A3B8" />
            </div>
            <div className="body">
               <div>
                 <div style={{ display: 'flex', alignItems: 'center' }}>
                   <span className="value">{s.value}</span>
                   {s.trend && (
                     <span className={`trend ${s.up ? 'up' : 'down'}`}>
                       {s.up ? <LucideTrendingUp size={12} /> : <LucideTrendingDown size={12} />} {s.trend}
                     </span>
                   )}
                 </div>
                 {s.prev && <p className="prev">{s.prev}</p>}
                 {s.subText && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
                       <div>
                         <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{s.value}</span>
                         <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{s.subText}</p>
                       </div>
                       <div>
                         <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EF4444' }}>{s.secondVal}</span>
                         <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{s.secondSub}</p>
                       </div>
                    </div>
                 )}
               </div>
               <button className="btn-details" onClick={() => navigate('/vendor/bookings')}>Details</button>
            </div>
          </div>
        ))}
      </div>

      <div className="main-report-grid">
        {/* Weekly Performance */}
        <div className="card-main">
          <div className="card-header">
            <h2>Weekly Performance</h2>
            <div className="tabs">
              <button className="tab active">This week</button>
              <button className="tab">Last week</button>
            </div>
          </div>
          
          <div className="report-stats">
            <div className="rep-item">
              <span>Students</span>
              <strong>{vendorBookings.length}</strong>
              <div style={{ height: 2, background: 'var(--vd-primary)', marginTop: 8 }} />
            </div>
            <div className="rep-item">
              <span>Total Trips</span>
              <strong>{trips.length}</strong>
            </div>
            <div className="rep-item">
              <span>Available Seats</span>
              <strong>{trips.reduce((s, t) => s + t.availableSeats, 0)}</strong>
            </div>
            <div className="rep-item">
              <span>Sold Out</span>
              <strong>{trips.filter(t => t.availableSeats === 0).length}</strong>
            </div>
            <div className="rep-item">
              <span>Revenue</span>
              <strong>₦{(totalRevenue / 1000).toFixed(1)}k</strong>
            </div>
          </div>

          <div className="fake-graph">
             <div className="graph-label" style={{ left: '48%', bottom: '55%' }}>Peak Demand</div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: '0.75rem', color: '#94A3B8' }}>
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>
        </div>

        {/* Side Stats */}
        <div className="side-stats">
           <div className="side-card">
              <div className="card-header" style={{ padding: 0, marginBottom: 12 }}>
                <h3>Active Students Online</h3>
                <LucideMoreVertical size={16} color="#94A3B8" />
              </div>
              <span className="val">Live</span>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>Booking activity per hour</p>
              
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40, marginTop: 20 }}>
                 {[40, 60, 45, 70, 30, 50, 80, 55, 65, 40, 75, 45, 60, 50, 70, 35, 40, 60, 55, 45].map((h, i) => (
                    <div key={i} style={{ flex: 1, background: 'var(--vd-primary)', height: `${h}%`, borderRadius: 1 }} />
                 ))}
              </div>

              <div className="country-list">
                 <div className="country-item">
                    <div className="vd-sidebar-logo-icon" style={{ width: 24, height: 24, borderRadius: 4 }} />
                    <div className="country-info">
                       <strong>Campus → Lagos</strong>
                       <span className="name">Popular Route</span>
                    </div>
                    <span style={{ color: 'var(--vd-primary)', fontSize: '0.75rem' }}>+25.8%</span>
                 </div>
                 <div className="country-item">
                    <div className="vd-sidebar-logo-icon" style={{ width: 24, height: 24, borderRadius: 4, background: '#EF4444' }} />
                    <div className="country-info">
                       <strong>Campus → Ibadan</strong>
                       <span className="name">Direct Route</span>
                    </div>
                    <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>-15.8%</span>
                 </div>
              </div>
              
              <button style={{ width: '100%', marginTop: 24, padding: '10px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/vendor/analytics')}>View Analytics</button>
           </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card-table">
        <div className="card-header" style={{ padding: 0, marginBottom: 24 }}>
           <h2>Recent Bookings</h2>
           <button className="tab" style={{ background: 'var(--vd-primary)', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/vendor/bookings')}>
              View All
           </button>
        </div>
        
        <table className="vd-table-new">
          <thead>
            <tr>
              <th>Order No</th>
              <th>Student Name</th>
              <th>Travel Date</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {vendorBookings.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>No recent bookings found</td></tr>
            ) : (
              vendorBookings.slice(0, 5).map((b, i) => (
                <tr key={b.id}>
                  <td>#{b.ref.slice(-6)}</td>
                  <td style={{ fontWeight: 600 }}>{b.studentName}</td>
                  <td>{b.date}</td>
                  <td>
                    <span className={`vd-badge-new ${b.status === 'confirmed' || b.status === 'completed' ? 'success' : 'pending'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>₦{b.amount.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
