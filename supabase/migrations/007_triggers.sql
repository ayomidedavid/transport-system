-- 1. Create profile row when a new user signs up (exception-safe)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name',  ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Auto-stamp updated_at on profiles and vendors

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger vendors_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();


-- 3. Keep available_seats accurate

create or replace function public.handle_booking_seats()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' and new.status != 'cancelled' and new.trip_id is not null then
    update public.trips
    set    available_seats = available_seats - 1
    where  id = new.trip_id and available_seats > 0;

  elsif TG_OP = 'UPDATE'
    and old.status != 'cancelled'
    and new.status  = 'cancelled'
    and new.trip_id is not null
  then
    update public.trips
    set    available_seats = available_seats + 1
    where  id = new.trip_id;
  end if;
  return new;
end;
$$;

create trigger booking_seat_counter
  after insert or update on public.bookings
  for each row execute function public.handle_booking_seats();


-- 4. Keep vendor revenue and booking totals accurate

create or replace function public.handle_vendor_booking_totals()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' and new.status != 'cancelled' and new.vendor_id is not null then
    update public.vendors
    set    total_bookings = total_bookings + 1,
           total_revenue  = total_revenue  + coalesce(new.price_num, 0)
    where  id = new.vendor_id;

  elsif TG_OP = 'UPDATE'
    and old.status != 'cancelled'
    and new.status  = 'cancelled'
    and new.vendor_id is not null
  then
    update public.vendors
    set    total_bookings = greatest(total_bookings - 1, 0),
           total_revenue  = greatest(total_revenue  - coalesce(new.price_num, 0), 0)
    where  id = new.vendor_id;
  end if;
  return new;
end;
$$;

create trigger vendor_booking_totals
  after insert or update on public.bookings
  for each row execute function public.handle_vendor_booking_totals();
