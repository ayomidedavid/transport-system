import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LucideSettings, LucideLogOut, LucideBus,
  LucideBell, LucideCheckCheck, LucideX, LucideMail,
  LucideLayoutDashboard, LucideUsers, LucideTruck,
  LucideCreditCard, LucideTicket, LucideBarChart2,
  LucideSearch
} from 'lucide-react';
import { useAdmin } from '../_context/AdminContext';
import { useUser } from '../_context/UserContext';
import { useNotifications, type AppNotif } from '../_context/NotificationContext';
import './admin.css';

const SIDEBAR_NAV = [
  { label: 'Overview',      path: '/admin',              icon: <LucideLayoutDashboard size={18} /> },
  { label: 'Transactions',  path: '/admin/transactions',   icon: <LucideCreditCard      size={18} /> },
  { label: 'Bookings',      path: '/admin/bookings',       icon: <LucideTicket          size={18} /> },
  { label: 'Vendors',       path: '/admin/vendors',        icon: <LucideTruck           size={18} /> },
  { label: 'Users',         path: '/admin/users',          icon: <LucideUsers           size={18} /> },
  { label: 'Analytics',     path: '/admin/analytics',      icon: <LucideBarChart2       size={18} /> },
  { label: 'Notifications', path: '/admin/notifications',  icon: <LucideBell            size={18} /> },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useAdmin();
  const { user, loading: userLoading, logout } = useUser();
  const { notifs, markAllRead, dismiss } = useNotifications();

  const [authState, setAuthState] = useState<'loading' | 'ok' | 'denied'>('loading');
  const [adminEmail, setAdminEmail] = useState('admin@uniride.ng');
  const [adminName, setAdminName] = useState('Platform Admin');
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowInstall(false);
      });
    }
  };

  /* ── Verify admin session ── */
  useEffect(() => {
    if (userLoading) {
      setAuthState('loading');
    } else if (user && user.accountType === 'admin') {
      setAdminEmail(user.email);
      setAdminName(`${user.firstName} ${user.lastName}`.trim() || 'Platform Admin');
      setAuthState('ok');
    } else {
      if (user) logout();
      setAuthState('denied');
    }
  }, [user, userLoading, logout]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  useEffect(() => {
    if (authState === 'denied') navigate('/admin/login', { replace: true });
  }, [authState, navigate]);

  if (authState === 'loading') {
    return (
      <div style={{ minHeight:'100vh', background:'#06080F', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'#94A3B8', fontSize:'0.9rem' }}>Verifying session…</div>
      </div>
    );
  }

  if (authState !== 'ok') return null;

  const unread = notifs.filter(n => !n.read).length;

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className={`ad-root${theme === 'dark' ? ' dark-theme' : ''}`}>
      
      {/* ── Sidebar ── */}
        <aside className={`ad-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
          <div className="ad-sidebar-logo">
            <div className="ad-logo-icon"><LucideBus size={18} color="#000" /></div>
            <div className="ad-logo-text">UniRide Admin</div>
            <button className="ad-menu-toggle" onClick={() => setMobileSidebarOpen(false)} style={{ marginLeft: 'auto' }}>
              <LucideX size={20} />
            </button>
          </div>

          <nav className="ad-sidebar-nav">
            {SIDEBAR_NAV.map(item => (
              <button
                key={item.path}
                className={`ad-sidebar-link${isActive(item.path) ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="ad-sidebar-footer">
            {showInstall && (
              <button className="ad-sidebar-link" onClick={handleInstallClick} style={{ color: '#10B981', fontWeight: 600 }}>
                <LucideBus size={18} /> Install App
              </button>
            )}
            <button className="ad-sidebar-link" onClick={() => navigate('/admin/settings')}>
              <LucideSettings size={18} /> Settings
            </button>
            <button className="ad-sidebar-link" onClick={handleSignOut} style={{ color: '#EF4444' }}>
              <LucideLogOut size={18} /> Logout
            </button>
          </div>
        </aside>

        <div className="ad-main-wrapper">
          {/* ── Header ── */}
          <header className="ad-header">
            <button className="ad-menu-toggle" onClick={() => setMobileSidebarOpen(true)}>
              <LucideBus size={24} />
            </button>
            <div className="ad-header-search">
              <LucideSearch size={16} color="#64748B" />
              <input type="text" placeholder="Search anything..." />
            </div>

            <div className="ad-header-actions">
              <div className="ad-notif-wrap" ref={notifRef}>
                <button
                  className={`ad-icon-btn notif${notifOpen ? ' active' : ''}`}
                  onClick={() => setNotifOpen(o => !o)}
                  title="Notifications"
                >
                  <LucideBell size={20} strokeWidth={1.5} />
                  {unread > 0 && <span className="ad-notif-dot" />}
                </button>

                {notifOpen && (
                  <div className="ad-notif-dropdown">
                    <div className="ad-notif-head">
                      <h3>Notifications</h3>
                      <button className="ad-notif-mark-all" onClick={markAllRead}>Mark all as read</button>
                    </div>
                    
                    <div className="ad-notif-tabs">
                      <button className="ad-notif-tab active">Inbox {unread > 0 && <span style={{ marginLeft: 4, background: '#7C3AED', color: '#fff', borderRadius: 100, padding: '0 6px', fontSize: '0.65rem' }}>{unread}</span>}</button>
                      <button className="ad-notif-tab">General</button>
                      <button className="ad-notif-tab">Archived</button>
                    </div>

                    <div className="ad-notif-list">
                      {notifs.length === 0 ? (
                        <p className="ad-notif-empty" style={{ textAlign: 'center', padding: '3rem', color: 'var(--ad-text-muted)', fontSize: '0.9rem' }}>All clear! No notifications.</p>
                      ) : notifs.map(n => (
                        <div key={n.id} className={`ad-notif-item${n.read ? ' read' : ''}`}>
                          <div className="ad-notif-avatar">
                            {n.type === 'vendor' ? <LucideTruck size={18} /> : n.type === 'booking' ? <LucideBus size={18} /> : n.title[0]}
                          </div>
                          
                          <div className="ad-notif-body">
                            <div className="ad-notif-title-row">
                              <p className="ad-notif-title">{n.title}</p>
                              {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }} />}
                            </div>
                            <p className="ad-notif-text">{n.body}</p>
                            
                            {n.type === 'vendor' && !n.read && (
                              <div className="ad-notif-actions">
                                <button className="ad-btn-decline" onClick={() => { dismiss(n.id); navigate('/admin/vendors'); }}>Review</button>
                              </div>
                            )}

                            <div className="ad-notif-meta">
                              <span>{n.time}</span>
                              <span>•</span>
                              <span>UNIRIDE System</span>
                            </div>
                          </div>
                          
                          <button className="ad-notif-dismiss" style={{ background: 'none', border: 'none', color: 'var(--ad-text-muted)', cursor: 'pointer', padding: 4 }} onClick={() => dismiss(n.id)}>
                            <LucideX size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 12, borderLeft: '1px solid var(--ad-border)' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{adminName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>Super Admin</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ad-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontSize: '0.8rem' }}>
                  {adminName[0]}
                </div>
              </div>
            </div>
          </header>

          <main className="ad-main-content">
            <Outlet />
          </main>
        </div>
      </div>
  );
}
