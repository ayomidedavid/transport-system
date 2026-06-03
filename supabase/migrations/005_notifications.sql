create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
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

create policy "notifications: read own or admin"
  on public.notifications for select
  using (
    recipient_id = auth.uid()
    or (recipient_role = 'admin' and public.is_admin())
  );

create policy "notifications: insert authenticated"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');

create policy "notifications: update own or admin"
  on public.notifications for update
  using (
    recipient_id = auth.uid()
    or public.is_admin()
  );

create policy "notifications: delete own or admin"
  on public.notifications for delete
  using (
    recipient_id = auth.uid()
    or public.is_admin()
  );
