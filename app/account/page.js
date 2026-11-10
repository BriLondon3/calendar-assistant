import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createAuthClient, getCurrentUser } from '../auth-client';
import { connectGoogleCalendar, disconnectGoogleCalendar, logout } from '../signup/actions';
import { savedCalendarConfigured } from '../calendar-connection';
import SiteHeader from '../components/site-header';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?mode=login');
  const query = await searchParams;
  let savedConnection = false;
  if (savedCalendarConfigured()) {
    const jar = await cookies();
    const client = createAuthClient({ getAll: () => jar.getAll(), setAll: () => {} });
    const { data } = await client.from('google_calendar_connections').select('user_id').eq('user_id', user.id).maybeSingle();
    savedConnection = Boolean(data);
  }

  return (
    <div className="workspace">
      <SiteHeader user={user} active="account" />
      <main className="account-page">
        <section className="auth-card account-card" aria-labelledby="account-heading">
          <h1 id="account-heading">Your account</h1>
          <p>Signed in as <strong>{user.email}</strong>.</p>
          <p>Monthly plan · <strong>$2.99/month</strong></p>
          <p>Subscriptions are coming soon. You haven’t been charged.</p>
          {query.logout === 'failed' && <p role="alert" className="auth-error">Couldn’t sign out. Try again.</p>}
          <form action={logout}><button className="primary-button" type="submit">Sign out</button></form>
          <section className="calendar-section" aria-labelledby="connection-heading">
            <h2 id="connection-heading">Google Calendar connection</h2>
            <p>{savedConnection ? 'Your calendar connection is saved.' : 'Connect your Google account to view your calendar.'}</p>
            {query.calendar === 'save-failed' && <p role="alert" className="auth-error">Your calendar connection couldn’t be saved. Please check the connection setup and try again.</p>}
            {query.calendar === 'disconnect-failed' && <p role="alert" className="auth-error">Couldn’t disconnect your calendar. Please try again.</p>}
            <form action={connectGoogleCalendar}>
              <button className={savedConnection ? 'text-button' : 'primary-button'} type="submit">{savedConnection ? 'Reconnect or change Google account' : 'Connect Google Calendar'}</button>
            </form>
            {savedConnection && <form action={disconnectGoogleCalendar}><button className="text-button" type="submit">Disconnect calendar</button></form>}
          </section>
        </section>
      </main>
    </div>
  );
}
