-- ════════════════════════════════════════════════════════════
--  UNIRIDE — Supabase Schema
--  Paste into: Supabase Dashboard → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

-- ── Profiles ─────────────────────────────────────────────────
-- Auto-populated via trigger on auth.users insert.
-- role: 'student' | 'vendor' | 'admin'
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  first_name  text not null default '',
  last_name   text not null default '',
  phone       text,
  matric      text,
  department  text,
  student_id  text,
  role        text not null default 'student'
              check (role in ('student', 'vendor', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner read"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update using (auth.uid() = id);

create policy "profiles: admin read all"
  on public.profiles for select using (
    exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin')
  );

-- ── Vendors ──────────────────────────────────────────────────
create table public.vendors (
  id                   uuid default gen_random_uuid() primary key,
  owner_id             uuid references auth.users on delete cascade not null,
  name                 text not null,
  registration_number  text,
  contact_person       text not null,
  email                text not null unique,
  phone                text,
  address              text,
  verification_status  text not null default 'pending'
                       check (verification_status in ('pending', 'approved', 'rejected')),
  rejection_reason     text,
  total_trips          int     not null default 0,
  total_bookings       int     not null default 0,
  total_revenue        numeric not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.vendors enable row level security;

create policy "vendors: owner read/update"
  on public.vendors for all using (auth.uid() = owner_id);

-- Approved vendors are readable by authenticated students (for browse)
create policy "vendors: approved public read"
  on public.vendors for select using (verification_status = 'approved');

create policy "vendors: admin full"
  on public.vendors for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── Trips ────────────────────────────────────────────────────
create table public.trips (
  id              uuid default gen_random_uuid() primary key,
  vendor_id       uuid references public.vendors on delete cascade not null,
  origin          text not null,
  destination     text not null,
  departure_date  date not null,
  departure_time  text not null,
  arrival_time    text,
  vehicle_type    text,
  total_seats     int     not null,
  available_seats int     not null,
  price           numeric not null,
  status          text    not null default 'active'
                  check (status in ('active', 'completed', 'cancelled')),
  created_at      timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "trips: public read active"
  on public.trips for select using (status = 'active');

create policy "trips: vendor manage own"
  on public.trips for all using (
    exists (select 1 from public.vendors where id = vendor_id and owner_id = auth.uid())
  );

create policy "trips: admin full"
  on public.trips for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── Bookings ─────────────────────────────────────────────────
create table public.bookings (
  id           uuid default gen_random_uuid() primary key,
  student_id   uuid references auth.users on delete cascade not null,
  trip_id      uuid references public.trips on delete set null,
  vendor_id    uuid references public.vendors,
  route        text not null,
  company      text not null,
  destination  text not null,
  vehicle_type text,
  status       text not null default 'pending'
               check (status in ('confirmed', 'pending', 'cancelled', 'completed')),
  date         text not null,
  time         text,
  pickup       text,
  seat         text,
  ref          text not null unique,
  amount       text,
  price_num    numeric,
  created_at   timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "bookings: student read own"
  on public.bookings for select using (auth.uid() = student_id);

create policy "bookings: student insert"
  on public.bookings for insert with check (auth.uid() = student_id);

create policy "bookings: student cancel"
  on public.bookings for update using (auth.uid() = student_id);

create policy "bookings: vendor read own"
  on public.bookings for select using (
    exists (select 1 from public.vendors where id = vendor_id and owner_id = auth.uid())
  );

create policy "bookings: vendor update status"
  on public.bookings for update using (
    exists (select 1 from public.vendors where id = vendor_id and owner_id = auth.uid())
  );

create policy "bookings: admin full"
  on public.bookings for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── Notifications ─────────────────────────────────────────────
-- recipient_role = 'admin'  → shown in admin notification bell
-- recipient_role = 'vendor' → shown to the specific vendor (recipient_id required)
-- recipient_role = 'student'→ shown to the specific student (recipient_id required)
create table public.notifications (
  id             uuid default gen_random_uuid() primary key,
  type           text not null
                 check (type in ('booking', 'payment', 'user', 'vendor', 'alert')),
  title          text not null,
  body           text not null,
  read           boolean not null default false,
  recipient_role text not null
                 check (recipient_role in ('admin', 'vendor', 'student')),
  recipient_id   uuid references auth.users on delete cascade,
  booking_ref    text,
  agency         text,
  agency_email   text,
  route          text,
  amount         text,
  created_at     timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications: recipient read"
  on public.notifications for select using (
    recipient_id = auth.uid()
    or (
      recipient_role = 'admin'
      and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

create policy "notifications: insert authenticated"
  on public.notifications for insert with check (auth.role() = 'authenticated');

create policy "notifications: update own"
  on public.notifications for update using (
    recipient_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "notifications: delete own"
  on public.notifications for delete using (
    recipient_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── Transactions ──────────────────────────────────────────────
create table public.transactions (
  id           uuid default gen_random_uuid() primary key,
  booking_id   uuid references public.bookings on delete set null,
  student_id   uuid references auth.users,
  vendor_id    uuid references public.vendors,
  ref          text not null unique,
  student_name text,
  vendor_name  text,
  route        text,
  amount       numeric not null,
  type         text not null check (type in ('booking', 'refund')),
  status       text not null default 'pending'
               check (status in ('successful', 'pending', 'failed')),
  paystack_ref text,
  created_at   timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions: student read own"
  on public.transactions for select using (auth.uid() = student_id);

create policy "transactions: vendor read own"
  on public.transactions for select using (
    exists (select 1 from public.vendors where id = vendor_id and owner_id = auth.uid())
  );

create policy "transactions: admin full"
  on public.transactions for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "transactions: insert authenticated"
  on public.transactions for insert with check (auth.role() = 'authenticated');


-- ── OTPS ─────────────────────────────────────────────────────
create table public.otps (
  id          uuid default gen_random_uuid() primary key,
  email       text not null,
  code        text not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table public.otps enable row level security;
-- No public policies needed as it's accessed via service role.

-- ════════════════════════════════════════════════════════════
--  FUNCTIONS & TRIGGERS
-- ════════════════════════════════════════════════════════════

-- 1. Auto-create profile row when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role, phone, matric, department, student_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name',  ''),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'matric',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'student_id'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Auto-stamp updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger vendors_updated_at before update on public.vendors
  for each row execute procedure public.set_updated_at();

-- 3. Decrement available_seats on booking insert; restore on cancellation
create or replace function public.handle_booking_seats()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' and new.status != 'cancelled' and new.trip_id is not null then
    update public.trips set available_seats = available_seats - 1
    where id = new.trip_id and available_seats > 0;

  elsif TG_OP = 'UPDATE'
    and old.status != 'cancelled'
    and new.status  = 'cancelled'
    and new.trip_id is not null
  then
    update public.trips set available_seats = available_seats + 1
    where id = new.trip_id;
  end if;
  return new;
end;
$$;

create trigger booking_seat_counter
  after insert or update on public.bookings
  for each row execute procedure public.handle_booking_seats();

-- ════════════════════════════════════════════════════════════
--  INDEXES
-- ════════════════════════════════════════════════════════════
create index idx_bookings_student   on public.bookings(student_id);
create index idx_bookings_vendor    on public.bookings(vendor_id);
create index idx_bookings_trip      on public.bookings(trip_id);
create index idx_trips_vendor       on public.trips(vendor_id);
create index idx_trips_status       on public.trips(status);
create index idx_trips_date         on public.trips(departure_date);
create index idx_notifs_recipient   on public.notifications(recipient_id);
create index idx_notifs_role        on public.notifications(recipient_role);
create index idx_txns_student       on public.transactions(student_id);
create index idx_vendors_owner      on public.vendors(owner_id);
create index idx_vendors_vstatus    on public.vendors(verification_status);
create index idx_otps_email_code     on public.otps(email, code);

-- ════════════════════════════════════════════════════════════
--  ADMIN USER SETUP
--  Run AFTER creating the admin account in Supabase Auth:
--    Auth → Users → Invite user → admin@uniride.ng
--  Then paste this (replace the UUID):
-- ════════════════════════════════════════════════════════════
-- update public.profiles set role = 'admin' where email = 'admin@uniride.ng';
