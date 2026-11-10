import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authConfigured, createAuthClient } from '../auth-client';
import { connectGoogleCalendar, disconnectGoogleCalendar, logout } from '../signup/actions';
import CalendarDay from './calendar-day';
import { savedCalendarConfigured } from '../calendar-connection';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }) {
  if (!authConfigured()) redirect('/signup');
  const jar = await cookies();
  const client = createAuthClient({ getAll: () => jar.getAll(), setAll: () => {} });
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/signup?mode=login');
  const query = await searchParams;
  let savedConnection = false;
  if (savedCalendarConfigured()) {
    const { data } = await client.from('google_calendar_connections').select('user_id').eq('user_id', user.id).maybeSingle();
    savedConnection = Boolean(data);
  }

  return (
    <main className="auth-page">
      <section className="auth-card account-card" aria-labelledby="account-heading">
        <Link href="/">← Booked and Busy</Link>
        <h1 id="account-heading">Your account</h1>
        <p>Signed in as <strong>{user.email}</strong>.</p>
        <Link className="primary-button" href="/upload">Upload event screenshots</Link>
        <p>Monthly plan · <strong>$2.99/month</strong></p>
        <p>Subscriptions are coming soon. You haven’t been charged.</p>
        <section className="calendar-section" aria-labelledby="calendar-heading">
          <h2 id="calendar-heading">Your Google Calendar</h2>
          <p>{savedConnection ? 'Your calendar connection is saved. Choose a day to see your plans.' : 'Connect the Google account whose calendar you want to use, then choose a day to see your plans.'}</p>
          {query.calendar === 'save-failed' && <p role="alert" className="auth-error">Your calendar connection couldn’t be saved. Please check the connection setup and try again.</p>}
          {query.calendar === 'disconnect-failed' && <p role="alert" className="auth-error">Couldn’t disconnect your calendar. Please try again.</p>}
          <form action={connectGoogleCalendar}>
            <button className={savedConnection ? 'text-button' : 'primary-button'} type="submit">{savedConnection ? 'Reconnect or change Google account' : 'Connect Google Calendar'}</button>
          </form>
          {savedConnection && <form action={disconnectGoogleCalendar}><button className="text-button" type="submit">Disconnect calendar</button></form>}
          <CalendarDay />
        </section>
        {(await searchParams).logout === 'failed' && <p role="alert" className="auth-error">Couldn’t sign out. Try again.</p>}
        <form action={logout}><button className="primary-button" type="submit">Sign out</button></form>
      </section>
    </main>
  );
}
