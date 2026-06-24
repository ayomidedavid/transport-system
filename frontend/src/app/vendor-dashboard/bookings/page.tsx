import { useState } from 'react';
import { LucideSearch, LucideMoreVertical, LucideMail, LucidePhone, LucideMapPin, LucideTrendingUp, LucideDownload } from 'lucide-react';
import { useVendor, VendorBooking } from '../../_context/VendorContext';
import { downloadCSV } from '../../../lib/csv-export';

const FILTERS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'] as const;
type Filter = typeof FILTERS[number];

export default function VendorBookingsPage() {
  const { vendorBookings, confirmBooking, cancelVendorBooking } = useVendor();
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');

  const filtered = vendorBookings.filter(b => {
    const matchFilter = filter === 'All' || b.status.toLowerCase() === filter.toLowerCase();
    const matchQuery  = !query || 
      `${b.studentName} ${b.studentEmail} ${b.route}`.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  const totalRevenue = vendorBookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + b.amount, 0);

  const stats = [
    { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: <LucideTrendingUp size={16} /> },
    { label: 'Active Bookings', value: vendorBookings.filter(b => b.status === 'confirmed').length.toString() },
    { label: 'Pending Approval', value: vendorBookings.filter(b => b.status === 'pending').length.toString() },
  ];

  const handleExport = () => {
    const exportData = filtered.map(b => ({
      Reference: b.ref,
      'Student Name': b.studentName,
      'Student Email': b.studentEmail,
      'Student Phone': b.studentPhone || 'N/A',
      'Matric Number': b.studentMatric || 'N/A',
      'Department': b.studentDept || 'N/A',
      Route: b.route,
      Date: b.date,
      Seat: b.seat || 'Any',
      Amount: b.amount,
      Status: b.status,
      'Created At': new Date(b.createdAt).toLocaleDateString()
    }));
    downloadCSV(exportData, `student_bookings_${new Date().toISOString().split('T')[0]}.csv`, true);
  };

  return (
    <div className="vd-bookings-page">
       <div className="card-header" style={{ padding: 0, marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Student Bookings</h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Track and manage all reservations from students.</p>
      </div>

      {/* Stats Row */}
      <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="head">
               <span className="title">{s.label}</span>
               <LucideMoreVertical size={16} color="#94A3B8" />
            </div>
            <div className="body">
               <span className="value">{s.value}</span>
               <button className="btn-details">Report</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card-table" style={{ marginTop: 0 }}>
        <div className="card-header" style={{ padding: 0, marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
           <div className="vd-search-bar" style={{ width: 320 }}>
             <LucideSearch size={18} color="#94A3B8" />
             <input placeholder="Search student or route..." value={query} onChange={e => setQuery(e.target.value)} />
           </div>
           
           <div className="tabs">
              {FILTERS.map(f => (
                <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
           </div>
           
           <button 
             onClick={handleExport}
             style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--vd-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
           >
             <LucideDownload size={16} /> Export CSV
           </button>
        </div>

        <table className="vd-table-new">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Student</th>
              <th>Route & Date</th>
              <th>Seat</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>No bookings found</td></tr>
            ) : (
              filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>#{b.ref.slice(-8).toUpperCase()}</td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{b.studentName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>
                       <LucideMail size={12} /> {b.studentEmail}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', fontWeight: 500 }}>
                       <LucideMapPin size={14} color="var(--vd-primary)" /> {b.route}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>{b.date}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{b.seat || 'Any'}</td>
                  <td style={{ fontWeight: 800 }}>₦{b.amount.toLocaleString()}</td>
                  <td>
                    <span className={`vd-badge-new ${b.status === 'confirmed' || b.status === 'completed' ? 'success' : 'pending'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    {b.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          className="vd-btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8, background: 'var(--vd-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
                          onClick={() => confirmBooking(b.id)}
                        >
                          Confirm
                        </button>
                        <button 
                          className="vd-btn-outline" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8, border: '1px solid #E2E8F0', background: 'none', cursor: 'pointer' }}
                          onClick={() => cancelVendorBooking(b.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
