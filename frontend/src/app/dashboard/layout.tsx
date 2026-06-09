import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LucideLayoutDashboard, LucideMap, LucideTicket,
  LucideUser, LucideLogOut, LucideBus, LucideBell, LucideMenu,
} from 'lucide-react';
import { useUser } from '../_context/UserContext';
import { useNotifications } from '../_context/NotificationContext';
import './dashboard.css';

const NAV = [
  { href: '/dashboard',          label: 'Overview',     icon: LucideLayoutDashboard },
  { href: '/dashboard/browse',   label: 'Browse Trips', icon: LucideMap             },
  { href: '/dashboard/bookings', label: 'My Bookings',  icon: LucideTicket          },
  { href: '/dashboard/profile',  label: 'Profile',      icon: LucideUser            },
];

export default function DashboardLayout() {
  const { pathname }  = useLocation();
  const navigate      = useNavigate();
  const { user, logout, theme, loading } = useUser();
  const { notifs } = useNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [user, loading, navigate]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const initials    = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : (loading ? '' : '?');
  const displayName = user ? user.firstName : (loading ? 'Loading...' : 'Guest');
  const activeLabel = NAV.find(n => n.href === pathname)?.label ?? 'Dashboard';

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className={`dash-root theme-${theme}`}>
      <div className={`dash-overlay ${open ? 'visible' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <aside className={`dash-sidebar ${open ? 'is-open' : ''}`}>
        <div className="dash-sidebar-logo">
          <div className="dash-logo-icon"><LucideBus size={17} /></div>
          <div>
            <p className="dash-logo-name">UNIRIDE</p>
            <p className="dash-logo-sub">Student Portal</p>
          </div>
        </div>
        <nav className="dash-nav">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} to={href} className={`dash-nav-item ${pathname === href ? 'active' : ''}`} onClick={() => setOpen(false)}>
              <Icon size={17} /> {label}
            </Link>
          ))}
          <div className="dash-nav-spacer" />
          <button className="dash-nav-item logout" onClick={handleLogout}>
            <LucideLogOut size={17} /> Logout
          </button>
        </nav>
      </aside>

      <header className="dash-header">
        <div className="dash-header-left">
          <button className="dash-menu-btn" onClick={() => setOpen(o => !o)} aria-label="Toggle sidebar">
            <LucideMenu size={18} />
          </button>
          <h1 className="dash-header-title">{activeLabel}</h1>
        </div>
        <div className="dash-header-right">
          <button className="dash-notif-btn" aria-label="Notifications" onClick={() => navigate('/dashboard/profile')}>
            <LucideBell size={16} />
            {unreadCount > 0 && <span className="dash-notif-badge">{unreadCount}</span>}
          </button>
          <div className="dash-user-chip">
            <div className="dash-user-info">
              <p className="dash-user-name">{displayName}</p>
              <p className="dash-user-id">{user?.studentId ?? '—'}</p>
            </div>
            <div className="dash-avatar">{initials}</div>
          </div>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
