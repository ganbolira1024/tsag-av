# Setup — do these in order (about 20 min)

## 1. Put the code into your Expo project
In your `tsag-av` project folder (made with `create-expo-app`):
1. **Delete** these template folders: `app`, `components`, `hooks`, `constants`, `scripts`
2. **Copy** everything from this zip into the folder (app, components, lib, supabase, README.md, SETUP.md, commit-steps.bat). Replace README.md if asked.

## 2. Supabase database
1. Supabase → your project → **SQL Editor** → New query
2. Paste all of `supabase/schema.sql` → **Run** (should say "Success")
3. New query → paste `supabase/seed.sql` → **Run**
4. **Authentication → Sign In / Providers → Email** → turn **OFF** "Confirm email" → Save
   (so new users can log in immediately in the demo)

## 3. .env file
Create a new file named `.env` in the project folder with:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon / publishable key)
```
Never the service_role / secret key.

## 4. Run it
```
npx expo start -c
```
Scan the QR with **Expo Go** on your phone (same Wi-Fi as the PC).
If it doesn't connect: `npx expo start -c --tunnel`

## 5. Make yourself admin
1. In the app: **Профайл → Бүртгүүлэх**, register with your email
2. Supabase SQL Editor:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```
3. Log out and log in again (or reload the app) → the **Админ** tab appears.
Make a second normal account too, for the demo.

## 6. Commit and push
Double-click `commit-steps.bat` (or run it in the terminal inside the folder).
It makes 9 separate commits, one per feature, then pushes.

## Demo order for Хамгаалалт-1 (3 min)
1. Open as **guest** → search "салон", filter by category, scroll, pull to refresh
2. Register / log in
3. Open a business → Захиалах → choose staff, day, time → confirm
4. Захиалга tab → open it → edit note → cancel (confirm dialog)
5. Профайл → tap photo → camera → preview → Хадгалах
6. Log in as **admin** → Админ tab: stats, add a business with photo, add a service + staff
7. Show Supabase **Table Editor**: the new rows are really there
