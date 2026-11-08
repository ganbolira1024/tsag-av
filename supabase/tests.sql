-- =====================================================================
-- ЦагАв: өгөгдлийн сангийн автомат тест (18 шалгалт)
-- Supabase SQL Editor дээр ажиллуулна. Төгсгөлд RAISE хийж бүх өөрчлөлтийг
-- буцаадаг тул туршилтын хэрэглэгч, захиалга DB-д ҮЛДЭХГҮЙ.
-- Үр дүн нь улаан "алдааны" мессеж дотор PASS/FAIL байдлаар харагдана.
-- =====================================================================
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  bk uuid; n int; r text := ''; ok boolean;
  slot timestamptz := date_trunc('hour', now()) + interval '2 day';
  svc uuid := '22222222-0000-0000-0000-000000000001';
  stf uuid := '33333333-0000-0000-0000-000000000001';
  biz uuid := '11111111-0000-0000-0000-000000000001';
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
    values (a, 'test-a@tsagav.test', '{"full_name":"Test A","phone":"99110000"}', 'authenticated', 'authenticated'),
           (b, 'test-b@tsagav.test', '{"full_name":"Test B"}', 'authenticated', 'authenticated');
  select count(*) into n from public.profiles where id in (a, b) and full_name like 'Test%';
  r := r || format(E'\n01 Бүртгэл → profile автоматаар үүснэ: %s', case when n = 2 then 'PASS' else 'FAIL' end);

  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  select count(*) into n from public.businesses;
  r := r || format(E'\n02 Зочин газрууд харна (%s): %s', n, case when n >= 8 then 'PASS' else 'FAIL' end);
  select count(*) into n from public.bookings;
  r := r || format(E'\n03 Зочин захиалга харж чадахгүй: %s', case when n = 0 then 'PASS' else 'FAIL' end);
  execute 'reset role';

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  insert into public.bookings (user_id, business_id, service_id, staff_id, start_at, note)
    values (a, biz, svc, stf, slot, 'тест') returning id into bk;
  select count(*) into n from public.bookings where id = bk;
  r := r || format(E'\n04 Захиалга үүсгэх → DB-д хадгалагдана: %s', case when n = 1 then 'PASS' else 'FAIL' end);
  update public.bookings set note = 'засварласан' where id = bk;
  select count(*) into n from public.bookings where id = bk and note = 'засварласан';
  r := r || format(E'\n05 Тэмдэглэл засах хадгалагдана: %s', case when n = 1 then 'PASS' else 'FAIL' end);
  ok := false; begin update public.bookings set status = 'paid' where id = bk; exception when others then ok := true; end;
  r := r || format(E'\n06 Хэрэглэгч өөрөө "төлсөн" болгож чадахгүй: %s', case when ok then 'PASS' else 'FAIL' end);
  ok := false; begin update public.profiles set role = 'admin' where id = a; exception when others then ok := true; end;
  r := r || format(E'\n07 Хэрэглэгч өөрийгөө админ болгож чадахгүй: %s', case when ok then 'PASS' else 'FAIL' end);
  ok := false; begin insert into public.businesses (category_id, name) values (1, 'Хууль бус'); exception when others then ok := true; end;
  r := r || format(E'\n08 Энгийн хэрэглэгч газар нэмж чадахгүй: %s', case when ok then 'PASS' else 'FAIL' end);
  insert into public.favorites (user_id, business_id) values (a, biz);
  select count(*) into n from public.favorites where user_id = a;
  r := r || format(E'\n09 Дуртай газар хадгалагдана (N:M): %s', case when n = 1 then 'PASS' else 'FAIL' end);

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.bookings where id = bk;
  r := r || format(E'\n10 Өөр хэрэглэгч бусдын захиалгыг харахгүй: %s', case when n = 0 then 'PASS' else 'FAIL' end);
  select count(*) into n from public.taken_slots(stf, slot - interval '1 hour', slot + interval '1 hour');
  r := r || format(E'\n11 Завгүй цаг бусдад харагдана: %s', case when n = 1 then 'PASS' else 'FAIL' end);
  ok := false;
  begin insert into public.bookings (user_id, business_id, service_id, staff_id, start_at) values (b, biz, svc, stf, slot);
  exception when unique_violation then ok := true; end;
  r := r || format(E'\n12 Давхар захиалга орохгүй: %s', case when ok then 'PASS' else 'FAIL' end);
  delete from public.bookings where id = bk;
  execute 'reset role';
  select count(*) into n from public.bookings where id = bk;
  r := r || format(E'\n13 Бусдын захиалгыг устгаж чадахгүй: %s', case when n = 1 then 'PASS' else 'FAIL' end);

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  update public.bookings set status = 'cancelled' where id = bk;
  select count(*) into n from public.bookings where id = bk and status = 'cancelled';
  r := r || format(E'\n14 Захиалгаа цуцлах: %s', case when n = 1 then 'PASS' else 'FAIL' end);
  delete from public.bookings where id = bk;
  execute 'reset role';
  select count(*) into n from public.bookings where id = bk;
  r := r || format(E'\n15 Захиалгаа устгах: %s', case when n = 0 then 'PASS' else 'FAIL' end);

  perform set_config('request.jwt.claims', '', true);
  ok := true; begin update public.profiles set role = 'admin' where id = b; exception when others then ok := false; end;
  r := r || format(E'\n16 SQL Editor-оос админ болгож болно: %s', case when ok then 'PASS' else 'FAIL' end);

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  insert into public.businesses (category_id, name) values (1, 'Админы тест газар');
  select count(*) into n from public.businesses where name = 'Админы тест газар';
  r := r || format(E'\n17 Админ газар нэмж чадна: %s', case when n = 1 then 'PASS' else 'FAIL' end);
  select count(*) into n from public.profiles;
  r := r || format(E'\n18 Админ бүх хэрэглэгчийг харна: %s', case when n >= 2 then 'PASS' else 'FAIL' end);
  execute 'reset role';

  raise exception 'ТЕСТИЙН ҮР ДҮН (бүгд буцаагдсан):%', r;
end $$;
