import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LucideBus, LucideCalendar, LucideClock, LucideMapPin,
  LucideUser, LucideDownload, LucideX, LucideTicket,
} from 'lucide-react';
import { useUser, useBookings, type Booking } from '../../_context/UserContext';
import { LucideCreditCard } from 'lucide-react';

type Status = 'confirmed' | 'pending' | 'cancelled' | 'completed';

const STATUS_LABELS: Record<Status, string> = {
  confirmed: 'Confirmed',
  pending:   'Pending',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

function BookingCard({ b, isUpcoming, onCancel }: { b: Booking; isUpcoming: boolean; onCancel: (id: string) => Promise<void> }) {
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const { user } = useUser();

  async function handlePay() {
    if (!user) return;
    setPaying(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const initRes = await fetch(`${API_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          amount: b.priceNum,
          reference: b.ref,
          bookingId: b.id
        })
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.message || 'Payment initialization failed');
      window.location.href = initData.authorization_url;
    } catch (err: any) {
      alert('Failed to initialize payment: ' + err.message);
      setPaying(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    setCancelError('');
    try {
      await onCancel(b.id);
    } catch {
      setCancelError('Failed to cancel. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="dash-card dash-bk-card">
      <div className="dash-bk-top">
        <div className="dash-bk-co">
          <div className="dash-bk-co-icon"><LucideBus size={18} /></div>
          <div>
            <p className="dash-bk-route">{b.route}</p>
            <p className="dash-bk-co-name">{b.company}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
          <span className={`badge badge-${b.status}`}>{STATUS_LABELS[b.status]}</span>
          {isUpcoming && (
            <div className="dash-bk-actions">
              {(b.status === 'confirmed' || b.status === 'pending') && (
                <>
                  {b.status === 'confirmed' && (
                    <button className="btn-download"><LucideDownload size={13} /> Download Ticket</button>
                  )}
                  {b.status === 'pending' && (
                    <button className="btn-primary" onClick={handlePay} disabled={paying} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      <LucideCreditCard size={13} /> {paying ? 'Connecting...' : 'Pay Now'}
                    </button>
                  )}
                  <button className="btn-cancel" onClick={handleCancel} disabled={cancelling}>
                    <LucideX size={13} /> {cancelling ? 'Cancelling…' : 'Cancel'}
                  </button>
                  {cancelError && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{cancelError}</span>}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="dash-bk-details">
        <div>
          <p className="bk-det-label"><LucideCalendar size={10} /> Date</p>
          <p className="bk-det-val">{b.date}</p>
        </div>
        <div>
          <p className="bk-det-label"><LucideClock size={10} /> Time</p>
          <p className="bk-det-val">{b.time}</p>
        </div>
        <div>
          <p className="bk-det-label"><LucideMapPin size={10} /> Pickup</p>
          <p className="bk-det-val">{b.pickup}</p>
        </div>
        <div>
          <p className="bk-det-label"><LucideUser size={10} /> Seat</p>
          <p className="bk-det-val">{b.seat}</p>
        </div>
      </div>

      <div className="dash-bk-footer">
        <div>
          <p className="bk-ref-label">Booking Reference</p>
          <p className="bk-ref-val">{b.ref}</p>
        </div>
        <div>
          <p className="bk-amt-label">Amount Paid</p>
          <p className="bk-amt-val">{b.amount}</p>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const bookings = useBookings();
  const { cancelBooking } = useUser();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const past     = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  const list     = tab === 'upcoming' ? upcoming : past;

  return (
    <>
      <div className="dash-tabs-bar">
        <button className={`dash-tab ${tab==='upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
          Upcoming ({upcoming.length})
        </button>
        <button className={`dash-tab ${tab==='past' ? 'active' : ''}`} onClick={() => setTab('past')}>
          Past Trips ({past.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="dash-empty-state">
          <LucideTicket size={40} />
          <p>No {tab === 'upcoming' ? 'upcoming' : 'past'} trips yet.</p>
          {tab === 'upcoming' && (
            <Link to="/dashboard/browse" className="btn-primary" style={{ marginTop:'1rem', display:'inline-flex' }}>
              Browse Trips
            </Link>
          )}
        </div>
      ) : (
        <div className="dash-bookings-list">
          {list.map(b => (
            <BookingCard key={b.id} b={b} isUpcoming={tab==='upcoming'} onCancel={cancelBooking} />
          ))}
        </div>
      )}
    </>
  );
}
