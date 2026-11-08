# ЦагАв — Цаг захиалгын мобайл апп

SWM231 Mobile Programming · Бие даалтын төсөл · Ганболор

## Асуудал
Улаанбаатарт салон, шүдний эмнэлэг, спорт заал, спа-д цаг авахын тулд утсаар залгах,
мессеж бичих, хариу хүлээх шаардлагатай байдаг. Ажлын цагаас гадуур цаг авах боломжгүй,
давхар захиалга, мартагдсан цаг их гардаг.

## Шийдэл
**ЦагАв** — нэг апп-аас газраа хайж, үйлчилгээ, ажилтан, чөлөөтэй цагаа сонгоод
захиалж, урьдчилгаа төлбөрөө төлөх боломжтой. Сул цагууд бодит хугацаанд харагдах тул
давхар захиалга гарахгүй.

## Хэрэглэгчийн төрөл
| Төрөл | Боломж |
|---|---|
| Зочин | Газрууд үзэх, хайх, ангиллаар шүүх, эрэмбэлэх |
| Хэрэглэгч | Бүртгүүлэх/нэвтрэх, цаг захиалах, захиалгаа засах/цуцлах/устгах, профайл зураг, дуртай газар |
| Админ | Статистик, газар/үйлчилгээ/ажилтан нэмэх-засах-устгах, захиалгын төлөв өөрчлөх |

## Технологи
- **React Native (Expo) + Expo Router** — Stack + Tab навигаци, хамгаалалттай дэлгэц
- **Supabase** — Auth, PostgreSQL (9 хүснэгт), Storage (зураг), RLS
- **expo-secure-store** — нэвтрэлтийн session-ийг утсан дээр шифрлэж хадгална
- **expo-image-picker** — камер/цомгоос зураг, шахалт (quality 0.5)
- Хамгаалалт-2: QPay sandbox + Edge Function webhook, Expo push notification, EAS Build

## Өгөгдлийн сан (ERD)
ERD (Figma): https://www.figma.com/board/o3NAkle0kjYofWDc8nlskx

| Хүснэгт | Холбоо |
|---|---|
| profiles | auth.users 1:1 |
| categories → businesses | 1:N |
| businesses → services, staff | 1:N |
| staff ↔ services (`staff_services`) | **N:M** |
| profiles ↔ businesses (`favorites`) | **N:M** |
| profiles / businesses / services → bookings | 1:N |
| bookings → payments | 1:N |

**RLS:** бүх 9 хүснэгтэд асаалттай. Каталогийг (газар, үйлчилгээ, ажилтан) хүн бүр уншина,
зөвхөн админ өөрчилнө. Захиалга, дуртай, профайлыг хэрэглэгч зөвхөн өөрийнхийг харж/өөрчилнө.
Trigger-ээр: хэрэглэгч өөрийгөө админ болгох, захиалгаа "paid" болгохыг хориглосон.

## Ажиллуулах заавар
```bash
# 1. Хамаарлууд
npm install

# 2. .env үүсгэх
cp .env.example .env      # Windows: copy .env.example .env
# .env дотор Supabase URL болон anon түлхүүрээ бичнэ

# 3. Supabase SQL Editor дээр дарааллаар нь ажиллуулна
#    supabase/schema.sql  → supabase/seed.sql

# 4. Ажиллуулах (утсан дээрх Expo Go-оор QR уншуулна)
npx expo start
```

**Supabase тохиргоо:** Authentication → Sign In / Providers → Email → *Confirm email*-ийг
унтраавал бүртгүүлмэгц шууд нэвтэрнэ (demo-д тохиромжтой).

**Админ эрх:** апп-аар бүртгүүлээд SQL Editor дээр:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'таны@имэйл.mn');
```

## Хавтасны бүтэц
```
app/
  _layout.tsx            Root Stack + AuthProvider
  (tabs)/                Доод таб: Нүүр, Захиалга, Профайл, Админ
  (auth)/                Нэвтрэх, бүртгүүлэх, нууц үг сэргээх
  business/[id].tsx      Газрын дэлгэрэнгүй
  book/[serviceId].tsx   Цаг сонгож захиалах
  booking/[id].tsx       Захиалга засах / цуцлах / устгах
  admin/business-form.tsx  Газар + үйлчилгээ + ажилтан CRUD
components/              Button, Input, Chip, BusinessCard, StatusBadge, StateViews
lib/                     supabase client, auth context, theme, format, upload
supabase/                schema.sql, seed.sql
```

## Явц
- [x] Хамгаалалт-1: Auth, DB + RLS, CRUD, хайлт/шүүлт, зураг, админ статистик
- [ ] Хамгаалалт-2: QPay төлбөр + webhook, push мэдэгдэл, offline мэдэгдэл, EAS Build APK
