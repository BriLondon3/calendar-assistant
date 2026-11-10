# Booked and Busy

A simple Next.js homepage for Booked and Busy, by Bri London.

## Local development

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. You can also use npm instead of pnpm.

## Production

```sh
pnpm build
pnpm start
```

To deploy later, import this repository into Vercel and use its Next.js defaults.

## Enable sign-up and login

1. Enable the Google provider and new user sign-ups in [Supabase Authentication](https://supabase.com/dashboard/projects). In Google Cloud, authorize the callback shown on the Supabase Google provider screen.
2. Under **Authentication → URL Configuration** in Supabase, set **Site URL** to the production website origin. Add `http://127.0.0.1:3000/auth/callback` and the production website origin followed by `/auth/callback` to **Redirect URLs**. If you use `localhost` instead of `127.0.0.1`, also allow `http://localhost:3000/auth/callback`.
3. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `.env.local` and in the Vercel project. Use the project URL and publishable key from Supabase. Set `SITE_URL` in Vercel to the production website origin, then redeploy. Restart the local dev server after changing `.env.local`.
4. Test **Continue with Google** on the local site and then on the production domain. If your Google OAuth app is in Testing, use an account permitted by that app.

The $2.99/month price is displayed on the site. Stripe checkout, subscription status, and billing are pending integration.

## Google Calendar connection

Enable the Google Calendar API in the Google Cloud project used for sign-in. While the OAuth app is in Testing, add your Google account under Audience → Test users. Under Data Access, configure `https://www.googleapis.com/auth/calendar.events.owned` for viewing and eventually adding events on owned calendars.

From `/account`, choose **Connect Google Calendar** and grant Calendar access. The account page shows the selected day from the signed-in Google account’s primary calendar, using the browser’s time zone. Choose the same Google account when reconnecting.

The initial connection uses the Google access token held in the server-only session cookie. When the token expires or is lost during a session refresh, users reconnect using the button. Persistent Google token refresh and the screenshot review/add/reject workflow are still pending. Calendar data is fetched on demand without shared caching.
