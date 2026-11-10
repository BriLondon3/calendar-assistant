import Link from 'next/link';
import { getCurrentUser } from './auth-client';
import SiteHeader from './components/site-header';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="site">
      <SiteHeader user={user} />
      <main>
        <section className="intro" aria-labelledby="headline">
          <h1 id="headline">Screenshot it.<br /><em>Schedule it.</em></h1>
          <div className="description">
            <p className="intro-label">Your event assistant</p>
            <p>Turn screenshots from group chats, GroupMe, Flare, flyers, and invites into calendar events automatically.</p>
            <p>Review the details, spot conflicts, and add the plans you want to Google Calendar.</p>
          </div>
          <div className="plan-cta">
            <p><strong>$2.99</strong> / month</p>
            <Link className="primary-button" href={user ? '/upload' : '/signup'}>{user ? 'Upload screenshots' : 'Sign up'}</Link>
            <Link href={user ? '/account' : '/signup?mode=login'}>{user ? 'Your account' : 'Log in'}</Link>
          </div>
        </section>
        <div className="hero-artwork">
          <img src="/scattered-plans-to-calendar.png" alt="Screenshots from chats and invites becoming organized calendar events, with a person working at a laptop." width="1672" height="941" />
        </div>
        <section className="how-it-works" aria-labelledby="how-heading">
          <h2 id="how-heading">How it works</h2>
          <ol className="steps">
            <li><span className="step-number" aria-hidden="true">01</span><h3>Upload a screenshot</h3><ul className="step-details"><li>Upload screenshots with event details.</li></ul></li>
            <li><span className="step-number" aria-hidden="true">02</span><h3>Sort events</h3><ul className="step-details"><li>Check conflicts alongside your calendar at a glance</li><li>Pick times, make quick edits</li><li>Reject the ones you don’t need</li></ul></li>
            <li><span className="step-number" aria-hidden="true">03</span><h3>Add your plans</h3><ul className="step-details"><li>Add events with all the details to Google Calendar in one click.</li></ul></li>
          </ol>
        </section>
      </main>
      <footer><span>Thoughtfully made by <strong>Bri London</strong></span><span>Make time for the good things. <span className="footer-star">✳</span></span></footer>
    </div>
  );
}
