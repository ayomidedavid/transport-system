import { Link } from 'react-router-dom';
import {
  LucideTicket, LucideCalendar, LucideDollarSign, LucideTrendingUp,
  LucideBus, LucideMapPin, LucideClock, LucideArrowRight, LucideUser,
} from 'lucide-react';
import { useUser, useBookings } from '../_context/UserContext';

export default function OverviewPage() {
  const { user } = useUser();
  const bookings  = useBookings();

  const upcoming   = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const completed  = bookings.filter(b => b.status === 'completed');
  const totalSpent = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.priceNum, 0);
  const nextTrip   = upcoming[0] ?? null;
  const recent     = [...bookings].slice(0, 3);

  return (
    <>
      {/* Welcome */}
      <div className="dash-welcome">
        <div>
          <h2>Welcome back, {user?.firstName ?? 'there'}!</h2>
          <p>Ready to plan your next journey home?</p>
        </div>
        <Link to="/dashboard/browse" className="btn-primary" style={{ flexShrink: 0 }}>
          Browse Trips <LucideArrowRight size={15} />
        </Link>
      </div>

      {/* Stats */}
      <div className="dash-stats-grid">
        {[
          { label: 'Active Bookings',  value: String(upcoming.length),    meta: `${upcoming.length} active`,       icon: <LucideTicket size={19} /> },
          { label: 'Upcoming Trips',   value: String(upcoming.length),    meta: upcoming.length > 0 ? 'Next trip soon' : 'No upcoming trips', icon: <LucideCalendar size={19} /> },
          { label: 'Total Spent',      value: `₦${totalSpent.toLocaleString()}`, meta: 'All time',                icon: <LucideDollarSign size={19} /> },
          { label: 'Trips Completed',  value: String(completed.length),   meta: `${completed.length} completed`,  icon: <LucideTrendingUp size={19} /> },
        ].map(s => (
          <div key={s.label} className="dash-stat-card">
            <div>
              <p className="dash-stat-label">{s.label}</p>
              <p className="dash-stat-value">{s.value}</p>
              <p className="dash-stat-meta">{s.meta}</p>
            </div>
            <div className="dash-stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Next trip + Recent activity */}
      <div className="dash-two-col">
        <div className="dash-card dash-card-pad">
          <div className="dash-card-title">
            Next Trip
            <Link to="/dashboard/bookings" className="dash-card-link">View All</Link>
          </div>
          {nextTrip ? (
            <div className="dash-next-trip-box">
              <div className="dash-ntrip-top">
                <div className="dash-ntrip-icon"><LucideBus size={18} /></div>
                <div style={{ flex: 1 }}>
                  <p className="dash-ntrip-dest">{nextTrip.to}</p>
                  <p className="dash-ntrip-co">{nextTrip.company}</p>
                </div>
                <span className={`badge badge-${nextTrip.status}`}>
                  {nextTrip.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                </span>
              </div>
              <div className="dash-ntrip-details">
                <div>
                  <p className="dash-ntrip-det-label"><LucideCalendar size={10} /> Date</p>
                  <p className="dash-ntrip-det-val">{nextTrip.date}</p>
                </div>
                <div>
                  <p className="dash-ntrip-det-label"><LucideClock size={10} /> Time</p>
                  <p className="dash-ntrip-det-val">{nextTrip.time}</p>
                </div>
                <div>
                  <p className="dash-ntrip-det-label"><LucideMapPin size={10} /> Seat</p>
                  <p className="dash-ntrip-det-val">{nextTrip.seat}</p>
                </div>
              </div>
              <Link to="/dashboard/bookings" className="btn-primary" style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'inline-flex' }}>
                View Booking Details <LucideArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="dash-empty-state" style={{ padding: '2rem 0' }}>
              <LucideBus size={32} />
              <p>No upcoming trips. Browse available routes to book one!</p>
              <Link to="/dashboard/browse" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                Browse Trips
              </Link>
            </div>
          )}
        </div>

        <div className="dash-card dash-card-pad">
          <p className="dash-card-title">Recent Activity</p>
          {recent.length === 0 ? (
            <div className="dash-empty-state" style={{ padding: '2rem 0' }}>
              <LucideTicket size={32} />
              <p>No bookings yet.</p>
            </div>
          ) : (
            <div className="dash-activity-list">
              {recent.map((b) => (
                <div key={b.id} className="dash-activity-item">
                  <div className="dash-act-icon"><LucideBus size={15} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="dash-act-route">{b.route}</p>
                    <p className="dash-act-company">{b.company}</p>
                  </div>
                  <div>
                    <p className="dash-act-amount">{b.amount}</p>
                    <p className="dash-act-date">{b.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <p className="dash-card-title" style={{ marginBottom: '1rem' }}>Quick Actions</p>
      <div className="dash-qa-grid">
        <Link to="/dashboard/browse"   className="dash-qa-card">
          <div className="dash-qa-icon"><LucideBus size={20} /></div>
          <div><p className="dash-qa-title">Book a Trip</p><p className="dash-qa-sub">Find available routes</p></div>
        </Link>
        <Link to="/dashboard/bookings" className="dash-qa-card">
          <div className="dash-qa-icon"><LucideTicket size={20} /></div>
          <div><p className="dash-qa-title">My Bookings</p><p className="dash-qa-sub">View your tickets</p></div>
        </Link>
        <Link to="/dashboard/profile"  className="dash-qa-card">
          <div className="dash-qa-icon"><LucideUser size={20} /></div>
          <div><p className="dash-qa-title">Update Profile</p><p className="dash-qa-sub">Manage your info</p></div>
        </Link>
      </div>
    </>
  );
}
