import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { useUser } from './UserContext';

export type AppNotif = {
  id:          string;
  type:        'booking' | 'payment' | 'user' | 'vendor' | 'alert';
  title:       string;
  body:        string;
  time:        string;
  read:        boolean;
  bookingRef?: string;
  agency?:     string;
  agencyEmail?: string;
  route?:      string;
  amount?:     string;
};

type NotifCtx = {
  notifs:      AppNotif[];
  addNotif:    (n: Omit<AppNotif, 'id' | 'time' | 'read'>) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss:     (id: string) => Promise<void>;
};

const Ctx = createContext<NotifCtx | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [notifs, setNotifs] = useState<AppNotif[]>([]);

  const toAppNotif = (n: any): AppNotif => ({
    id:          n.id,
    type:        n.type,
    title:       n.title,
    body:        n.body,
    time:        new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read:        n.read,
    bookingRef:  n.booking_ref,
    agency:      n.agency,
    agencyEmail: n.agency_email,
    route:       n.route,
    amount:      n.amount,
  });

  const fetchNotifs = useCallback(async (userId: string, role: string) => {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });

    if (role === 'admin') {
      query = query.or(`recipient_role.eq.admin,recipient_id.eq.${userId}`);
    } else {
      query = query.eq('recipient_id', userId);
    }

    const { data } = await query.limit(50);
    if (data) setNotifs(data.map(toAppNotif));
  }, []);

  useEffect(() => {
    if (!user) { setNotifs([]); return; }

    fetchNotifs(user.id, user.accountType === 'admin' ? 'admin' : 'user');

    const filter = user.accountType === 'admin'
      ? `recipient_role=eq.admin`
      : `recipient_id=eq.${user.id}`;

    const channel = supabase
      .channel(`notifs:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications', filter,
      }, () => fetchNotifs(user.id, user.accountType === 'admin' ? 'admin' : 'user'))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifs]);

  const addNotif = useCallback(async (n: Omit<AppNotif, 'id' | 'time' | 'read'>) => {
    if (!user) return;

    await supabase.from('notifications').insert([{
      type:           n.type,
      title:          n.title,
      body:           n.body,
      recipient_id:   user.id,
      recipient_role: user.accountType === 'logistics' ? 'vendor' : user.accountType === 'admin' ? 'admin' : 'student',
      booking_ref:    n.bookingRef  ?? null,
      agency:         n.agency      ?? null,
      agency_email:   n.agencyEmail ?? null,
      route:          n.route       ?? null,
      amount:         n.amount      ?? null,
    }]);
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const ids = notifs.map(n => n.id);
    if (ids.length) {
      await supabase.from('notifications').update({ read: true }).in('id', ids);
      setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    }
  }, [user, notifs]);

  const dismiss = useCallback(async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifs(ns => ns.filter(n => n.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ notifs, addNotif, markAllRead, dismiss }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
