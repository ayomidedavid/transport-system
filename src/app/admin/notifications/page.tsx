import { useState, useEffect } from 'react';
import { LucideBell, LucideCheckCircle, LucideClock, LucideTruck, LucideBus, LucideX } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdmin } from '../../_context/AdminContext';
import './notifications.css';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

export default function AdminNotificationsPage() {
  const { theme } = useAdmin();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_role', 'admin')
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  };

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('recipient_role', 'admin');
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'vendor': return <LucideTruck size={20} color="#F59E0B" />;
      case 'booking': return <LucideBus size={20} color="#3B82F6" />;
      default: return <LucideBell size={20} color="#10B981" />;
    }
  };

  return (
    <div className={`ad-page${theme === 'dark' ? ' dark' : ''}`} style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--ad-text)' }}>Notifications History</h1>
          <p style={{ color: 'var(--ad-text-muted)', margin: '4px 0 0 0' }}>View all system alerts, vendor requests, and updates.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', color: 'var(--ad-text)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
        >
          <LucideCheckCircle size={16} /> Mark all read
        </button>
      </div>

      <div style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
            <LucideBell size={48} color="var(--ad-border)" style={{ marginBottom: '1rem' }} />
            <h3>No notifications yet</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: '16px', padding: '20px', borderBottom: '1px solid var(--ad-border)', background: n.read ? 'transparent' : 'rgba(124, 58, 237, 0.03)', transition: 'background 0.2s', position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--ad-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--ad-border)' }}>
                  {getIcon(n.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: n.read ? 600 : 700, color: 'var(--ad-text)' }}>
                      {n.title}
                      {!n.read && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', marginLeft: 8 }} />}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ad-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <LucideClock size={12} />
                      {new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: n.read ? 'var(--ad-text-muted)' : 'var(--ad-text)', fontSize: '0.95rem', lineHeight: 1.5 }}>{n.body}</p>
                </div>
                <button 
                  onClick={() => dismissNotification(n.id)}
                  style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--ad-text-muted)', cursor: 'pointer', padding: 4, opacity: 0.5 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                >
                  <LucideX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
