import { NextResponse } from 'next/server';
import { authConfigured, createAuthClient } from './app/auth-client';

export async function proxy(request) {
  let response = NextResponse.next({ request });
  if (!authConfigured()) return response;

  const client = createAuthClient({
    getAll: () => request.cookies.getAll(),
    setAll(items, headers = {}) {
      items.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      new Headers(headers).forEach((value, name) => response.headers.set(name, value));
    },
  });
  await client.auth.getClaims();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/', '/signup', '/upload', '/account', '/calendar', '/api/calendar'] };
