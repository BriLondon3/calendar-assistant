import { redirect } from 'next/navigation';
import { authConfigured, createWritableAuthClient } from '../../auth-client';

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const code = params.get('code');

  if (params.has('error')) {
    console.error('Google sign-in provider failure', {
      code: params.get('error_code') || params.get('error'),
    });
    redirect('/signup?error=provider');
  }

  if (!authConfigured()) redirect('/signup?error=unavailable');

  if (code && authConfigured()) {
    const client = await createWritableAuthClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) redirect('/account');
    console.error('Google sign-in session exchange failed', {
      code: error.code,
      status: error.status,
      name: error.name,
    });
    if (error.code === 'pkce_verifier_not_found' || error.code === 'bad_code_verifier' || error.name === 'AuthPKCECodeVerifierMissingError') {
      redirect('/signup?error=session');
    }
    redirect('/signup?error=exchange');
  }

  redirect('/signup?error=callback');
}
