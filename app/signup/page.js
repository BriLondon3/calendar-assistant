import Link from 'next/link';
import { authConfigured } from '../auth-client';
import { continueWithGoogle } from './actions';

export const dynamic = 'force-dynamic';

const errorMessages = {
  unavailable: 'Account access isn’t available yet.',
  provider: 'Google authorization couldn’t be completed. Please try again. Reference G1.',
  session: 'Your sign-in session expired or cookies were blocked. Start again here in the same browser. Reference G2.',
  exchange: 'We couldn’t finish signing you in. Please try again. Reference G3.',
  callback: 'The sign-in response was incomplete. Start again here. Reference G4.',
};

export default async function SignupPage({ searchParams }) {
  const { mode, error } = await searchParams;
  const login = mode === 'login';

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-heading">
        <Link href="/">← Booked and Busy</Link>
        <h1 id="auth-heading">{login ? 'Log in' : 'Create your account'}</h1>
        {!login && <p className="auth-plan">Monthly plan · <strong>$2.99/month</strong></p>}
        {authConfigured() ? (
          <>
            <p>Use your Google account to continue.</p>
            {error && <p role="alert" className="auth-error">{Object.hasOwn(errorMessages, error) ? errorMessages[error] : 'Google sign-in couldn’t be completed. Try again.'}</p>}
            <form className="auth-form" action={continueWithGoogle}>
              <button className="primary-button" type="submit">Continue with Google</button>
            </form>
            <p>{login ? 'New here? ' : 'Already have an account? '}<Link href={login ? '/signup' : '/signup?mode=login'}>{login ? 'Sign up' : 'Log in'}</Link></p>
          </>
        ) : <p>Account access is coming soon.</p>}
      </section>
    </main>
  );
}
