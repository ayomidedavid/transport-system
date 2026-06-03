import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type Company = {
  id?:                string;
  backendId?:         string;
  name:               string;
  registrationNumber: string;
  contactPerson:      string;
  email:              string;
  phone:              string;
  address?:           string;
  verificationStatus: VerificationStatus;
};

export type Trip = {
  id:             string;
  origin:         string;
  destination:    string;
  departureDate:  string;
  departureTime:  string;
  arrivalTime:    string;
  vehicleType:    string;
  totalSeats:     number;
  availableSeats: number;
  price:          number;
  status:         'active' | 'completed' | 'cancelled';
  createdAt:      string;
};

export type VendorBooking = {
  id:           string;
  tripId:       string;
  studentName:  string;
  studentEmail: string;
  studentPhone?: string;
  studentMatric?: string;
  studentDept?: string;
  route:        string;
  date:         string;
  seat:         string;
  amount:       number;
  status:       'pending' | 'confirmed' | 'completed' | 'cancelled';
  ref:          string;
  createdAt:    string;
};

type VendorCtx = {
  company:             Company | null;
  trips:               Trip[];
  vendorBookings:      VendorBooking[];
  isVendorAuth:        boolean;
  vendorLogin:         (c: Company) => void;
  vendorLogout:        () => Promise<void>;
  updateCompany:       (c: Company) => Promise<void>;
  checkApprovalStatus: () => Promise<void>;
  addTrip:             (t: Trip) => Promise<void>;
  cancelTrip:          (id: string) => Promise<void>;
  confirmBooking:      (id: string) => Promise<void>;
  cancelVendorBooking: (id: string) => Promise<void>;
};

const VendorContext = createContext<VendorCtx>({
  company: null, trips: [], vendorBookings: [], isVendorAuth: false,
  vendorLogin: () => {}, vendorLogout: async () => {}, updateCompany: async () => {},
  checkApprovalStatus: async () => {},
  addTrip: async () => {}, cancelTrip: async () => {},
  confirmBooking: async () => {}, cancelVendorBooking: async () => {},
});

