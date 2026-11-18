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
        <div className="page-head">
          <div>
            <p className="upload-eyebrow">YOUR SCHEDULE</p>
            <h1 id="calendar-heading">Your Google Calendar</h1>
            <p className="page-head-sub">Flip through your days, check what’s coming up, and tap any event for details.</p>
          </div>
          <Link className="primary-button page-head-cta" href="/upload">＋ Add from screenshots</Link>
        </div>
        <div className="calendar-layout">
          <section className="calendar-panel" aria-labelledby="calendar-heading">
            <CalendarDay />
          </section>
          <aside className="calendar-side" aria-label="Shortcuts">
            <div className="side-card side-card-blue">
              <span aria-hidden="true">📸</span>
              <h2>Got a new screenshot?</h2>
              <p>Upload it and we’ll turn it into an event you can add in one click.</p>
              <Link href="/upload">Upload screenshots →</Link>
            </div>
            <div className="side-card">
              <span aria-hidden="true">✳</span>
              <h2>Added with Booked and Busy</h2>
              <p>Tap an event you added here to see its details or remove it from your calendar.</p>
            </div>
            <div className="side-card">
              <span aria-hidden="true">⚙️</span>
              <h2>Calendar connection</h2>
              <p>Switch Google accounts or reconnect if something looks off.</p>
              <Link href="/account">Manage connection →</Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
