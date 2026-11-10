import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '../auth-client';
import CalendarDay from './calendar-day';
import SiteHeader from '../components/site-header';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?mode=login');

  return (
    <div className="workspace">
      <SiteHeader user={user} active="calendar" />
      <main className="calendar-page">
        <div className="auth-card account-card">
        <section className="calendar-section" aria-labelledby="calendar-heading">
          <h1 id="calendar-heading">Your Google Calendar</h1>
          <p>Choose a day to see your plans.</p>
          <CalendarDay />
          <p><Link href="/account">Manage Calendar connection</Link></p>
        </section>
        </div>
      </main>
    </div>
  );
}