export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [company,        setCompany]        = useState<Company | null>(null);
  const [trips,          setTrips]          = useState<Trip[]>([]);
  const [vendorBookings, setVendorBookings] = useState<VendorBooking[]>([]);
  const [ready,          setReady]          = useState(false);

  /* ── Fetch all vendor data for a given auth user ── */
  const fetchVendorData = useCallback(async (userId: string) => {
    try {
      const { data: row, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (error || !row) { 
        setReady(true); 
        return; 
      }

      setCompany({
        id:                 row.id,
        backendId:          row.id,
        name:               row.name,
        registrationNumber: row.registration_number || '',
        contactPerson:      row.contact_person,
        email:              row.email,
        phone:              row.phone    || '',
        address:            row.address  || '',
        verificationStatus: row.verification_status as VerificationStatus,
      });

      const [tripsRes, bookingsRes] = await Promise.all([
        supabase.from('trips').select('*').eq('vendor_id', row.id).order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, profiles:student_id(first_name, last_name, email, phone, matric, department)').eq('vendor_id', row.id).order('created_at', { ascending: false }),
      ]);

      if (tripsRes.data) {
        setTrips(tripsRes.data.map(t => ({
          id:             t.id,
          origin:         t.origin,
          destination:    t.destination,
          departureDate:  t.departure_date,
          departureTime:  t.departure_time,
          arrivalTime:    t.arrival_time  || '',
          vehicleType:    t.vehicle_type  || '',
          totalSeats:     t.total_seats,
          availableSeats: t.available_seats,
          price:          Number(t.price),
          status:         t.status as Trip['status'],
          createdAt:      t.created_at,
        })));
      }

      if (bookingsRes.data) {
        setVendorBookings(bookingsRes.data.map((b: any) => ({
          id:           b.id,
          tripId:       b.trip_id       || '',
          studentName:  b.profiles ? `${b.profiles.first_name} ${b.profiles.last_name}` : 'Unknown',
          studentEmail: b.profiles?.email || '',
          studentPhone: b.profiles?.phone || '',
          studentMatric: b.profiles?.matric || '',
          studentDept:  b.profiles?.department || '',
          route:        b.route,
          date:         b.date,
          seat:         b.seat          || '',
          amount:       Number(b.price_num || 0),
          status:       b.status as VendorBooking['status'],
          ref:          b.ref,
          createdAt:    b.created_at,
        })));
      }
    } catch (err) {
      console.error('Error fetching vendor data:', err);
    } finally {
      setReady(true);
    }
  }, []);

  /* ── Auth state listener ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchVendorData(session.user.id);
      } else {
        setReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetchVendorData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCompany(null);
        setTrips([]);
        setVendorBookings([]);
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchVendorData]);

  /* ── Real-time subscription: auto-unlock dashboard when admin approves ── */
  useEffect(() => {
    if (!company?.id) return;

    const channel = supabase
      .channel(`vendor-status:${company.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vendors', filter: `id=eq.${company.id}` },
        (payload) => {
          const newStatus = payload.new.verification_status as VerificationStatus;
          setCompany(prev => prev ? { ...prev, verificationStatus: newStatus } : prev);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [company?.id]);

  /* vendorLogin is called right after Supabase signUp to show the pending screen
     before the auth state change event fires */
  const vendorLogin = useCallback((c: Company) => {
    setCompany(c);
  }, []);

  const vendorLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setCompany(null);
    setTrips([]);
    setVendorBookings([]);
  }, []);

  const updateCompany = useCallback(async (c: Company) => {
    setCompany(c);
    if (c.id) {
      await supabase.from('vendors').update({
        name:                c.name,
        registration_number: c.registrationNumber || null,
        contact_person:      c.contactPerson,
        phone:               c.phone    || null,
        address:             c.address  || null,
      }).eq('id', c.id);
    }
  }, []);

  const checkApprovalStatus = useCallback(async () => {
    if (!company?.id) return;
    const { data } = await supabase
      .from('vendors')
      .select('verification_status')
      .eq('id', company.id)
      .single();
    if (data && data.verification_status !== company.verificationStatus) {
      setCompany(prev => prev ? { ...prev, verificationStatus: data.verification_status as VerificationStatus } : prev);
    }
  }, [company]);

  const addTrip = useCallback(async (t: Trip) => {
    if (!company?.id) {
      console.error('Cannot add trip: No company ID found in context.', { company });
      throw new Error('Your session is still loading or your account profile is missing. Please refresh the page and try again.');
    }
    
    console.log('Attempting to add trip for company:', company.id, t);
    
    const { data: inserted, error } = await supabase.from('trips').insert([{
      vendor_id:       company.id,
      origin:          t.origin,
      destination:     t.destination,
      departure_date:  t.departureDate,
      departure_time:  t.departureTime,
      arrival_time:    t.arrivalTime  || null,
      vehicle_type:    t.vehicleType  || null,
      total_seats:     t.totalSeats,
      available_seats: t.availableSeats,
      price:           t.price,
      status:          t.status,
    }]).select().single();

    if (error) {
      console.error('Supabase error adding trip:', error);
      throw new Error(error.message);
    }

    if (inserted) {
      console.log('Trip added successfully:', inserted);
      setTrips(prev => [{ ...t, id: inserted.id, createdAt: inserted.created_at }, ...prev]);
    }
  }, [company]);

  const cancelTrip = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('trips').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
      setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' as const } : t));
    } catch (err: any) {
      console.error('Cancellation failed:', err);
      alert('Failed to cancel trip: ' + (err.message || 'Unknown error'));
    }
  }, []);

  const confirmBooking = useCallback(async (id: string) => {
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id);
    setVendorBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' as const } : b));
  }, []);

  const cancelVendorBooking = useCallback(async (id: string) => {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    setVendorBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
  }, []);

  if (!ready) return null;

  return (
    <VendorContext.Provider value={{
      company, trips, vendorBookings,
      isVendorAuth: !!company,
      vendorLogin, vendorLogout, updateCompany, checkApprovalStatus,
      addTrip, cancelTrip, confirmBooking, cancelVendorBooking,
    }}>
      {children}
    </VendorContext.Provider>
  );
}

export const useVendor = () => useContext(VendorContext);
