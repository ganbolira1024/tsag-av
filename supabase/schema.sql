-- =====================================================================
-- ЦагАв — Цаг захиалгын апп · Supabase өгөгдлийн сан
-- Supabase → SQL Editor → New query → энэ файлыг бүтнээр нь paste → Run
-- =====================================================================

-- ---------- 1. ХҮСНЭГТҮҮД ----------

-- 1) profiles: auth.users-тэй 1:1. Хэрэглэгчийн нэр, утас, эрх (role)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

-- 2) categories: Салон, Эмнэлэг, Спорт заал ...
create table public.categories (
  id    serial primary key,
  name  text not null unique,
  icon  text not null default '📍'
);

-- 3) businesses: цаг өгдөг газар. categories 1:N businesses
create table public.businesses (
  id           uuid primary key default gen_random_uuid(),
  category_id  int  not null references public.categories(id),
  name         text not null,
  description  text,
  address      text,
  phone        text,
  image_url    text,
  open_hour    int  not null default 9  check (open_hour between 0 and 23),
  close_hour   int  not null default 20 check (close_hour between 1 and 24),
  created_at   timestamptz not null default now()
);

-- 4) services: үйлчилгээ (үс засалт, шүдний үзлэг ...). businesses 1:N services
create table public.services (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  name          text not null,
  price         int  not null check (price >= 0),
  duration_min  int  not null default 60 check (duration_min > 0),
  created_at    timestamptz not null default now()
);

-- 5) staff: ажилтан (үсчин, эмч, дасгалжуулагч). businesses 1:N staff
create table public.staff (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  title        text,
  photo_url    text
);

-- 6) staff_services: аль ажилтан аль үйлчилгээг хийдэг вэ — N:M холбоо
create table public.staff_services (
  staff_id    uuid not null references public.staff(id) on delete cascade,
  service_id  uuid not null references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- 7) bookings: захиалга. profiles 1:N bookings
create table public.bookings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  business_id  uuid not null references public.businesses(id) on delete cascade,
  service_id   uuid not null references public.services(id),
  staff_id     uuid references public.staff(id),
  start_at     timestamptz not null,
  note         text,
  status       text not null default 'pending'
               check (status in ('pending', 'paid', 'cancelled', 'completed')),
  created_at   timestamptz not null default now()
);
-- Нэг ажилтанд нэг цагт давхар захиалга орохоос сэргийлнэ (цуцлагдсанаас бусад)
create unique index bookings_no_double
  on public.bookings (staff_id, start_at) where status <> 'cancelled';

-- 8) payments: төлбөр (Хамгаалалт-2-т QPay/Stripe webhook энд бичнэ). bookings 1:N payments
create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  amount      int  not null check (amount >= 0),
  provider    text not null default 'qpay',
  invoice_id  text,
  status      text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at  timestamptz not null default now()
);

-- 9) favorites: хэрэглэгч ↔ газар — N:M холбоо
create table public.favorites (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  business_id  uuid not null references public.businesses(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, business_id)
);

-- ---------- 2. ТУСЛАХ ФУНКЦ, TRIGGER ----------

-- Одоогийн хэрэглэгч админ эсэх. security definer → RLS-ээр гацахгүй
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Тухайн ажилтны завгүй цагууд. Хэрэглэгч бусдын захиалгыг RLS-ээр харж чадахгүй
-- тул зөвхөн цагийг нь (хэн захиалсныг биш) буцаадаг функц
create or replace function public.taken_slots(p_staff uuid, p_from timestamptz, p_to timestamptz)
returns setof timestamptz language sql stable security definer set search_path = public as $$
  select start_at from public.bookings
  where staff_id = p_staff and status <> 'cancelled'
    and start_at >= p_from and start_at < p_to;
$$;

