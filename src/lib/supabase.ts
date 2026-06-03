import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[UNIRIDE] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/* ─────────────────────────────────────────
   Row types — mirror schema.sql exactly
───────────────────────────────────────── */

export type Profile = {
  id: string; email: string;
  first_name: string; last_name: string;
  phone: string | null; matric: string | null;
  department: string | null; student_id: string | null;
  role: 'student' | 'vendor' | 'admin';
  created_at: string; updated_at: string;
};

export type VendorRow = {
  id: string; owner_id: string;
  name: string; registration_number: string | null;
  contact_person: string; email: string;
  phone: string | null; address: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  total_trips: number; total_bookings: number; total_revenue: number;
  created_at: string; updated_at: string;
};

export type TripRow = {
  id: string; vendor_id: string;
  origin: string; destination: string;
  departure_date: string; departure_time: string; arrival_time: string | null;
  vehicle_type: string | null;
  total_seats: number; available_seats: number; price: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
};

export type BookingRow = {
  id: string; student_id: string;
  trip_id: string | null; vendor_id: string | null;
  route: string; company: string; destination: string;
  vehicle_type: string | null;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  date: string; time: string | null; pickup: string | null; seat: string | null;
  ref: string; amount: string | null; price_num: number | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  type: 'booking' | 'payment' | 'user' | 'vendor' | 'alert';
  title: string; body: string; read: boolean;
  recipient_role: 'admin' | 'vendor' | 'student';
  recipient_id: string | null;
  booking_ref: string | null; agency: string | null;
  agency_email: string | null; route: string | null; amount: string | null;
  created_at: string;
};

export type TransactionRow = {
  id: string; booking_id: string | null;
  student_id: string | null; vendor_id: string | null;
  ref: string; student_name: string | null; vendor_name: string | null;
  route: string | null; amount: number;
  type: 'booking' | 'refund';
  status: 'successful' | 'pending' | 'failed';
  paystack_ref: string | null; created_at: string;
};
