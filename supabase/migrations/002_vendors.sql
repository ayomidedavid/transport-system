create table public.vendors (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid references auth.users on delete cascade not null,
  name                text not null,
  registration_number text,
  contact_person      text not null,
  email               text not null unique,
  phone               text,
  address             text,
  verification_status text not null default 'pending'
                      check (verification_status in ('pending', 'approved', 'rejected')),
  rejection_reason    text,
  total_trips         int     not null default 0,
  total_bookings      int     not null default 0,
  total_revenue       numeric not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.vendors enable row level security;

create policy "vendors: owner all"
  on public.vendors for all
  using (auth.uid() = owner_id);

create policy "vendors: approved public read"
  on public.vendors for select
  using (verification_status = 'approved');

create policy "vendors: admin all"
  on public.vendors for all
  using (public.is_admin());
