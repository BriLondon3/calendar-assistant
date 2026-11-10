import { redirect } from 'next/navigation';
import { authConfigured, createWritableAuthClient } from '../../auth-client';

export async function GET(request) {
  const code = new URL(request.url).searchParams.get('code');

  if (code && authConfigured()) {
    const client = await createWritableAuthClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) redirect('/account');
  }

  redirect('/signup?error=google');
}
