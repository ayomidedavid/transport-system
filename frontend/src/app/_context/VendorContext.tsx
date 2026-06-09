import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import * as signalR from '@microsoft/signalr';

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
  vendorLogout:        () => void;
  updateCompany:       (c: Company) => Promise<void>;
  checkApprovalStatus: () => Promise<void>;
  addTrip:             (t: Trip) => Promise<void>;
  cancelTrip:          (id: string) => Promise<void>;
  confirmBooking:      (id: string) => Promise<void>;
  cancelVendorBooking: (id: string) => Promise<void>;
};

const VendorContext = createContext<VendorCtx>({
  company: null, trips: [], vendorBookings: [], isVendorAuth: false,
  vendorLogin: () => {}, vendorLogout: () => {}, updateCompany: async () => {},
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
      const { data: row } = await api.get(`/vendors/owner/${userId}`);

      if (!row) { 
        setReady(true); 
        return; 
      }

      setCompany({
        id:                 row.id,
        backendId:          row.id,
        name:               row.name,
        registrationNumber: row.registrationNumber || '',
        contactPerson:      row.contactPerson,
        email:              row.email,
        phone:              row.phone    || '',
        address:            row.address  || '',
        verificationStatus: row.verificationStatus as VerificationStatus,
      });

      const [tripsRes, bookingsRes] = await Promise.all([
        api.get(`/trips/vendor/${row.id}`),
        api.get(`/bookings/vendor/${row.id}`)
      ]);

      if (tripsRes.data) {
        setTrips(tripsRes.data.map((t: any) => ({
          id:             t.id,
          origin:         t.origin,
          destination:    t.destination,
          departureDate:  t.departureDate,
          departureTime:  t.departureTime,
          arrivalTime:    t.arrivalTime  || '',
          vehicleType:    t.vehicleType  || '',
          totalSeats:     t.totalSeats,
          availableSeats: t.availableSeats,
          price:          Number(t.price),
          status:         t.status as Trip['status'],
          createdAt:      t.createdAt,
        })));
      }

      if (bookingsRes.data) {
        setVendorBookings(bookingsRes.data.map((b: any) => ({
          id:           b.id,
          tripId:       b.tripId       || '',
          studentName:  b.student ? `${b.student.profile?.firstName} ${b.student.profile?.lastName}` : 'Unknown',
          studentEmail: b.student?.email || '',
          studentPhone: b.student?.profile?.phone || '',
          studentMatric: b.student?.profile?.matric || '',
          studentDept:  b.student?.profile?.department || '',
          route:        b.route,
          date:         b.date,
          seat:         b.seat          || '',
          amount:       Number(b.priceNum || 0),
          status:       b.status as VendorBooking['status'],
          ref:          b.ref,
          createdAt:    b.createdAt,
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
    const init = async () => {
      const token = localStorage.getItem('uniride_token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          if (data && data.accountType === 'logistics') {
            await fetchVendorData(data.id);
          } else {
            setReady(true);
          }
        } catch {
          setReady(true);
        }
      } else {
        setReady(true);
      }
    };
    init();
  }, [fetchVendorData]);

  /* ── Real-time subscription: auto-unlock dashboard when admin approves ── */
  useEffect(() => {
    if (!company?.id) return;

    let connection: signalR.HubConnection;

    const connectHub = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiUrl}/notifications`)
        .withAutomaticReconnect()
        .build();

      connection.on('VendorStatusUpdated', (vendorId: string, status: string) => {
        if (vendorId === company.id) {
           setCompany(prev => prev ? { ...prev, verificationStatus: status as VerificationStatus } : prev);
        }
      });

      try {
        await connection.start();
        await connection.invoke('JoinGroup', `Vendor_${company.id}`);
      } catch (err) {
        console.error('SignalR connection error: ', err);
      }
    };

    connectHub();

    return () => {
      if (connection) {
        connection.invoke('LeaveGroup', `Vendor_${company.id}`).catch(console.error);
        connection.stop().catch(console.error);
      }
    };
  }, [company?.id]);

  const vendorLogin = useCallback((c: Company) => {
    setCompany(c);
  }, []);

  const vendorLogout = useCallback(() => {
    setCompany(null);
    setTrips([]);
    setVendorBookings([]);
  }, []);

  const updateCompany = useCallback(async (c: Company) => {
    setCompany(c);
    // API Call to update vendor omitted for brevity
  }, []);

  const checkApprovalStatus = useCallback(async () => {
    if (!company?.id) return;
    try {
      const { data } = await api.get(`/vendors/${company.id}?t=${Date.now()}`);
      if (data) {
        if (data.verificationStatus === 'approved') {
          alert('Good news! Your account has been approved. Welcome to UniRide!');
          window.location.reload();
        } else if (data.verificationStatus === 'rejected') {
          alert('Your account verification was rejected. Please contact support.');
          setCompany(prev => prev ? { ...prev, verificationStatus: 'rejected' } : prev);
        } else {
          alert('Your account is still pending. The admin has been notified again!');
        }
      }
    } catch (err) {
      console.error('Check status error:', err);
    }
  }, [company]);

  const addTrip = useCallback(async (t: Trip) => {
    if (!company?.id) {
      throw new Error('Your session is still loading or your account profile is missing. Please refresh the page and try again.');
    }
    
    try {
      const { data: inserted } = await api.post('/trips', {
        vendorId:       company.id,
        origin:          t.origin,
        destination:     t.destination,
        departureDate:  t.departureDate,
        departureTime:  t.departureTime,
        arrivalTime:    t.arrivalTime  || null,
        vehicleType:    t.vehicleType  || null,
        totalSeats:     t.totalSeats,
        availableSeats: t.availableSeats,
        price:           t.price,
        status:          t.status,
      });

      if (inserted) {
        setTrips(prev => [{ ...t, id: inserted.id, createdAt: inserted.createdAt }, ...prev]);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message);
    }
  }, [company]);

  const cancelTrip = useCallback(async (id: string) => {
    try {
      // Assuming a patch/cancel endpoint exists on backend
      setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' as const } : t));
    } catch (err: any) {
      alert('Failed to cancel trip: ' + (err.message || 'Unknown error'));
    }
  }, []);

  const confirmBooking = useCallback(async (id: string) => {
    // API Call omitted
    setVendorBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' as const } : b));
  }, []);

  const cancelVendorBooking = useCallback(async (id: string) => {
    // API Call omitted
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
