import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

/* ─── Types ─── */
export type AdminUser = {
  id: string; firstName: string; lastName: string; email: string;
  phone: string; matric: string; department: string;
  totalBookings: number; totalSpent: number;
  status: 'active' | 'suspended'; joinedAt: string;
};

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type AdminVendor = {
  id: string; name: string; registrationNumber: string;
  contactPerson: string; email: string; phone: string; address?: string;
  totalTrips: number; totalRevenue: number; totalBookings: number;
  status: 'active' | 'suspended';
  verificationStatus: VerificationStatus;
  backendId?: string;
  joinedAt: string;
};

export type AdminBooking = {
  id: string; ref: string;
  studentName: string; studentEmail: string; vendorName: string;
  route: string; date: string; amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
};

export type AdminTransaction = {
  id: string; ref: string;
  studentName: string; vendorName: string;
  route: string; amount: number;
  type: 'booking' | 'refund';
  status: 'successful' | 'pending' | 'failed';
  createdAt: string;
};

/* ─── Context type ─── */
type AdminCtx = {
  users:          AdminUser[];
  vendors:        AdminVendor[];
  bookings:       AdminBooking[];
  transactions:   AdminTransaction[];
  loading:        boolean;
  theme:          'light' | 'dark';
  setTheme:       (t: 'light' | 'dark') => void;
  suspendUser:    (id: string) => void;
  activateUser:   (id: string) => void;
  suspendVendor:  (id: string) => void;
  activateVendor: (id: string) => void;
  approveVendor:  (id: string) => Promise<void>;
  rejectVendor:   (id: string, reason?: string) => Promise<void>;
  refreshVendors: () => Promise<void>;
};

const Ctx = createContext<AdminCtx | null>(null);
export const useAdmin = () => useContext(Ctx)!;

function readStoredValue(key: string, fallback: string) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeStoredValue(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readStoredValue('ad-theme', 'light') as 'light' | 'dark');
  
  useEffect(() => { writeStoredValue('ad-theme', theme); }, [theme]);

  const [users,        setUsers]        = useState<AdminUser[]>([]);
  const [vendors,      setVendors]      = useState<AdminVendor[]>([]);
  const [bookings,     setBookings]     = useState<AdminBooking[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading,      setLoading]      = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/dashboard');

      const students = (data.users ?? []).filter((p: any) => p.role === 'student');
      
      const bookingStats: Record<string, { count: number; spent: number }> = {};
      (data.bookings ?? []).forEach((b: any) => {
         const sid = b.studentId || 'unknown';
         if (!bookingStats[sid]) bookingStats[sid] = { count: 0, spent: 0 };
         bookingStats[sid].count++;
         if (b.status !== 'cancelled') bookingStats[sid].spent += Number(b.amount || 0);
      });

      setUsers(students.map((p: any) => ({
        id:            p.id,
        firstName:     p.firstName  || '',
        lastName:      p.lastName   || '',
        email:         p.email,
        phone:         p.phone       || '',
        matric:        p.matric      || '',
        department:    p.department  || '',
        totalBookings: bookingStats[p.id]?.count || 0,
        totalSpent:    bookingStats[p.id]?.spent || 0,
        status:        'active' as const,
        joinedAt:      p.joinedAt?.slice(0, 10) || '',
      })));

      setVendors((data.vendors ?? []).map((v: any) => ({
        id:                 v.id,
        backendId:          v.id,
        name:               v.name,
        registrationNumber: v.registrationNumber || '',
        contactPerson:      v.contactPerson,
        email:              v.email,
        phone:              v.phone   || '',
        address:            v.address || '',
        totalTrips:         v.totalTrips,
        totalRevenue:       Number(v.totalRevenue),
        totalBookings:      v.totalBookings,
        status:             (v.verificationStatus === 'approved' ? 'active' : 'suspended') as 'active' | 'suspended',
        verificationStatus: v.verificationStatus as VerificationStatus,
        joinedAt:           v.createdAt?.slice(0, 10) || '',
      })));

      setBookings((data.bookings ?? []).map((b: any) => ({
        id:           b.id,
        ref:          b.ref,
        studentName:  b.studentName || 'Unknown',
        studentEmail: b.studentEmail || '',
        vendorName:   b.vendorName || '',
        route:        b.route,
        date:         b.date,
        amount:       Number(b.amount || 0),
        status:       b.status as AdminBooking['status'],
        createdAt:    b.createdAt,
      })));

      setTransactions((data.transactions ?? []).map((t: any) => ({
        id:          t.id,
        ref:         t.ref,
        studentName: t.studentName || '',
        vendorName:  t.vendorName  || '',
        route:       t.route        || '',
        amount:      Number(t.amount),
        type:        t.type as 'booking' | 'refund',
        status:      t.status as AdminTransaction['status'],
        createdAt:   t.createdAt,
      })));

    } catch (err) {
      console.error('[AdminContext] API fetch failed:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const approveVendor = useCallback(async (id: string) => {
    try {
      await api.post(`/admin/vendors/${id}/approve`);
      setVendors(prev => prev.map(v => v.id === id ? { ...v, status: 'active' as const, verificationStatus: 'approved' as const } : v));
      alert('Vendor successfully approved!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to approve vendor: ' + (err.response?.data?.error || err.message));
    }
  }, []);

  const rejectVendor = useCallback(async (id: string, reason = '') => {
    try {
      await api.post(`/admin/vendors/${id}/reject`, { reason });
      setVendors(prev => prev.map(v => v.id === id ? { ...v, status: 'suspended' as const, verificationStatus: 'rejected' as const } : v));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const refreshVendors = useCallback(async () => { await loadData(); }, [loadData]);

  return (
    <Ctx.Provider value={{
      users, vendors, bookings, transactions, loading,
      theme, setTheme,
      suspendUser:    (id) => setUsers(u  => u.map(x => x.id === id ? { ...x, status: 'suspended' as const } : x)),
      activateUser:   (id) => setUsers(u  => u.map(x => x.id === id ? { ...x, status: 'active'    as const } : x)),
      suspendVendor:  (id) => setVendors(v => v.map(x => x.id === id ? { ...x, status: 'suspended' as const } : x)),
      activateVendor: (id) => setVendors(v => v.map(x => x.id === id ? { ...x, status: 'active'    as const } : x)),
      approveVendor,
      rejectVendor,
      refreshVendors,
    }}>
      {children}
    </Ctx.Provider>
  );
}
