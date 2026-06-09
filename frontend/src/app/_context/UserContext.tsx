import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

export type AccountType = 'student' | 'logistics' | 'admin';

export type User = {
  id:          string;
  firstName:   string;
  lastName:    string;
  email:       string;
  phone:       string;
  matric:      string;
  department:  string;
  accountType: AccountType;
  studentId:   string;
};

export type Booking = {
  id:        string;
  route:     string;
  company:   string;
  to:        string;
  vehicleType: string;
  status:    'confirmed' | 'pending' | 'cancelled' | 'completed';
  date:      string;
  time:      string;
  pickup:    string;
  seat:      string;
  ref:       string;
  amount:    string;
  priceNum:  number;
  createdAt: string;
};

type Ctx = {
  user:        User | null;
  bookings:    Booking[];
  loading:     boolean;
  login:       (u: User, token: string) => void;
  logout:      () => void;
  updateUser:  (u: User) => void;
  addBooking:  (b: Booking) => void;
  cancelBooking: (id: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
  theme:       'light' | 'dark';
  toggleTheme: () => void;
};

const UserContext = createContext<Ctx>({
  user: null, bookings: [], loading: true,
  login: () => {}, logout: () => {}, updateUser: () => {},
  addBooking: () => {}, cancelBooking: async () => {},
  refreshBookings: async () => {},
  theme: 'light', toggleTheme: () => {},
});

function readStoredValue(key: string, fallback: string) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeStoredValue(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user,     setUser]     = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [theme,    setTheme]    = useState<'light' | 'dark'>(() => {
    return readStoredValue('ur_theme', 'light') as 'light' | 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      writeStoredValue('ur_theme', next);
      return next;
    });
  }, []);

  const fetchBookings = useCallback(async (userId: string) => {
    try {
      const { data } = await api.get(`/bookings/student/${userId}`);
      if (data) setBookings(data);
    } catch (e) {
      console.error('Failed to fetch bookings', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('uniride_token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
          await fetchBookings(data.id);
        } catch (e) {
          console.error('Auth check failed:', e);
          localStorage.removeItem('uniride_token');
        }
      }
      setLoading(false);
    };
    init();
  }, [fetchBookings]);

  const login = useCallback((u: User, token: string) => {
    localStorage.setItem('uniride_token', token);
    setUser(u);
    fetchBookings(u.id);
  }, [fetchBookings]);

  const logout = useCallback(() => {
    localStorage.removeItem('uniride_token');
    setUser(null);
    setBookings([]);
  }, []);

  const updateUser = useCallback((u: User) => setUser(u), []);

  const addBooking = useCallback((b: Booking) => setBookings(prev => [b, ...prev]), []);

  const cancelBooking = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await api.post(`/bookings/${id}/cancel`, { studentId: user.id });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
    } catch (e) {
      console.error('Error cancelling booking', e);
      throw e;
    }
  }, [user]);

  const refreshBookings = useCallback(async () => {
    if (user) await fetchBookings(user.id);
  }, [user, fetchBookings]);

  return (
    <UserContext.Provider value={{ 
      user, bookings, loading, login, logout, updateUser, addBooking, cancelBooking, refreshBookings,
      theme, toggleTheme
    }}>
      {children}
    </UserContext.Provider>
  );
}
export const useUser     = () => useContext(UserContext);
export const useBookings = () => useContext(UserContext).bookings;
