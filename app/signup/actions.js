'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authConfigured, createWritableAuthClient } from '../auth-client';

export async function continueWithGoogle() {
  const origin = (await headers()).get('origin');
  const localOrigins = ['http://127.0.0.1:3000', 'http://localhost:3000'];
  const configuredOrigin = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null);
  const siteOrigin = process.env.NODE_ENV === 'development' && localOrigins.includes(origin)
    ? origin
    : configuredOrigin && new URL(configuredOrigin).origin;

  if (!authConfigured() || !siteOrigin) redirect('/signup?error=unavailable');
  if (origin !== siteOrigin) redirect(new URL('/signup', siteOrigin).href);

  const client = await createWritableAuthClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL('/auth/callback', siteOrigin).href },
  });

  if (error || !data.url) redirect('/signup?error=google');
  redirect(data.url);
}

export async function logout() {
  if (authConfigured()) {
    const client = await createWritableAuthClient();
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) redirect('/account?logout=failed');
  }
  redirect('/');
}
