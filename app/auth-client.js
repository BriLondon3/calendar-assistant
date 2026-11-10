import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function authConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

export async function getCurrentUser() {
  if (!authConfigured()) return null;
  const jar = await cookies();
  const client = createAuthClient({ getAll: () => jar.getAll(), setAll: () => {} });
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function createWritableAuthClient() {
  const jar = await cookies();
  return createAuthClient({
    getAll: () => jar.getAll(),
    setAll: (items) => items.forEach(({ name, value, options }) => jar.set(name, value, options)),
  });
}

export function createAuthClient(cookies) {
  return createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    cookies,
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    },
  });
}