-- Шинэ хэрэглэгч бүртгүүлэхэд profiles мөр автоматаар үүснэ
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Энгийн хэрэглэгч өөрийгөө admin болгож чадахгүй
create or replace function public.protect_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Зөвхөн апп-аас ирсэн хүсэлтэд (anon/authenticated). SQL Editor, service_role чөлөөтэй
  if new.role <> old.role
     and coalesce(auth.role(), '') in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'Эрх өөрчлөх зөвшөөрөлгүй';
  end if;
  return new;
end;
$$;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_role();

-- Энгийн хэрэглэгч захиалгаа "paid" болгож чадахгүй (зөвхөн webhook/админ)
create or replace function public.protect_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- SQL Editor / service_role (Хамгаалалт-2-ын webhook) болон админ чөлөөтэй
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if new.status <> old.status and new.status <> 'cancelled' then
    raise exception 'Зөвхөн цуцлах боломжтой';
  end if;
  return new;
end;
$$;
create trigger bookings_protect_status
  before update on public.bookings
  for each row execute function public.protect_booking_status();

-- ---------- 3. RLS (Row Level Security) ----------
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.businesses     enable row level security;
alter table public.services       enable row level security;
alter table public.staff          enable row level security;
alter table public.staff_services enable row level security;
alter table public.bookings       enable row level security;
alter table public.payments       enable row level security;
alter table public.favorites      enable row level security;

-- profiles: өөрийнхөө мөрийг харах/засах, админ бүгдийг харна
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Нийтийн каталог (categories, businesses, services, staff, staff_services):
-- зочин ч харна, зөвхөн админ өөрчилнө
create policy "categories_read_all"  on public.categories for select using (true);
create policy "categories_admin_all" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "businesses_read_all"  on public.businesses for select using (true);
create policy "businesses_admin_all" on public.businesses for all using (public.is_admin()) with check (public.is_admin());

create policy "services_read_all"  on public.services for select using (true);
create policy "services_admin_all" on public.services for all using (public.is_admin()) with check (public.is_admin());

create policy "staff_read_all"  on public.staff for select using (true);
create policy "staff_admin_all" on public.staff for all using (public.is_admin()) with check (public.is_admin());

create policy "staff_services_read_all"  on public.staff_services for select using (true);
create policy "staff_services_admin_all" on public.staff_services for all using (public.is_admin()) with check (public.is_admin());

-- bookings: хэрэглэгч зөвхөн өөрийнхийгөө
create policy "bookings_select_own" on public.bookings
  for select using (user_id = auth.uid() or public.is_admin());
create policy "bookings_insert_own" on public.bookings
  for insert with check (user_id = auth.uid() and status = 'pending');
create policy "bookings_update_own" on public.bookings
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "bookings_delete_own_pending" on public.bookings
  for delete using ((user_id = auth.uid() and status in ('pending', 'cancelled')) or public.is_admin());

-- payments: өөрийн захиалгын төлбөрийг харна. Бичих эрхийг апп-д өгөхгүй
-- (Хамгаалалт-2: Edge Function service_role-оор бичнэ, тэр нь RLS-ийг алгасна)
create policy "payments_select_own" on public.payments
  for select using (
    public.is_admin() or exists (
      select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()
    )
  );

-- favorites: зөвхөн өөрийнхийгөө
create policy "favorites_own" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- 4. STORAGE (зураг) ----------
insert into storage.buckets (id, name, public) values ('images', 'images', true)
  on conflict (id) do nothing;

-- Хүн бүр зураг харна (public bucket)
create policy "images_read" on storage.objects
  for select using (bucket_id = 'images');
-- Нэвтэрсэн хэрэглэгч зөвхөн өөрийн хавтас руу (avatars/<user_id>/...) хуулна
create policy "images_upload_own_avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = 'avatars'
              and (storage.foldername(name))[2] = auth.uid()::text);
-- Админ businesses/ хавтас руу хуулна
create policy "images_upload_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and public.is_admin());
create policy "images_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and (owner = auth.uid() or public.is_admin()));
create policy "images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (owner = auth.uid() or public.is_admin()));
