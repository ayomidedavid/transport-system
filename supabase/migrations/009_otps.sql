create table public.otps (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  code       text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.otps enable row level security;

-- Only the service role (backend) can touch this table.
-- No anon or authenticated access needed.
create policy "otps: service role only"
  on public.otps for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists idx_otps_email   on public.otps(email);
create index if not exists idx_otps_expires on public.otps(expires_at);
