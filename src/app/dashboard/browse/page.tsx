import { useState, useEffect } from 'react';
import {
  LucideSearch, LucideCalendar, LucideSlidersHorizontal,
  LucideMapPin, LucideClock, LucideUsers, LucideX,
  LucideArrowLeft, LucideCreditCard, LucideArrowRightLeft,
  LucideWallet, LucideShieldCheck, LucideCheck, LucideBus,
} from 'lucide-react';
import { useUser } from '../../_context/UserContext';
import { useNotifications } from '../../_context/NotificationContext';
import { supabase } from '../../../lib/supabase';

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
      const { data } = await supabase
        .from('trips')
        .select('*, vendors(id, name)')
        .eq('status', 'active')
        .gt('available_seats', 0)
        .order('departure_date', { ascending: true });

      if (data) {
        setTrips(data.map((t: any) => ({
          id:          t.id,
          vendorId:    t.vendor_id,
          company:     t.vendors?.name ?? 'Unknown Company',
          rating:      4.5,
          to:          t.destination,
          vehicleType: t.vehicle_type ?? 'Bus',
          date:        fmtDate(t.departure_date),
          timeRange:   fmtTime(t.departure_time) + (t.arrival_time ? ` – ${fmtTime(t.arrival_time)}` : ''),
          duration:    calcDuration(t.departure_time, t.arrival_time),
          seats:       t.available_seats,
          price:       `₦${Number(t.price).toLocaleString()}`,
          priceNum:    Number(t.price),
          amenities:   [],
        })));
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
    if (payTab === 'card') {
      const errs = validateCard(card);
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }
    if (!trip || !user) return;
    setStatus('paying');

    try {
      const now            = new Date();
      const ref            = genRef();
      const seat           = genSeat();
      const route          = `Campus → ${trip.to}`;
      // For Paystack flow, we start as 'pending'
      const bookingStatus  = 'pending';
      const bookingDate    = `${trip.date}, ${now.getFullYear()}`;
      const bookingTime    = trip.timeRange.split(' – ')[0];

      // 1. Create the booking record first (status: pending)
      const { data: inserted, error: bError } = await supabase.from('bookings').insert([{
        student_id:   user.id,
        trip_id:      trip.vendorId ? trip.id : null,
        vendor_id:    trip.vendorId || null,
        route,
        company:      trip.company,
        destination:  trip.to,
        vehicle_type: trip.vehicleType,
        status:       bookingStatus,
        date:         bookingDate,
        time:         bookingTime,
        pickup:       'Main Gate',
        seat,
        ref,
        amount:       trip.price,
        price_num:    trip.priceNum,
      }]).select().single();

      if (bError) throw bError;

      // 2. Log the transaction as pending
      await supabase.from('transactions').insert([{
        booking_id:   inserted?.id,
        student_id:   user.id,
        vendor_id:    trip.vendorId || null,
        ref:          `TXN-${now.toISOString().slice(0,10).replace(/-/g,'')}-${ref.slice(2)}`,
        student_name: passengerName,
        vendor_name:  trip.company,
        route,
        amount:       trip.priceNum,
        type:         'booking',
        status:       'pending',
      }]);

      // 3. Initialize Paystack via Backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const payRes = await fetch(`${API_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:      user.email,
          amount:     trip.priceNum,
          bookingId:  inserted?.id,
          agencyName: trip.company,
          route:      route,
        }),
      });

      const payData = await payRes.json();

      if (payData.status && payData.data.authorization_url) {
        // Redirect to Paystack
        window.location.href = payData.data.authorization_url;
      } else {
        throw new Error('Payment initialization failed');
      }

    } catch (err: any) {
      console.error('Payment Error:', err);
      alert(err.message || 'An error occurred during payment initialization.');
      setStatus('idle');
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
                  <div className="pay-fields">
                    <div>
                      <p className="pay-field-label">Card Number <span className="req">*</span></p>
                      <input
                        className={`pay-input ${errors.number ? 'error' : ''}`}
                        placeholder="1234 5678 9012 3456"
                        value={card.number}
                        onChange={e => { setCard(c => ({...c, number: fmtCard(e.target.value)})); setErrors(er => ({...er, number: undefined})); }}
                        maxLength={19}
                        inputMode="numeric"
                      />
                      {errors.number && <p style={{ fontSize:'0.72rem', color:'var(--red)', marginTop:3 }}>{errors.number}</p>}
                    </div>
                    <div>
                      <p className="pay-field-label">Cardholder Name <span className="req">*</span></p>
                      <input
                        className={`pay-input ${errors.name ? 'error' : ''}`}
                        placeholder="JOHN DOE"
                        value={card.name}
                        onChange={e => { setCard(c => ({...c, name: e.target.value.toUpperCase()})); setErrors(er => ({...er, name: undefined})); }}
                      />
                      {errors.name && <p style={{ fontSize:'0.72rem', color:'var(--red)', marginTop:3 }}>{errors.name}</p>}
                    </div>
                    <div className="pay-row">
                      <div>
                        <p className="pay-field-label">Expiry Date <span className="req">*</span></p>
                        <input
                          className={`pay-input ${errors.expiry ? 'error' : ''}`}
                          placeholder="MM/YY"
                          value={card.expiry}
                          onChange={e => { setCard(c => ({...c, expiry: fmtExpiry(e.target.value)})); setErrors(er => ({...er, expiry: undefined})); }}
                          maxLength={5}
                        />
                        {errors.expiry && <p style={{ fontSize:'0.72rem', color:'var(--red)', marginTop:3 }}>{errors.expiry}</p>}
                      </div>
                      <div>
                        <p className="pay-field-label">CVV <span className="req">*</span></p>
                        <input
                          className={`pay-input ${errors.cvv ? 'error' : ''}`}
                          placeholder="123"
                          value={card.cvv}
                          onChange={e => { setCard(c => ({...c, cvv: e.target.value.replace(/\D/g,'').slice(0,4)})); setErrors(er => ({...er, cvv: undefined})); }}
                          maxLength={4}
                          type="password"
                          inputMode="numeric"
                        />
                        {errors.cvv && <p style={{ fontSize:'0.72rem', color:'var(--red)', marginTop:3 }}>{errors.cvv}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {payTab === 'transfer' && (
                  <>
                    <div className="bank-box">
                      <div className="bank-row"><span className="bank-key">Bank Name</span>      <span className="bank-val">First Bank Nigeria</span></div>
                      <div className="bank-row"><span className="bank-key">Account Number</span> <span className="bank-val">1234567890</span></div>
                      <div className="bank-row"><span className="bank-key">Account Name</span>   <span className="bank-val">UniRide Payments</span></div>
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
                        <p className="wallet-name">UniRide Wallet</p>
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
