# Travel Horizon · Kyrgyzstan

A responsive tourism catalogue and booking enquiry site for Kyrgyzstan, built with React, TypeScript, Vite, React Router and Supabase-ready services. The app runs immediately in local demo mode using browser storage.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.
4. Run `npm run build` for a production build.

Bookings and contact enquiries are stored in the current browser's localStorage. Without Supabase credentials the admin login at `/admin/login` is a local preview convenience: any email and a password of at least eight characters will do. With credentials it uses Supabase Auth (see below).

## Admin access

The header's **Sign in** link and the footer's **Admin** link open `/admin/login`, which has Sign in and Sign up tabs. Signing up never grants admin rights by itself: the account sees a "Waiting for approval" screen until it is promoted from a trusted SQL session (Supabase SQL editor):

```sql
insert into public.profiles (id, role)
select id, 'admin' from auth.users where email = 'YOUR_EMAIL'
on conflict (id) do update set role = 'admin';
```

If email confirmation is on, add your site's `/admin/login` URL to the Auth redirect allow list in the Supabase dashboard (for local development, `http://localhost:5173/admin/login`), or the confirmation link will go to the project's default Site URL.

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `supabase/schema.sql` in the Supabase SQL editor (or apply it with the Supabase CLI). It creates the catalogue, translations, date, image, lead, booking, and content tables, RLS policies and a public image bucket.
4. Create an Auth user in Supabase, then promote it to admin from a trusted SQL session: `insert into public.profiles (id, role) values ('AUTH_USER_UUID', 'admin') on conflict (id) do update set role='admin';`
5. Seed the catalogue with translated records using the Supabase dashboard or your own seed script. The app's immediate demo catalogue is in `src/data/content.ts`; the SQL schema is ready for the normalized production data model.
6. Before public launch, connect repository calls to Supabase, validate booking inserts in an Edge Function, enable rate limiting/spam protection, and use real admin auth. Never expose the service-role key in a client build.

With credentials, admin auth, the tour catalogue and photo choices use Supabase (the catalogue and photos are stored under the `tours` and `photos` keys of `site_content`). Bookings and enquiries are still local records: wire those methods in `src/lib/storage.ts` to Supabase queries when moving them to production.

## Telegram notifications

Do **not** put a Telegram bot token in `VITE_` variables: those values are bundled into public JavaScript. `.env.example` shows the requested token and chat ID placeholders for documentation, but keep real secrets in Supabase Edge Function secrets or another server environment. Call Telegram's Bot API from that function after a validated booking/lead insert. The intentional integration seam is `notifyTelegramPlaceholder` in `src/App.tsx`.

## Content and images

- Default English tour and destination content and the default image URLs are in `src/data/content.ts`.
- Russian and Spanish tour, destination and catalogue text, plus most UI strings, are in `src/data/translations.ts`. The remaining UI strings are in the `copy` object in `src/data/content.ts`. Language selection is persisted in localStorage.
- Admins replace any site, destination or tour photo in **Admin → Photos**, by upload or image link. Uploads are resized to at most 2200px and stored in the `tour-images` Supabase Storage bucket; without Supabase they stay in that browser's localStorage. Replaced files are not deleted from the bucket. Current default URLs are visual demo imagery; verify image rights and replace them with licensed/local photographs before commercial use.
- The tour editor has title and description fields for each language. A language left empty falls back to the English text.

## Deploy

Build with `npm run build` and deploy the generated `dist/` directory to a static host configured for SPA fallback to `index.html`. Add the public Supabase URL and anon key as host environment variables, apply the SQL schema, seed real translated catalogue data, configure Auth and Storage, and implement Edge Functions for secure lead/booking intake plus Telegram delivery.

## Structure

```text
src/
  data/content.ts       Default tours, destinations, UI strings and image configuration
  data/translations.ts  Russian/Spanish content, more UI strings and localize helpers
  lib/storage.ts        Local persistence and browser cache
  services/backend.ts   Supabase client, site content and photo upload
  services/auth.ts      Sign in, sign up and admin role check
  types.ts              Shared domain types
  App.tsx               Routes, visitor pages, booking and admin interfaces
  styles.css            Responsive visual system
supabase/schema.sql     Tables, indexes, RLS and image bucket policies
```

## Production checklist

The current release is a populated demo, not a live booking engine. Real pricing/departures, licensed photography, Supabase storage for bookings and enquiries, email/Telegram delivery, spam controls and operational booking follow-up still require business data and production credentials. All prices are clearly marked sample estimates.
