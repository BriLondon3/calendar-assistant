'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authConfigured, createWritableAuthClient } from '../auth-client';

async function startGoogleSignIn(calendarAccess = false) {
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
  const jar = await cookies();
  jar.set('oauth-destination', calendarAccess ? 'calendar' : 'upload', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: new URL('/auth/callback', siteOrigin).href,
      ...(calendarAccess && {
        scopes: 'https://www.googleapis.com/auth/calendar.events.owned https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.calendars.readonly',
        queryParams: { prompt: 'consent', access_type: 'offline', include_granted_scopes: 'true' },
      }),
    },
  });

  if (error || !data.url) redirect('/signup?error=google');
  redirect(data.url);
}

export async function continueWithGoogle() {
  await startGoogleSignIn();
}

export async function connectGoogleCalendar() {
  if (!authConfigured()) redirect('/signup');
  const client = await createWritableAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/signup?mode=login');
  await startGoogleSignIn(true);
}

export async function disconnectGoogleCalendar() {
  if (!authConfigured()) redirect('/signup');
  const client = await createWritableAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/signup?mode=login');
  const { error } = await client.from('google_calendar_connections').delete().eq('user_id', user.id);
  if (error) redirect('/account?calendar=disconnect-failed');
  redirect('/account');
}

export async function logout() {
  if (authConfigured()) {
    const client = await createWritableAuthClient();
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) redirect('/account?logout=failed');
  }
  redirect('/');
}
