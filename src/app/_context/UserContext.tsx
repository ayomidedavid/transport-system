import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

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
  login:       (u: User) => void;
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
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in strict/private browser modes.
  }
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

  const fetchProfile = useCallback(async (userId: string, retries = 8): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if ((!profile || error) && retries > 0) {
      console.log(`Profile not found for ${userId}, retrying... (${retries} left)`);
      await new Promise(res => setTimeout(res, 1500));
      return fetchProfile(userId, retries - 1);
    }

    if (profile) {
      let firstName  = profile.first_name  || '';
      let lastName   = profile.last_name   || '';
      let phone      = profile.phone       || '';
      let matric     = profile.matric      || '';
      let department = profile.department  || '';
      let studentId  = profile.student_id  || '';

      // If profile fields are empty, backfill from auth user metadata
      // (handles accounts created before trigger ran, or Google OAuth users)
      if (!firstName) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const meta      = authUser?.user_metadata ?? {};
        const fullName  = meta.full_name || meta.name || '';
        firstName  = meta.first_name  || fullName.split(' ')[0]                    || '';
        lastName   = meta.last_name   || fullName.split(' ').slice(1).join(' ')    || '';
        phone      = meta.phone       || phone;
        matric     = meta.matric      || matric;
        department = meta.department  || department;
        studentId  = meta.student_id  || studentId;

        // Persist the fix so future logins don't need the fallback
        if (firstName) {
          supabase.from('profiles').update({
            first_name:  firstName,
            last_name:   lastName,
            phone:       phone      || null,
            matric:      matric     || null,
            department:  department || null,
            student_id:  studentId  || null,
          }).eq('id', userId).then(() => {});
        }
      }

      const userData: User = {
        id:          profile.id,
        firstName,
        lastName,
        email:       profile.email,
        phone,
        matric,
        department,
        accountType: (profile.role === 'vendor' ? 'logistics' : (profile.role === 'admin' ? 'admin' : 'student')) as AccountType,
        studentId,
      };
      setUser(userData);
      return userData;
    }
    return null;
  }, []);

  const fetchBookings = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted: Booking[] = data.map(b => ({
        id: b.id,
        route: b.route,
        company: b.company,
        to: b.destination,
        vehicleType: b.vehicle_type,
        status: b.status,
        date: b.date,
        time: b.time,
        pickup: b.pickup,
        seat: b.seat,
        ref: b.ref,
        amount: b.amount,
        priceNum: Number(b.price_num),
        createdAt: b.created_at,
      }));
      setBookings(formatted);
    }
  }, []);

  useEffect(() => {
    // 1. Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await Promise.all([
          fetchProfile(session.user.id),
          fetchBookings(session.user.id)
        ]);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        // Enforce @run.edu.ng domain for Google OAuth sign-ins
        const provider = session.user.app_metadata?.provider;
        if (provider === 'google') {
          const email = session.user.email ?? '';
          if (!email.toLowerCase().endsWith('@run.edu.ng')) {
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
        }
        setLoading(true);
        await Promise.all([
          fetchProfile(session.user.id),
          fetchBookings(session.user.id)
        ]);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setBookings([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchBookings]);

  const login = useCallback((u: User) => {
    setUser(u);
    fetchBookings(u.id);
  }, [fetchBookings]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBookings([]);
  }, []);

  const updateUser = useCallback((u: User) => {
    setUser(u);
  }, []);

  const addBooking = useCallback((b: Booking) => {
    setBookings(prev => [b, ...prev]);
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw new Error(error.message);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
  }, []);

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
