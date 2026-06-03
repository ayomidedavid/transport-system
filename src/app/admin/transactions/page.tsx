import { useState } from 'react';
import { LucideSearch, LucideCreditCard, LucideCheckCircle, LucideClock, LucideAlertCircle, LucideDownload } from 'lucide-react';
import { useAdmin } from '../../_context/AdminContext';
import { downloadCSV } from '../../../lib/csv-export';

export default function AdminTransactionsPage() {
  const { transactions } = useAdmin();
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState<'all'|'successful'|'pending'|'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all'|'booking'|'refund'>('all');

  const filtered = transactions.filter(t => {
    const matchQ = !query || `${t.studentName} ${t.vendorName} ${t.route} ${t.ref}`.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === 'all' || t.status === filter;
    const matchT = typeFilter === 'all' || t.type === typeFilter;
    return matchQ && matchF && matchT;
  });

  const totalVol  = transactions.filter(t => t.status === 'successful' && t.type === 'booking').reduce((s,t) => s+t.amount, 0);
  const totalRef  = transactions.filter(t => t.type === 'refund').reduce((s,t) => s+t.amount, 0);
  const successfulCount = transactions.filter(t=>t.status==='successful').length;
  const pendingCount = transactions.filter(t=>t.status==='pending').length;

  const stats = [
    { label: 'Total Volume', value: `₦${(totalVol/1000).toFixed(0)}K`, icon: <LucideCreditCard size={20} color="#3B82F6" />, trend: 'Gross Revenue' },
    { label: 'Successful',   value: successfulCount,            icon: <LucideCheckCircle size={20} color="#10B981" />, trend: 'Cleared' },
    { label: 'Pending',      value: pendingCount,               icon: <LucideClock size={20} color="#F59E0B" />, trend: 'Processing' },
    { label: 'Refunds',      value: `₦${(totalRef/1000).toFixed(0)}K`, icon: <LucideAlertCircle size={20} color="#EF4444" />, trend: 'Reversed' },
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
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>Transaction History</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--ad-text-muted)' }}>Monitor and audit all financial activities across the platform.</p>
          </div>
          <div className="ad-header-search" style={{ background: 'var(--ad-bg)', border: '1px solid var(--ad-border)' }}>
            <LucideSearch size={14} color="var(--ad-text-muted)" />
            <input placeholder="Search transactions..." value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="ad-tabs" style={{ background: 'var(--ad-bg)', padding: '4px', borderRadius: '12px', width: 'max-content' }}>
              {(['all','successful','pending','failed'] as const).map(f => (
                <button key={f} className={`ad-tab${filter===f?' active':''}`} onClick={()=>setFilter(f)}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
            <div className="ad-tabs" style={{ background: 'var(--ad-bg)', padding: '4px', borderRadius: '12px', width: 'max-content' }}>
              {(['all','booking','refund'] as const).map(f => (
                <button key={f} className={`ad-tab${typeFilter===f?' active':''}`} onClick={()=>setTypeFilter(f)}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <button 
             onClick={() => {
               const exportData = filtered.map(t => ({
                 'Reference': t.ref,
                 'Student Name': t.studentName,
                 'Vendor Name': t.vendorName,
                 'Route': t.route,
                 'Type': t.type,
                 'Amount': t.amount,
                 'Status': t.status,
                 'Date': new Date(t.createdAt).toLocaleDateString()
               }));
               downloadCSV(exportData, `transactions_report_${new Date().toISOString().split('T')[0]}.csv`, true);
             }}
             className="ad-btn-primary"
             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
          >
             <LucideDownload size={16} /> Export Report
          </button>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Entity</th>
                <th>Route</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="ad-empty" style={{ textAlign: 'center', padding: '4rem', color: 'var(--ad-text-muted)' }}>No transactions found.</td></tr>
              )}
              {filtered.map(t => (
                <tr key={t.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.ref}</span></td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{t.studentName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>To: {t.vendorName}</div>
                  </td>
                  <td>{t.route}</td>
                  <td><span className={`ad-badge ${t.type}`}>{t.type}</span></td>
                  <td>
                    <span style={{ fontWeight: 700, color: t.type === 'refund' ? '#EF4444' : 'var(--ad-green)' }}>
                      {t.type==='refund'?'-':''}₦{t.amount.toLocaleString()}
                    </span>
                  </td>
                  <td><span className={`ad-badge ${t.status}`}>{t.status}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--ad-text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
