import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createAuthClient, getCurrentUser } from '../auth-client';
import { hasCalendarConnection } from '../calendar-connection';
import { connectCalendarDuringSetup } from '../signup/actions';
import GoogleButton from '../signup/google-button';
import SiteHeader from '../components/site-header';
import ScreenshotPicker from './screenshot-picker';
import { planSummary, syncFromStripe } from '../billing';

export const dynamic = 'force-dynamic';

export default async function UploadPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?mode=login');
  const { calendar, billing } = await searchParams;
  if (billing === 'success') await syncFromStripe(user.id);
  const plan = await planSummary(user);

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
        {billing === 'success' && <p className="setup-success" role="status">🎉 You’re in! Your subscription is set up. Upload away.</p>}
        {billing === 'cancelled' && <p className="upload-alert" role="status">Checkout was cancelled. You haven’t been charged.</p>}
        {billing === 'error' && <p className="auth-error upload-alert" role="alert">Couldn’t open checkout. Please try again.</p>}
        <ScreenshotPicker plan={plan.configured && !plan.unavailable ? plan : null} />
      </main>
    </div>
  );
}
