import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

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

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readStoredValue('ad-theme', 'light') as 'light' | 'dark');
  
  useEffect(() => {
    writeStoredValue('ad-theme', theme);
  }, [theme]);

  const [users,        setUsers]        = useState<AdminUser[]>([]);
  const [vendors,      setVendors]      = useState<AdminVendor[]>([]);
  const [bookings,     setBookings]     = useState<AdminBooking[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading,      setLoading]      = useState(true);

  const loadFromSupabase = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, vendorsRes, bookingsRes, txnsRes] = await Promise.all([
        supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false }),
        supabase.from('vendors').select('*').order('created_at', { ascending: false }),
        // Note: student_id FK points to auth.users, not profiles — join via vendor_id only
        supabase.from('bookings')
          .select('*, vendor:vendor_id(name)')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      // Build a profile lookup map from the profiles result
      const profileMap: Record<string, { firstName: string; lastName: string; email: string }> = {};
      if (usersRes.data) {
        usersRes.data.forEach(p => {
          profileMap[p.id] = {
            firstName: p.first_name || '',
            lastName:  p.last_name  || '',
            email:     p.email      || '',
          };
        });
      }

      // Compute per-student booking stats from bookings data
      const bookingStats: Record<string, { count: number; spent: number }> = {};
      if (bookingsRes.data) {
        bookingsRes.data.forEach((b: any) => {
          if (!bookingStats[b.student_id]) bookingStats[b.student_id] = { count: 0, spent: 0 };
          bookingStats[b.student_id].count++;
          if (b.status !== 'cancelled') bookingStats[b.student_id].spent += Number(b.price_num || 0);
        });
      }

      const students = (usersRes.data ?? []).filter(p => p.role !== 'vendor');
      setUsers(students.map(p => ({
        id:            p.id,
        firstName:     p.first_name  || '',
        lastName:      p.last_name   || '',
        email:         p.email,
        phone:         p.phone       || '',
        matric:        p.matric      || '',
        department:    p.department  || '',
        totalBookings: bookingStats[p.id]?.count || 0,
        totalSpent:    bookingStats[p.id]?.spent || 0,
        status:        'active' as const,
        joinedAt:      p.created_at.slice(0, 10),
      })));

      setVendors((vendorsRes.data ?? []).map(v => ({
        id:                 v.id,
        backendId:          v.id,
        name:               v.name,
        registrationNumber: v.registration_number || '',
        contactPerson:      v.contact_person,
        email:              v.email,
        phone:              v.phone   || '',
        address:            v.address || '',
        totalTrips:         v.total_trips,
        totalRevenue:       Number(v.total_revenue),
        totalBookings:      v.total_bookings,
        status:             (v.verification_status === 'approved' ? 'active' : 'suspended') as 'active' | 'suspended',
        verificationStatus: v.verification_status as VerificationStatus,
        joinedAt:           v.created_at.slice(0, 10),
      })));

      setBookings((bookingsRes.data ?? []).map((b: any) => {
        const profile = profileMap[b.student_id];
        return {
          id:           b.id,
          ref:          b.ref,
          studentName:  profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Unknown',
          studentEmail: profile?.email || '',
          vendorName:   b.vendor?.name || b.company || '',
          route:        b.route,
          date:         b.date,
          amount:       Number(b.price_num || 0),
          status:       b.status as AdminBooking['status'],
          createdAt:    b.created_at,
        };
      }));

      setTransactions((txnsRes.data ?? []).map(t => ({
        id:          t.id,
        ref:         t.ref,
        studentName: t.student_name || '',
        vendorName:  t.vendor_name  || '',
        route:       t.route        || '',
        amount:      Number(t.amount),
        type:        t.type as 'booking' | 'refund',
        status:      t.status as AdminTransaction['status'],
        createdAt:   t.created_at,
      })));
    } catch (err) {
      console.error('[AdminContext] Supabase fetch failed:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFromSupabase(); }, [loadFromSupabase]);

  /* ── Approve vendor ── */
  const approveVendor = useCallback(async (id: string) => {
    const vendor = vendors.find(v => v.id === id);
    if (!vendor) return;

    /* Update vendors table */
    await supabase.from('vendors')
      .update({ verification_status: 'approved' })
      .eq('id', id);

    /* Fetch owner_id for targeted notification */
    const { data: row } = await supabase
      .from('vendors').select('owner_id').eq('id', id).single();

    if (row?.owner_id) {
      await supabase.from('notifications').insert([{
        type:           'vendor',
        title:          'Registration Approved',
        body:           `Your registration for ${vendor.name} has been approved. You can now start operating on UNIRIDE.`,
        recipient_id:   row.owner_id,
        recipient_role: 'vendor',
      }]);
    }

    /* Admin confirmation notification */
    await supabase.from('notifications').insert([{
      type:           'vendor',
      title:          'Vendor Verified',
      body:           `${vendor.name} has been approved and can now operate on UNIRIDE.`,
      recipient_role: 'admin',
    }]);

    setVendors(prev => prev.map(v => v.id === id
      ? { ...v, status: 'active' as const, verificationStatus: 'approved' as const }
      : v));
  }, [vendors]);

  /* ── Reject vendor ── */
  const rejectVendor = useCallback(async (id: string, reason = '') => {
    const vendor = vendors.find(v => v.id === id);
    if (!vendor) return;

    await supabase.from('vendors')
      .update({ verification_status: 'rejected' })
      .eq('id', id);

    const { data: row } = await supabase
      .from('vendors').select('owner_id').eq('id', id).single();

    if (row?.owner_id) {
      await supabase.from('notifications').insert([{
        type:           'alert',
        title:          'Registration Not Approved',
        body:           `Your registration for ${vendor.name} was not approved.${reason ? ` Reason: ${reason}` : ''} Contact support@uniride.ng for more information.`,
        recipient_id:   row.owner_id,
        recipient_role: 'vendor',
      }]);
    }

    setVendors(prev => prev.map(v => v.id === id
      ? { ...v, status: 'suspended' as const, verificationStatus: 'rejected' as const }
      : v));
  }, [vendors]);

  const refreshVendors = useCallback(async () => { await loadFromSupabase(); }, [loadFromSupabase]);

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
