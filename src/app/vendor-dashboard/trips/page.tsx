import { useState } from 'react';
import {
  LucidePlus, LucideSearch, LucideMapPin, LucideX,
  LucideCalendar, LucideClock, LucideBus, LucideFileText,
  LucideMoreVertical, LucideFilter
} from 'lucide-react';
import { useVendor, Trip } from '../../_context/VendorContext';

const VEHICLE_TYPES = ['Mini Bus (14 Seater)', 'Coaster Bus (18 Seater)', 'Bus (33 Seater)', 'Luxury Bus (45 Seater)'];
const FILTERS = ['All', 'Active', 'Completed', 'Cancelled'] as const;
type Filter = typeof FILTERS[number];

function CreateTripModal({ onClose }: { onClose: () => void }) {
  const { addTrip } = useVendor();
  const [form, setForm] = useState({
    origin: '', destination: '', departureDate: '', departureTime: '',
    arrivalTime: '', vehicleType: '', totalSeats: '', price: '', notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.origin)        e.origin        = 'Required';
    if (!form.destination)   e.destination   = 'Required';
    if (!form.departureDate) e.departureDate  = 'Required';
    if (!form.departureTime) e.departureTime  = 'Required';
    if (!form.vehicleType)   e.vehicleType   = 'Required';
    if (!form.totalSeats || isNaN(+form.totalSeats)) e.totalSeats = 'Invalid';
    if (!form.price      || isNaN(+form.price))      e.price      = 'Invalid';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      const trip: Trip = {
        id:             crypto.randomUUID(),
        origin:         form.origin.trim(),
        destination:    form.destination.trim(),
        departureDate:  form.departureDate,
        departureTime:  form.departureTime,
        arrivalTime:    form.arrivalTime,
        vehicleType:    form.vehicleType,
        totalSeats:     +form.totalSeats,
        availableSeats: +form.totalSeats,
        price:          +form.price,
        status:         'active',
        createdAt:      new Date().toISOString(),
      };
      await addTrip(trip);
      onClose();
    } catch (err: any) {
      alert('Failed to create trip: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="vd-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vd-modal" style={{ maxWidth: 800, width: '95%', borderRadius: 32, overflow: 'hidden', border: '1px solid var(--vd-border)', boxShadow: 'var(--vd-shadow-md)', background: 'var(--vd-surface)' }}>
        <div className="vd-modal-header" style={{ padding: '32px 40px', background: 'var(--vd-surface)', borderBottom: '1px solid var(--vd-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--vd-text-main)', letterSpacing: '-0.02em' }}>Schedule New Trip</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--vd-text-sub)', marginTop: 4 }}>Configure your transport route and vehicle details below.</p>
          </div>
          <button className="vd-modal-close" style={{ width: 44, height: 44, borderRadius: 14, background: 'transparent', border: '1px solid var(--vd-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vd-text-main)' }} onClick={onClose}><LucideX size={20} /></button>
        </div>
        
        <div className="vd-modal-body" style={{ padding: '40px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
               {/* Route */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                     <LucideMapPin size={16} /> Route Details
                  </div>
                  <div className="vd-field">
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vd-text-main)', marginBottom: 8, display: 'block' }}>Origin</label>
                    <input style={{ height: 52, borderRadius: 14, border: '1px solid var(--vd-border)', background: 'var(--vd-surface)', color: 'var(--vd-text-main)', padding: '0 16px', fontSize: '1rem', width: '100%', outline: 'none' }} placeholder="e.g. RUN Campus, Ede" value={form.origin} onChange={e => set('origin', e.target.value)} />
                    {errors.origin && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>{errors.origin}</span>}
                  </div>
                  <div className="vd-field" style={{ marginTop: 8 }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vd-text-main)', marginBottom: 8, display: 'block' }}>Destination</label>
                    <input style={{ height: 52, borderRadius: 14, border: '1px solid var(--vd-border)', background: 'var(--vd-surface)', color: 'var(--vd-text-main)', padding: '0 16px', fontSize: '1rem', width: '100%', outline: 'none' }} placeholder="e.g. Lagos (Old Toll Gate)" value={form.destination} onChange={e => set('destination', e.target.value)} />
                    {errors.destination && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>{errors.destination}</span>}
                  </div>
               </div>

               {/* Schedule */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                     <LucideCalendar size={16} /> Schedule
                  </div>
                  <div className="vd-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                     <div className="vd-field">
                       <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vd-text-main)', marginBottom: 8, display: 'block' }}>Departure Date</label>
                       <input type="date" style={{ height: 52, borderRadius: 14, border: '1px solid var(--vd-border)', background: 'var(--vd-surface)', color: 'var(--vd-text-main)', padding: '0 16px', fontSize: '1rem', width: '100%', outline: 'none' }} value={form.departureDate} onChange={e => set('departureDate', e.target.value)} />
                       {errors.departureDate && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 6 }}>{errors.departureDate}</span>}
                     </div>
                     <div className="vd-field">
                       <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vd-text-main)', marginBottom: 8, display: 'block' }}>Departure Time</label>
                       <input type="time" style={{ height: 52, borderRadius: 14, border: '1px solid var(--vd-border)', background: 'var(--vd-surface)', color: 'var(--vd-text-main)', padding: '0 16px', fontSize: '1rem', width: '100%', outline: 'none' }} value={form.departureTime} onChange={e => set('departureTime', e.target.value)} />
                       {errors.departureTime && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 6 }}>{errors.departureTime}</span>}
                     </div>
                  </div>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
               {/* Vehicle */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                     <LucideBus size={16} /> Vehicle & Pricing
                  </div>
                  <div className="vd-field">
                     <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vd-text-main)', marginBottom: 8, display: 'block' }}>Vehicle Type</label>
                     <select style={{ height: 52, borderRadius: 14, border: '1px solid var(--vd-border)', background: 'var(--vd-surface)', color: 'var(--vd-text-main)', padding: '0 16px', fontSize: '1rem', width: '100%', appearance: 'none' }} value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
                       <option value="">Select vehicle from fleet</option>
                       {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                     </select>
                     {errors.vehicleType && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 6 }}>{errors.vehicleType}</span>}
                  </div>
                  <div className="vd-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                     <div className="vd-field">
                       <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vd-text-main)', marginBottom: 8, display: 'block' }}>Price (₦)</label>
                       <input type="number" style={{ height: 52, borderRadius: 14, border: '1px solid var(--vd-border)', background: 'var(--vd-surface)', color: 'var(--vd-text-main)', padding: '0 16px', fontSize: '1rem', width: '100%', outline: 'none' }} placeholder="0" value={form.price} onChange={e => set('price', e.target.value)} />
                       {errors.price && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 6 }}>{errors.price}</span>}
                     </div>
                     <div className="vd-field">
                       <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vd-text-main)', marginBottom: 8, display: 'block' }}>Total Seats</label>
                       <input type="number" style={{ height: 52, borderRadius: 14, border: '1px solid var(--vd-border)', background: 'var(--vd-surface)', color: 'var(--vd-text-main)', padding: '0 16px', fontSize: '1rem', width: '100%', outline: 'none' }} placeholder="14" value={form.totalSeats} onChange={e => set('totalSeats', e.target.value)} />
                       {errors.totalSeats && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 6 }}>{errors.totalSeats}</span>}
                     </div>
                  </div>
               </div>
               
               <div className="vd-field">
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vd-text-main)', marginBottom: 8, display: 'block' }}>Additional Notes</label>
                  <textarea style={{ height: 120, borderRadius: 14, border: '1px solid var(--vd-border)', background: 'var(--vd-surface)', color: 'var(--vd-text-main)', padding: '14px 16px', fontSize: '1rem', width: '100%', outline: 'none', resize: 'none' }} placeholder="e.g. Gate pickup, AC available, etc." value={form.notes} onChange={e => set('notes', e.target.value)} />
               </div>
            </div>
          </div>
        </div>

        <div className="vd-modal-footer" style={{ padding: '32px 40px', background: 'var(--vd-surface)', borderTop: '1px solid var(--vd-border)', display: 'flex', gap: 16 }}>
          <button className="vd-btn-outline" style={{ flex: 1, height: 56, borderRadius: 16, border: '1px solid var(--vd-border)', background: 'transparent', color: 'var(--vd-text-main)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }} onClick={onClose}>Cancel</button>
          <button className="vd-btn-primary" style={{ flex: 2, height: 56, borderRadius: 16, border: 'none', background: 'var(--vd-primary)', color: '#fff', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)', transition: 'all 0.2s' }} onClick={submit}>Create Trip Now</button>
        </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  const { trips, cancelTrip } = useVendor();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');

  const filtered = trips.filter(t => {
    const matchFilter = filter === 'All' || t.status.toLowerCase() === filter.toLowerCase();
    const matchQuery  = !query || `${t.origin} ${t.destination}`.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <div className="vd-trips-page">
      <div className="card-header" style={{ padding: 0, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Manage Trips</h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Organize and schedule your student transport services.</p>
        </div>
        <button className="vd-btn-primary" style={{ padding: '12px 24px', borderRadius: 12, background: '#10B981', color: '#fff', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowModal(true)}>
          <LucidePlus size={18} /> Create New Trip
        </button>
      </div>

      {/* Toolbar */}
      <div className="card-table" style={{ marginTop: 0 }}>
        <div className="card-header" style={{ padding: 0, marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
           <div className="vd-search-bar" style={{ width: 320 }}>
             <LucideSearch size={18} color="#94A3B8" />
             <input placeholder="Search by route..." value={query} onChange={e => setQuery(e.target.value)} />
           </div>
           
           <div className="tabs">
              {FILTERS.map(f => (
                <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
           </div>
        </div>

        <table className="vd-table-new">
          <thead>
            <tr>
              <th>Route</th>
              <th>Date & Time</th>
              <th>Vehicle</th>
              <th>Availability</th>
              <th>Price</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <LucideMapPin size={40} opacity={0.2} />
                  <p>No trips found matching your criteria</p>
                </div>
              </td></tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.origin} → {t.destination}</div>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Direct Route</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', fontWeight: 500 }}>
                       <LucideCalendar size={14} color="#10B981" /> {t.departureDate}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>
                       <LucideClock size={12} /> {t.departureTime}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#475569' }}>{t.vehicleType}</td>
                  <td>
                    <div style={{ width: '100%', maxWidth: 120 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                          <span>{t.availableSeats} seats left</span>
                          <span style={{ fontWeight: 700 }}>{Math.round((t.availableSeats / t.totalSeats) * 100)}%</span>
                       </div>
                       <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#10B981', width: `${(t.availableSeats / t.totalSeats) * 100}%` }} />
                       </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800 }}>₦{t.price.toLocaleString()}</td>
                  <td>
                    <span className={`vd-badge-new ${t.status === 'active' ? 'success' : 'pending'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {t.status === 'active' && (
                      <button 
                        className="vd-btn-outline" 
                        style={{ padding: '8px 16px', fontSize: '0.75rem', borderRadius: 10, color: '#EF4444', borderColor: '#FEE2E2', fontWeight: 600, background: '#FEF2F2', transition: 'all 0.2s' }}
                        onClick={async (e) => {
                          const btn = e.currentTarget;
                          if (confirm('Are you sure you want to cancel this trip?')) {
                            btn.disabled = true;
                            btn.innerText = 'Cancelling...';
                            await cancelTrip(t.id);
                            // The state update will handle the rest
                          }
                        }}
                      >
                        Cancel Trip
                      </button>
                    )}
                    {t.status !== 'active' && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', paddingRight: 12 }}>
                        {t.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && <CreateTripModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
