import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createAuthClient, getCurrentUser } from '../auth-client';
import { hasCalendarConnection } from '../calendar-connection';
import { connectCalendarDuringWelcome } from '../signup/actions';
import { finishSetup } from '../account/theme-actions';
import { validTheme } from '../themes';
import GoogleButton from '../signup/google-button';
import SiteHeader from '../components/site-header';
import ThemePicker from '../components/theme-picker';

export const dynamic = 'force-dynamic';

// First-time setup after signing up: connect Google Calendar, then pick colors.
export default async function WelcomePage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/signup');
  const { calendar } = await searchParams;
  const jar = await cookies();
  const client = createAuthClient({ getAll: () => jar.getAll(), setAll: () => {} });
  const connected = await hasCalendarConnection(client, user.id) === true;
  const firstName = user.user_metadata?.full_name?.split(' ')[0];

  return (
    <div className="workspace">
      <SiteHeader user={user} />
      <main className="welcome-page">
        <div className="page-head">
          <div>
            <p className="upload-eyebrow">WELCOME{firstName ? `, ${firstName.toUpperCase()}` : ''}</p>
            <h1>Two quick things before you start.</h1>
            <p className="page-head-sub">Connect your calendar so you can add plans in one click, then make Booked and Busy yours.</p>
          </div>
        </div>

        <ol className="welcome-steps">
          <li className="welcome-step" data-done={connected}>
            <div className="welcome-step-head">
              <span className="welcome-step-num" aria-hidden="true">{connected ? '✓' : '1'}</span>
              <div>
                <h2>Connect Google Calendar</h2>
                <p>See your schedule next to each event and add plans in one click. Nothing goes on your calendar without your OK.</p>
              </div>
            </div>
            {calendar === 'save-failed' && <p role="alert" className="auth-error upload-alert">Your calendar connection couldn’t be saved. Please try again.</p>}
            {connected ? (
              <p className="setup-success" role="status">✓ Google Calendar connected.</p>
            ) : (
              <form action={connectCalendarDuringWelcome} className="welcome-connect">
                <GoogleButton>Connect Google Calendar</GoogleButton>
              </form>
            )}
          </li>

          <li className="welcome-step">
            <div className="welcome-step-head">
              <span className="welcome-step-num" aria-hidden="true">2</span>
              <div>
                <h2>Choose your colors</h2>
                <p>Hover over a theme to preview it. You can change this any time from your account.</p>
              </div>
            </div>
            <ThemePicker current={validTheme(user.user_metadata?.theme)} />
          </li>
        </ol>

        <form action={finishSetup} className="welcome-finish">
          <button className="primary-button page-head-cta" type="submit">{connected ? 'Start uploading screenshots →' : 'Continue without connecting →'}</button>
          {!connected && <p>You can connect Google Calendar later from your account.</p>}
        </form>
      </main>
    </div>
  );
}
