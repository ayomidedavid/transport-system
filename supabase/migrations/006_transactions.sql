create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid references public.bookings on delete set null,
  student_id   uuid references auth.users on delete set null,
  vendor_id    uuid references public.vendors on delete set null,
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
  on public.transactions for select
  using (auth.uid() = student_id);

create policy "transactions: vendor read own"
  on public.transactions for select
  using (
    exists (select 1 from public.vendors where id = vendor_id and owner_id = auth.uid())
  );

create policy "transactions: insert authenticated"
  on public.transactions for insert
  with check (auth.role() = 'authenticated');

create policy "transactions: admin all"
  on public.transactions for all
  using (public.is_admin());
