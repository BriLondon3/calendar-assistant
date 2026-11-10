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

### Save connections across logins

1. Run `supabase/calendar-connection.sql` in the Supabase SQL Editor. It creates an encrypted-token table with per-user Row Level Security. Enable the Data API under Supabase Integrations → Data API so the server can read this table through the signed-in user's session. Leave automatic exposure of new tables disabled.
2. Add `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` to Vercel. Use the same web OAuth client credentials configured in the Supabase Google provider.
3. Generate a 32-byte encryption key with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Save the output as `GOOGLE_TOKEN_ENCRYPTION_KEY` in Vercel. Keep this stable across deployments. Changing it makes saved tokens unreadable and requires users to reconnect. Use the same variables in `.env.local` for local testing.
4. Redeploy and connect Google Calendar once more to grant offline access. New connections are encrypted using AES-256-GCM, bound to the user's ID, and stored in the private per-user table. Calendar access tokens are refreshed on demand. Signing out preserves the saved connection. Disconnect removes it from the app.

Until all three new environment variables are set, the existing short-lived connection remains available. After enabling saved connections, users must connect once to save a refresh token. Google can still revoke refresh tokens. OAuth applications in Testing generally have refresh tokens that expire after seven days for Calendar scopes. Production publishing and any required Google verification are separate setup steps. The screenshot review/add/reject workflow is still pending.
