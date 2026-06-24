import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LucideLayoutDashboard, LucideShoppingCart, LucideUsers,
  LucideTicket, LucideGrid, LucideRefreshCcw, LucideStar,
  LucidePlusCircle, LucideImage, LucideList, LucideMessageSquare,
  LucideShieldCheck, LucideSettings, LucideLogOut, LucideSearch,
  LucideBell, LucideSun, LucideMoon, LucideClock, LucideRefreshCw, LucideBus,
  LucideBarChart2, LucideBriefcase, LucideMenu
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useVendor } from '../_context/VendorContext';
import { api } from '../../lib/api';
import './vendor.css';

const SIDEBAR_GROUPS = [
  {
    title: 'Management',
    items: [
      { label: 'Dashboard',        path: '/vendor',            icon: <LucideLayoutDashboard size={18} /> },
      { label: 'Student Bookings', path: '/vendor/bookings',    icon: <LucideShoppingCart    size={18} /> },
      { label: 'Analytics',        path: '/vendor/analytics',   icon: <LucideBarChart2       size={18} /> },
      { label: 'Finances',         path: '/vendor/transactions',icon: <LucideRefreshCcw     size={18} /> },
      { label: 'Fleet Management', path: '/vendor/brand',       icon: <LucideStar            size={18} /> },
    ]
  },
  {
    title: 'Operations',
    items: [
      { label: 'Manage Trips',     path: '/vendor/trips',       icon: <LucidePlusCircle      size={18} /> },
      { label: 'Company Profile',  path: '/vendor/profile',      icon: <LucideBriefcase       size={18} /> },
      { label: 'Trip History',     path: '/vendor/list',        icon: <LucideList            size={18} /> },
      { label: 'Feedback',         path: '/vendor/reviews',     icon: <LucideMessageSquare   size={18} /> },
    ]
  },
  {
    title: 'Settings',
    items: [
      { label: 'Account Roles',    path: '/vendor/role',        icon: <LucideShieldCheck     size={18} /> },
      { label: 'Security',         path: '/vendor/settings',    icon: <LucideSettings        size={18} /> },
    ]
  }
];

export default function VendorLayout() {
  const { company, vendorLogout, checkApprovalStatus } = useVendor();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('vd-theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('vd-dark-body');
      localStorage.setItem('vd-theme', 'dark');
    } else {
      document.body.classList.remove('vd-dark-body');
      localStorage.setItem('vd-theme', 'light');
    }
  }, [isDark]);

  const handleLogout = async () => { navigate('/', { replace: true }); setTimeout(() => vendorLogout(), 100); };

  const handleCheckStatus = async () => {
    checkApprovalStatus();
    try {
      await api.post('/notifications/notify-admin', {
        type: 'vendor_approval_ping',
        title: 'Vendor Status Check',
        body: `${company?.name || 'A vendor'} just requested a status update on their pending registration.`
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!company) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8FAFC', color:'#1e293b', flexDirection:'column', gap:'1.25rem', textAlign:'center', padding:'2rem' }}>
        <LucideBus size={48} color="#10B981" />
        <h2 style={{ fontSize:'1.75rem', fontWeight:800, margin:0 }}>Vendor Portal</h2>
        <p style={{ color:'#64748b', margin:0 }}>Please sign in to access your logistics dashboard.</p>
        <button onClick={() => navigate('/login')} style={{ background:'#10B981', color:'#fff', border:'none', borderRadius:'12px', padding:'12px 32px', fontWeight:700, fontSize:'1rem', cursor:'pointer', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' }}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className={`vd-root ${isDark ? 'vd-dark' : ''}`}>
      {/* Pending Overlay */}
      {company.verificationStatus === 'pending' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--vd-surface)', opacity: 0.95, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: 'var(--vd-surface)', border: '1px solid var(--vd-border)', padding: '40px', borderRadius: '24px', maxWidth: '400px', textAlign: 'center', boxShadow: 'var(--vd-shadow-md)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '0 auto 1.5rem' }}>
              <LucideClock size={36} color="#F59E0B" />
              <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #F59E0B', borderTopColor: 'transparent', animation: 'spin 2s linear infinite' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--vd-text-main)', margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>Account Under Review</h2>
                <p style={{ color: 'var(--vd-text-sub)', lineHeight: 1.6, fontSize: '1.05rem', margin: 0 }}>
                  Welcome to UNITRANSIT! Your registration for <strong>{company.name}</strong> is being verified by our team.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                <button className="vd-btn-primary" onClick={handleCheckStatus} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: '12px', background: 'var(--vd-primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  <LucideRefreshCw size={16} /> Check Status
                </button>
                <button className="vd-btn-outline" onClick={handleLogout} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'transparent', color: 'var(--vd-text-main)', border: '1px solid var(--vd-border)', fontWeight: 600, cursor: 'pointer' }}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(2px)' }} 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`vd-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="vd-sidebar-logo">
          <div className="vd-sidebar-logo-icon">
             <LucideBus size={18} color="#fff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>UNITRANSIT</span>
        </div>

        <div className="vd-nav-scroll">
          {SIDEBAR_GROUPS.map((group, idx) => (
            <div key={idx} className="vd-nav-group">
              <p className="vd-nav-group-title">{group.title}</p>
              {group.items.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`vd-nav-item${location.pathname === item.path ? ' active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="vd-sidebar-user">
          <div className="avatar">
            <img src={`https://ui-avatars.com/api/?name=${company.name}&background=10B981&color=fff`} alt="" />
          </div>
          <div className="info">
            <strong>{company.name}</strong>
            <span>{company.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LucideLogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="vd-main">
        <header className="vd-header">
          <div className="vd-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="vd-mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none' }}>
              <LucideMenu size={24} color="#1E293B" />
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Dashboard</h1>
          </div>
          
          <div className="vd-header-center">
             <div className="vd-search-bar">
               <LucideSearch size={18} color="#94A3B8" />
               <input type="text" placeholder="Search data, users, or reports" />
               <kbd>⌘K</kbd>
             </div>
          </div>

          <div className="vd-header-right">
            <button className="vd-icon-btn"><LucideBell size={20} /></button>
            <button className="vd-icon-btn" onClick={() => setIsDark(!isDark)}>
              {isDark ? <LucideMoon size={20} /> : <LucideSun size={20} />}
            </button>
            <div className="vd-user-pill">
               <img src="https://ui-avatars.com/api/?name=Admin&background=10B981&color=fff" alt="" />
            </div>
          </div>
        </header>

        <div className="vd-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
