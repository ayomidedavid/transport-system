-- Run this to wipe everything and start fresh.
-- Then run 001 through 009 in order.

-- Triggers
drop trigger if exists on_auth_user_created          on auth.users;
drop trigger if exists on_auth_user_created_notify_admin on auth.users;
drop trigger if exists on_user_auto_confirm          on auth.users;
drop trigger if exists on_vendor_auto_confirm        on auth.users;
drop trigger if exists profiles_updated_at           on public.profiles;
drop trigger if exists vendors_updated_at            on public.vendors;
drop trigger if exists booking_seat_counter          on public.bookings;
drop trigger if exists vendor_booking_totals         on public.bookings;

-- Functions
drop function if exists public.handle_new_user()              cascade;
drop function if exists public.notify_admin_new_user()        cascade;
drop function if exists public.auto_confirm_user_email()      cascade;
drop function if exists public.auto_confirm_vendor_email()    cascade;
drop function if exists public.set_updated_at()               cascade;
drop function if exists public.handle_booking_seats()         cascade;
drop function if exists public.handle_vendor_booking_totals() cascade;
drop function if exists public.is_admin()                     cascade;

-- Tables (reverse dependency order)
drop table if exists public.otps          cascade;
drop table if exists public.transactions  cascade;
drop table if exists public.notifications cascade;
drop table if exists public.bookings      cascade;
drop table if exists public.trips         cascade;
drop table if exists public.vendors       cascade;
drop table if exists public.profiles      cascade;
