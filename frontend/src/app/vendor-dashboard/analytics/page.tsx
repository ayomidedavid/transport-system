import { LucideTrendingUp, LucideBarChart, LucidePieChart, LucideCalendar, LucideMoreVertical, LucideDownload } from 'lucide-react';
import { useVendor } from '../../_context/VendorContext';
import { downloadCSV } from '../../../lib/csv-export';

export default function VendorAnalyticsPage() {
  const { vendorBookings, trips } = useVendor();

  const totalRevenue = vendorBookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + b.amount, 0);

  const stats = [
    { label: 'Avg. Revenue / Trip', value: trips.length > 0 ? `₦${(totalRevenue / trips.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '₦0' },
    { label: 'Booking Rate', value: '78%', trend: '+4.2%' },
    { label: 'Repeat Students', value: '24%', trend: '+1.5%' },
  ];

  return (
    <div className="vd-analytics-page">
      <div className="card-header" style={{ padding: 0, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Analytics & Insights</h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Deep dive into your performance and growth metrics.</p>
        </div>
        <div className="tabs" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
           <button className="tab active">Last 30 Days</button>
           <button className="tab">Last 90 Days</button>
           
           <button 
             onClick={() => {
               const reportData = vendorBookings.map(b => ({
                 Reference: b.ref,
                 Date: b.date,
                 Route: b.route,
                 'Student Name': b.studentName,
                 Amount: b.amount,
                 Status: b.status
               }));
               downloadCSV(reportData, `monthly_revenue_report_${new Date().toISOString().split('T')[0]}.csv`, true);
             }}
             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
           >
             <LucideDownload size={16} /> Download Report
           </button>
        </div>
      </div>

      <div className="dash-grid" style={{ marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="head">
               <span className="title">{s.label}</span>
               <LucideMoreVertical size={16} color="#94A3B8" />
            </div>
            <div className="body">
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <span className="value">{s.value}</span>
                 {s.trend && <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#10B981' }}>{s.trend} <LucideTrendingUp size={12} /></span>}
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="main-report-grid">
         <div className="card-main">
            <div className="card-header">
               <h2>Revenue Over Time</h2>
               <LucideBarChart size={20} color="#10B981" />
            </div>
            <div className="fake-graph" style={{ height: 300, background: 'url("data:image/svg+xml;utf8,<svg viewBox=\'0 0 800 200\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M0,150 Q100,80 200,120 T400,60 T600,100 T800,40\' fill=\'none\' stroke=\'%2310B981\' stroke-width=\'3\' /><path d=\'M0,150 Q100,80 200,120 T400,60 T600,100 T800,40 V200 H0 Z\' fill=\'rgba(16, 185, 129, 0.05)\' /></svg>")', backgroundSize: 'cover' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: '0.75rem', color: '#94A3B8' }}>
               {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map(w => <span key={w}>{w}</span>)}
            </div>
         </div>

         <div className="side-stats">
            <div className="side-card">
               <h3>Trip Distribution</h3>
               <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ width: 140, height: 140, borderRadius: '50%', border: '20px solid #F1F5F9', borderTopColor: '#10B981', borderRightColor: '#6366F1', transform: 'rotate(45deg)' }} />
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                     <strong style={{ display: 'block', fontSize: '1.25rem' }}>{trips.length}</strong>
                     <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Active Trips</span>
                  </div>
               </div>
               <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                     <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#10B981' }} /> Morning</span>
                     <strong>65%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                     <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#6366F1' }} /> Evening</span>
                     <strong>35%</strong>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
