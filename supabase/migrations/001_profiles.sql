create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
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

-- ── is_admin() — security definer so it runs as postgres
--    and NEVER causes recursion inside a profiles policy.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

-- Policies
create policy "profiles: owner read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: admin read all"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles: admin update all"
  on public.profiles for update
  using (public.is_admin());
