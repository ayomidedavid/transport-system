create table public.bookings (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references auth.users on delete cascade not null,
  trip_id      uuid references public.trips on delete set null,
  vendor_id    uuid references public.vendors on delete set null,
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
  on public.bookings for select
  using (auth.uid() = student_id);

create policy "bookings: student insert"
  on public.bookings for insert
  with check (auth.uid() = student_id);

create policy "bookings: student cancel"
  on public.bookings for update
  using (auth.uid() = student_id);

create policy "bookings: vendor read own trips"
  on public.bookings for select
  using (
    exists (select 1 from public.vendors where id = vendor_id and owner_id = auth.uid())
  );

create policy "bookings: vendor update status"
  on public.bookings for update
  using (
    exists (select 1 from public.vendors where id = vendor_id and owner_id = auth.uid())
  );

create policy "bookings: admin all"
  on public.bookings for all
  using (public.is_admin());
