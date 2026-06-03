create table public.trips (
  id              uuid primary key default gen_random_uuid(),
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
  status          text not null default 'active'
                  check (status in ('active', 'completed', 'cancelled')),
  created_at      timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "trips: public read active"
  on public.trips for select
  using (status = 'active');

create policy "trips: vendor manage own"
  on public.trips for all
  using (
    exists (select 1 from public.vendors where id = vendor_id and owner_id = auth.uid())
  );

create policy "trips: admin all"
  on public.trips for all
  using (public.is_admin());
