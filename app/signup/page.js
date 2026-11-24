import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authConfigured, getCurrentUser } from '../auth-client';
import { continueWithGoogle } from './actions';
import GoogleButton from './google-button';
import './signup.css';

export const dynamic = 'force-dynamic';

const errorMessages = {
  unavailable: 'Sign-in isn’t available right now. Please try again in a little while.',
  google: 'We couldn’t reach Google. Please try again.',
  provider: 'Google sign-in was cancelled or didn’t finish. Give it another try. (Ref G1)',
  session: 'Your sign-in timed out or your browser blocked cookies. Start again here, in the same browser. (Ref G2)',
  exchange: 'We couldn’t finish signing you in. Please try again. (Ref G3)',
  callback: 'Google sent back an incomplete response. Start again here. (Ref G4)',
};

const NEXT_STEPS = [
  { title: 'Sign in with Google', copy: 'No new password to remember.' },
  { title: 'Connect your Google Calendar', copy: 'One tap, so you can see your schedule and add plans.' },
  { title: 'Choose your colors', copy: 'Pick the look you like. Then start uploading screenshots.' },
];

export default async function SignupPage({ searchParams }) {
  const { mode, error } = await searchParams;
  if (!error && await getCurrentUser()) redirect('/upload');
  const login = mode === 'login';
  const message = error && (Object.hasOwn(errorMessages, error) ? errorMessages[error] : 'Google sign-in didn’t finish. Please try again.');

  return (
    <div className="auth-shell">
      <header className="auth-topbar">
        <Link className="brand" href="/" aria-label="Booked and Busy home">
          <span className="logo"><img src="/calendar-assistant-logo.png" alt="" width="157" height="157" /></span>
          Booked and Busy<span className="brand-dot">.</span>
        </Link>
        <Link className="auth-back" href="/">← Back to home</Link>
      </header>

      <main className="auth-layout">
        <section className="auth-panel" aria-labelledby="auth-heading">
          <nav className="auth-tabs" aria-label="Sign up or log in">
            <Link href="/signup" aria-current={login ? undefined : 'page'}>Sign up</Link>
            <Link href="/signup?mode=login" aria-current={login ? 'page' : undefined}>Log in</Link>
          </nav>

          <h1 id="auth-heading">{login ? 'Welcome back.' : 'Get your plans out of the group chat.'}</h1>
          <p className="auth-lede">
            {login
              ? 'Log in with the Google account you used to sign up. Your review list will be right where you left it.'
              : 'Create your account in a few seconds with your Google account.'}
          </p>

          {message && <p role="alert" className="auth-alert"><span aria-hidden="true">⚠️</span>{message}</p>}

          {authConfigured() ? (
            <form action={continueWithGoogle} className="auth-google-form">
              <GoogleButton>{login ? 'Log in with Google' : 'Sign up with Google'}</GoogleButton>
            </form>
          ) : (
            <p className="auth-alert">Accounts are opening soon. Check back shortly.</p>
          )}

          {!login && <p className="auth-price"><strong>3 free screenshots</strong> · No card needed · Then $2.99/month</p>}

          <p className="auth-switch">
            {login ? 'New to Booked and Busy? ' : 'Already have an account? '}
            <Link href={login ? '/signup' : '/signup?mode=login'}>{login ? 'Create an account' : 'Log in'}</Link>
          </p>

          <p className="auth-fineprint">🔒 We only ask for Calendar access when you connect it, and nothing goes on your calendar without your OK.</p>
        </section>

        <aside className="auth-aside" aria-label={login ? 'Picking up where you left off' : 'What happens next'}>
          {login ? (
            <>
              <p className="auth-aside-eyebrow">Picking up where you left off</p>
              <div className="auth-preview" aria-hidden="true">
                <p className="auth-preview-label">Waiting for review</p>
                <div className="auth-preview-card"><b>Philanthropy 5K</b><span>Sat · 8:00 AM · Main Quad</span></div>
                <div className="auth-preview-card"><b>Exec meeting</b><span>Sun · 7:00 PM · Zoom</span></div>
                <div className="auth-preview-card is-faded"><b>Spring Date Party</b><span>Fri · 9:00 PM · The Venue</span></div>
              </div>
              <p className="auth-aside-note">Uploaded on your phone? Your events sync to every device you log in on.</p>
            </>
          ) : (
            <>
              <p className="auth-aside-eyebrow">What happens next</p>
              <ol className="auth-steps">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step.title}>
                    <span>{index + 1}</span>
                    <div><strong>{step.title}</strong>{step.copy}</div>
                  </li>
                ))}
              </ol>
              <p className="auth-aside-note">Takes about a minute. Then it’s screenshot it, schedule it.</p>
            </>
          )}
        </aside>
      </main>
    </div>
  );
}
