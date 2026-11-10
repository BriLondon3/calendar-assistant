import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../auth-client';
import { logout } from '../signup/actions';
import ScreenshotPicker from './screenshot-picker';

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?mode=login');

  return (
    <div className="workspace">
      <nav className="workspace-nav" aria-label="Main navigation">
        <Link className="brand" href="/">Booked and Busy<span className="brand-dot">.</span></Link>
        <div>
          <Link href="/account">Account &amp; Calendar</Link>
          <form action={logout}><button className="text-button" type="submit">Sign out</button></form>
        </div>
      </nav>
      <main className="upload-page">
        <ol className="workflow" aria-label="Event workflow">
          <li aria-current="step"><span>1</span>Upload screenshots</li>
          <li><span>2</span>Review events</li>
          <li><span>3</span>Add your plans</li>
        </ol>
        <section aria-labelledby="upload-heading">
          <p className="upload-eyebrow">LET’S MAKE SOME PLANS</p>
          <h1 id="upload-heading">Start with a screenshot.</h1>
          <p className="upload-description">Choose screenshots from group chats, flyers, or invites. Make sure the event name, date, time, and location are visible.</p>
          <ScreenshotPicker />
        </section>
      </main>
    </div>
  );
}
