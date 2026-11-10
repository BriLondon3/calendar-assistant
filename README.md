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
