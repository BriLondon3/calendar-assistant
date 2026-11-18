import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createAuthClient, getCurrentUser } from '../auth-client';
import { hasCalendarConnection } from '../calendar-connection';
import { connectCalendarDuringSetup } from '../signup/actions';
import GoogleButton from '../signup/google-button';
import SiteHeader from '../components/site-header';
import ScreenshotPicker from './screenshot-picker';

export const dynamic = 'force-dynamic';

export default async function UploadPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?mode=login');
  const { calendar } = await searchParams;

  const jar = await cookies();
  const client = createAuthClient({ getAll: () => jar.getAll(), setAll: () => {} });
  // null means we couldn't tell; only nudge when we know it's missing.
  const connected = await hasCalendarConnection(client, user.id);
  const firstName = user.user_metadata?.full_name?.split(' ')[0];

  return (
    <div className="workspace">
      <SiteHeader user={user} active="upload" />
      <main className="upload-page">
        {calendar === 'connected' && (
          <p className="setup-success" role="status">✓ Google Calendar connected. You’re all set — upload your first screenshots below.</p>
        )}
        {connected === false && (
          <section className="setup-card" aria-labelledby="setup-heading">
            <span className="setup-icon" aria-hidden="true">📅</span>
            <div className="setup-copy">
              <p className="setup-eyebrow">{firstName ? `Welcome, ${firstName}! ` : 'Welcome! '}One more step</p>
              <h2 id="setup-heading">Connect your Google Calendar</h2>
              <p>This lets you see your schedule next to each event and add plans in one click. Google will ask you to allow calendar access, and nothing gets added without your OK.</p>
            </div>
            <div className="setup-action">
              <form action={connectCalendarDuringSetup}>
                <GoogleButton>Connect Google Calendar</GoogleButton>
              </form>
              <p>You can also upload screenshots first and connect later.</p>
            </div>
          </section>
        )}
        <ScreenshotPicker />
      </main>
    </div>
  );
}
