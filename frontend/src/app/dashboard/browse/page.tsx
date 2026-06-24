import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LucideSearch, LucideCalendar, LucideSlidersHorizontal,
  LucideMapPin, LucideClock, LucideUsers, LucideX,
  LucideArrowLeft, LucideCreditCard, LucideArrowRightLeft,
  LucideWallet, LucideShieldCheck, LucideCheck, LucideBus,
} from 'lucide-react';
import { useUser } from '../../_context/UserContext';
import { useNotifications } from '../../_context/NotificationContext';
import { api } from '../../../lib/api';
import { generateTicketPdf } from '../../../lib/ticket-generator';

// Declare PaystackPop on the window object
declare global {
  interface Window {
    PaystackPop: any;
  }
}

type Amenity = 'AC' | 'WiFi' | 'USB Charging' | 'Movies' | 'Refreshments';
const AMENITY_CLASS: Record<Amenity, string> = {
  'AC': 'ac', 'WiFi': 'wifi', 'USB Charging': 'usb', 'Movies': 'movie', 'Refreshments': 'food',
};

type Trip = {
  id:          string;
  vendorId:    string;
  company:     string;
  rating:      number;
  to:          string;
  vehicleType: string;
  date:        string;
  timeRange:   string;
  duration:    string;
  seats:       number;
  price:       string;
  priceNum:    number;
  amenities:   Amenity[];
};

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function calcDuration(dep: string, arr: string | null): string {
  if (!arr) return '—';
  const [dh, dm] = dep.split(':').map(Number);
  const [ah, am] = arr.split(':').map(Number);
  let mins = (ah * 60 + am) - (dh * 60 + dm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h 0m`;
}

type PayTab = 'card' | 'transfer' | 'wallet';
type CardFields = { number: string; name: string; expiry: string; cvv: string };
type CardErrors = Partial<CardFields>;

function validateCard(f: CardFields): CardErrors {
  const e: CardErrors = {};
  if (!f.number.replace(/\s/g,'').match(/^\d{16}$/))    e.number = 'Enter a valid 16-digit card number';
  if (!f.name.trim())                                    e.name   = 'Cardholder name is required';
  if (!f.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/))     e.expiry = 'Format: MM/YY';
  if (!f.cvv.match(/^\d{3,4}$/))                        e.cvv    = 'Enter 3 or 4 digits';
  return e;
}

function genRef() {
  return 'UT' + Math.floor(10000000 + Math.random() * 90000000);
}

function genSeat() {
  const row = String.fromCharCode(65 + Math.floor(Math.random() * 6));
  const num = String(Math.floor(1 + Math.random() * 15)).padStart(2, '0');
  return row + num;
}

export default function BrowsePage() {
  const { user, addBooking } = useUser();
  const { addNotif } = useNotifications();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const [trips,        setTrips]        = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [search,       setSearch]       = useState('');
  const [trip,         setTrip]         = useState<Trip | null>(null);
  const [payTab,       setPayTab]       = useState<PayTab>('card');
  const [card,         setCard]         = useState<CardFields>({ number:'', name:'', expiry:'', cvv:'' });
  const [errors,       setErrors]       = useState<CardErrors>({});
  const [status,       setStatus]       = useState<'idle' | 'paying' | 'done'>('idle');

  const passengerName  = user ? `${user.firstName} ${user.lastName}`.trim() : 'Guest';
  const passengerEmail = user?.email ?? '';
  const passengerPhone = user?.phone ?? '';

  useEffect(() => {
    async function loadTrips() {
      try {
        const { data } = await api.get('/trips');
        if (data) {
          setTrips(data.map((t: any) => ({
            id:          t.id,
            vendorId:    t.vendorId,
            company:     t.vendor?.name ?? 'Unknown Company',
            rating:      4.5,
            to:          t.destination,
            vehicleType: t.vehicleType ?? 'Bus',
            date:        fmtDate(t.departureDate),
            timeRange:   fmtTime(t.departureTime) + (t.arrivalTime ? ` – ${fmtTime(t.arrivalTime)}` : ''),
            duration:    calcDuration(t.departureTime, t.arrivalTime),
            seats:       t.availableSeats,
            price:       `₦${Number(t.price).toLocaleString()}`,
            priceNum:    Number(t.price),
            amenities:   [],
          })));
        }
      } catch (err) {
        console.error(err);
      }
      setLoadingTrips(false);
    }
    loadTrips();
  }, []);

  const filtered = trips.filter(t =>
    t.to.toLowerCase().includes(search.toLowerCase()) ||
    t.company.toLowerCase().includes(search.toLowerCase())
  );

  function openModal(t: Trip) { setTrip(t); setPayTab('card'); setCard({ number:'', name:'', expiry:'', cvv:'' }); setErrors({}); setStatus('idle'); }
  function closeModal() { if (status === 'paying') return; setTrip(null); }

  async function handlePay() {
    if (!trip || !user) return;
    setStatus('paying');

    const now            = new Date();
    const ref            = genRef();
    const seat           = genSeat();
    const route          = `Campus → ${trip.to}`;
    const bookingDate    = `${trip.date}, ${now.getFullYear()}`;
    const bookingTime    = trip.timeRange.split(' – ')[0];

    const processBooking = async () => {
      try {
        // 1. Create the booking record
        const { data: booking } = await api.post('/bookings', {
          studentId:   user.id,
          tripId:      trip.id,
          vendorId:    trip.vendorId || null,
          route,
          company:      trip.company,
          destination:  trip.to,
          vehicleType: trip.vehicleType,
          date:         bookingDate,
          time:         bookingTime,
          pickup:       'Main Gate',
          seat,
          ref,
          amount:       trip.price,
          priceNum:    trip.priceNum,
        });

        // 2. Log the transaction as successful
        await api.post('/transactions', {
          bookingId:   booking.id,
          studentId:   user.id,
          vendorId:    trip.vendorId || null,
          ref:          `TXN-${now.toISOString().slice(0,10).replace(/-/g,'')}-${ref.slice(2)}`,
          studentName: passengerName,
          vendorName:  trip.company,
          route,
          amount:       trip.priceNum,
          type:         'booking',
          status:       'successful',
        });

        // 3. Add to local state and notify
        addBooking(booking);
        
        await addNotif({
          type: 'booking',
          title: 'Booking Confirmed',
          body: `Your trip to ${trip.to} has been confirmed. Seat: ${seat}`,
          bookingRef: ref,
        });

        // 4. Generate the PDF Ticket
        await generateTicketPdf({
          ref,
          date: bookingDate,
          time: bookingTime,
          passengerName,
          route,
          company: trip.company,
          vehicleType: trip.vehicleType,
          amount: trip.price,
          seat
        });

        setStatus('done');
        setToast('Booking successful! Your receipt has been downloaded.');
        
        setTimeout(() => {
           closeModal();
           navigate('/dashboard/tickets');
        }, 2500);

      } catch (err: any) {
        console.error('Payment Error:', err);
        alert(err.response?.data?.error || err.message || 'An error occurred during booking processing.');
        setStatus('idle');
      }
    };

    if (payTab === 'card') {
      // Trigger Paystack Popup
      if (!window.PaystackPop) {
        alert("Paystack script hasn't loaded yet. Please refresh the page.");
        setStatus('idle');
        return;
      }

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_e4c84a5...replace_me', // Replace with your test key if env var is missing
        email: passengerEmail || 'student@redboox.com',
        amount: trip.priceNum * 100, // Paystack expects amount in kobo
        currency: 'NGN',
        ref: ref,
        callback: function(response: any) {
          // Payment successful!
          processBooking();
        },
        onClose: function() {
          setStatus('idle');
          alert('Payment was cancelled.');
        }
      });
      handler.openIframe();
    } else {
      // Transfer or Wallet
      processBooking();
    }
  }
  function fmtCard(val: string) {
    return val.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  }
  function fmtExpiry(val: string) {
    const d = val.replace(/\D/g,'').slice(0,4);
    return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
  }

  return (
    <>
      {/* Filters */}
      <div className="dash-filters">
        <div className="dash-search-wrap">
          <LucideSearch size={15} />
          <input
            type="text"
            placeholder="Search destination..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="dash-date-wrap">
          <LucideCalendar size={15} />
          <input type="date" />
        </div>
        <button className="btn-filter">
          <LucideSlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {loadingTrips ? (
        <p className="dash-results-label">Loading trips…</p>
      ) : (
        <p className="dash-results-label"><strong>{filtered.length}</strong> trips available</p>
      )}

      {!loadingTrips && trips.length === 0 && (
        <div className="dash-empty-state">
          <LucideBus size={40} />
          <p>No trips available yet. Logistics companies are setting up their routes — check back soon!</p>
        </div>
      )}

      {!loadingTrips && trips.length > 0 && filtered.length === 0 && (
        <div className="dash-empty-state">
          <LucideSearch size={40} />
          <p>No trips found for &ldquo;{search}&rdquo;. Try a different destination.</p>
        </div>
      )}

      {!loadingTrips && filtered.length > 0 && (
        <div className="dash-trips-list">
          {filtered.map(t => (
            <div key={t.id} className="dash-trip-card">
              <div className="dash-trip-main">
                <div className="dash-co-wrap">
                  <div className="dash-co-logo">{t.company.charAt(0)}</div>
                  <div>
                    <p className="dash-co-name">{t.company}</p>
                    <p className="dash-co-rating">{t.rating} / 5</p>
                  </div>
                </div>
                <div className="dash-meta-block">
                  <p className="dash-meta-label"><LucideMapPin size={10} /> Route</p>
                  <p className="dash-meta-val">Campus → {t.to}</p>
                  <p className="dash-meta-sub">{t.vehicleType}</p>
                </div>
                <div className="dash-meta-block">
                  <p className="dash-meta-label"><LucideCalendar size={10} /> Date &amp; Time</p>
                  <p className="dash-meta-val">{t.date}</p>
                  <p className="dash-meta-sub">{t.timeRange}</p>
                </div>
                <div className="dash-meta-block">
                  <p className="dash-meta-label"><LucideClock size={10} /> Duration</p>
                  <p className="dash-meta-val">{t.duration}</p>
                  <p className="dash-meta-sub" style={{ display:'flex', alignItems:'center', gap:3 }}>
                    <LucideUsers size={10} /> {t.seats} seats left
                  </p>
                </div>
                <div className="dash-price-block">
                  <p className="dash-price-label">Price</p>
                  <p className="dash-price-val">{t.price}</p>
                  <button className="btn-book" onClick={() => openModal(t)}>Book Now</button>
                </div>
              </div>
              {t.amenities.length > 0 && (
                <div className="dash-amenities">
                  {t.amenities.map(a => <span key={a} className={`dash-tag ${AMENITY_CLASS[a]}`}>{a}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {trip && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Payment">

            <div className="modal-header">
              <div className="modal-header-left">
                <button className="modal-back" onClick={closeModal} aria-label="Go back"><LucideArrowLeft size={14} /></button>
                <div>
                  <p className="modal-title">Payment</p>
                  <p className="modal-subtitle">Choose your payment method</p>
                </div>
              </div>
              <button className="modal-close" onClick={closeModal} aria-label="Close"><LucideX size={14} /></button>
            </div>

            <div className="modal-body">
              {/* Left */}
              <div className="modal-left">
                <p className="pay-tabs-label">Select Payment Method</p>
                <div className="pay-tabs">
                  {(['card','transfer','wallet'] as PayTab[]).map(tab => (
                    <button key={tab} className={`pay-tab ${payTab===tab ? 'active' : ''}`} onClick={() => setPayTab(tab)}>
                      {tab==='card'     && <LucideCreditCard size={17} />}
                      {tab==='transfer' && <LucideArrowRightLeft size={17} />}
                      {tab==='wallet'   && <LucideWallet size={17} />}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {payTab === 'card' && (
                  <div className="bank-box" style={{ marginTop: '1rem', padding: '1.5rem', textAlign: 'center', background: '#f9fafb', borderRadius: '12px' }}>
                    <p style={{ fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Secure Card Payment</p>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>You will be redirected to Paystack to complete this transaction securely.</p>
                    <img src="https://paystack.com/assets/payment/img/paystack-badge-cards.png" alt="Paystack" style={{ height: '30px', margin: '0 auto' }} />
                  </div>
                )}

                {payTab === 'transfer' && (
                  <>
                    <div className="bank-box">
                      <div className="bank-row"><span className="bank-key">Bank Name</span>      <span className="bank-val">First Bank Nigeria</span></div>
                      <div className="bank-row"><span className="bank-key">Account Number</span> <span className="bank-val">1234567890</span></div>
                      <div className="bank-row"><span className="bank-key">Account Name</span>   <span className="bank-val">UniTransit Payments</span></div>
                      <div className="bank-row"><span className="bank-key">Amount</span>         <span className="bank-val">{trip.price}</span></div>
                    </div>
                    <div className="bank-note">
                      <strong>Note:</strong> Your booking will be confirmed once payment is verified (usually within 10 minutes).
                    </div>
                  </>
                )}

                {payTab === 'wallet' && (
                  <div className="wallet-box">
                    <div className="wallet-top">
                      <div>
                        <p className="wallet-name">UniTransit Wallet</p>
                        <p className="wallet-sub">Available Balance</p>
                      </div>
                      <p className="wallet-balance">₦25,000</p>
                    </div>
                    <div className="wallet-ok">
                      <LucideShieldCheck size={14} /> Sufficient balance available
                    </div>
                  </div>
                )}

                <div className="secure-note">
                  <LucideShieldCheck size={14} />
                  <span>Your payment information is encrypted and secure. We never store your card details.</span>
                </div>
              </div>

              {/* Right — order summary */}
              <div className="modal-right">
                <p className="order-title">Order Summary</p>
                <p className="order-route">Campus → {trip.to}</p>
                <p className="order-company">{trip.company}</p>
                <div className="order-divider" />
                <p className="order-label">Passenger</p>
                <p className="order-value">{passengerName}</p>
                <p className="order-label">Contact</p>
                <p className="order-value" style={{ fontSize:'0.78rem', lineHeight:1.6 }}>
                  {passengerEmail}<br />{passengerPhone}
                </p>
                <div className="order-divider" />
                <div className="order-row"><span>Trip Fare</span>    <span>{trip.price}</span></div>
                <div className="order-row"><span>Service Fee</span>  <span>₦0</span></div>
                <div className="order-total">
                  <span className="order-total-label">Total</span>
                  <span className="order-total-val">{trip.price}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-back" onClick={closeModal} disabled={status==='paying'}>Back</button>
              <button
                className={`btn-pay ${status==='done' ? 'success' : ''}`}
                onClick={handlePay}
                disabled={status !== 'idle'}
              >
                {status === 'idle'   && `Pay ${trip.price}`}
                {status === 'paying' && 'Processing…'}
                {status === 'done'   && 'Payment Confirmed!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking confirmed toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[9999] flex items-start gap-3 bg-[#0A3D2B] border border-[#10B981]/40 rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-[340px]"
          style={{ animation: 'toast-in 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center">
            <LucideCheck size={13} color="#000" />
          </span>
          <div>
            <p className="text-sm font-bold text-white mb-0.5">Booking Confirmed</p>
            <p className="text-xs text-white/60 leading-relaxed">{toast}</p>
          </div>
        </div>
      )}
    </>
  );
}
