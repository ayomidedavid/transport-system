import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../../lib/api';
import { useUser } from './UserContext';
import * as signalR from '@microsoft/signalr';

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
    time:        new Date(n.createdAt || n.created_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read:        n.read,
    bookingRef:  n.bookingRef,
    agency:      n.agency,
    agencyEmail: n.agencyEmail,
    route:       n.route,
    amount:      n.amount,
  });

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      if (data) setNotifs(data.map(toAppNotif));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!user) { setNotifs([]); return; }

    fetchNotifs();

    let connection: signalR.HubConnection;

    const connectHub = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5129';
      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiUrl}/notifications`, {
          accessTokenFactory: () => localStorage.getItem('uniride_token') || ''
        })
        .withAutomaticReconnect()
        .build();

      connection.on('ReceiveNotification', (notification: any) => {
        setNotifs(prev => [toAppNotif(notification), ...prev]);
      });

      try {
        await connection.start();
        if (user.accountType === 'admin') {
           await connection.invoke('JoinGroup', 'AdminGroup');
        } else {
           await connection.invoke('JoinGroup', `User_${user.id}`);
        }
      } catch (err) {
        console.error('SignalR connection error: ', err);
      }
    };

    connectHub();

    return () => {
      if (connection) {
         if (user.accountType === 'admin') connection.invoke('LeaveGroup', 'AdminGroup').catch(() => {});
         else connection.invoke('LeaveGroup', `User_${user.id}`).catch(() => {});
         connection.stop().catch(() => {});
      }
    };
  }, [user, fetchNotifs]);

  const addNotif = useCallback(async (n: Omit<AppNotif, 'id' | 'time' | 'read'>) => {
    if (!user) return;
    try {
      const { data } = await api.post('/notifications', n);
      setNotifs(prev => [toAppNotif(data), ...prev]);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    try {
      await api.post('/notifications/read-all');
      setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const dismiss = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifs(ns => ns.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
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
