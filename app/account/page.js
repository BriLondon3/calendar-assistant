import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createAuthClient, getCurrentUser } from '../auth-client';
import { connectGoogleCalendar, disconnectGoogleCalendar, logout } from '../signup/actions';
import { savedCalendarConfigured, hasCalendarConnection } from '../calendar-connection';
import SiteHeader from '../components/site-header';
import ProfilePhoto from '../components/profile-photo';
import GoogleButton from '../signup/google-button';
import ThemePicker from '../components/theme-picker';
import { validTheme } from '../themes';
import DeadlineReminders from '../components/deadline-reminders';
import { validReminderDays } from '../calendar/deadlines';
import { FREE_EXTRACTIONS, planSummary, syncFromStripe } from '../billing';
import { openBillingPortal, startCheckout } from './billing-actions';

const formatDay = value => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function PlanDetails({ plan }) {
  if (!plan.configured) return <p>Subscriptions are coming soon. You haven’t been charged.</p>;
  if (plan.unavailable) return <p>Couldn’t load your plan right now. Refresh to try again.</p>;
  const manage = <form action={openBillingPortal}><button className="ghost-button" type="submit">Manage billing</button></form>;
  if (plan.subscribed) {
    const ending = plan.cancelAtPeriodEnd && plan.periodEnd;
    return <>
      {plan.status === 'trialing' && <p className="plan-status is-trial">Free trial{plan.trialEnd ? ` · ends ${formatDay(plan.trialEnd)}` : ''}</p>}
      {plan.status === 'active' && <p className="plan-status is-on">● Active</p>}
      {plan.status === 'past_due' && <p className="plan-status is-warn">Payment failed</p>}
      <p>{plan.status === 'past_due'
        ? 'Your last payment didn’t go through. Update your card to keep your subscription.'
        : ending
          ? `Your subscription is cancelled and ends on ${formatDay(plan.periodEnd)}. You can renew any time before then.`
          : plan.status === 'trialing'
            ? `Your first $2.99 charge is on ${plan.trialEnd ? formatDay(plan.trialEnd) : 'the day your trial ends'}. Cancel any time before then and you won’t be charged.`
            : `Renews on ${plan.periodEnd ? formatDay(plan.periodEnd) : 'your next billing date'}. Update your card, see receipts, or cancel any time.`}</p>
      <div className="tile-actions">{manage}</div>
    </>;
  }
  return <>
    <p className="plan-status is-off">{plan.status === 'canceled' ? 'Subscription ended' : 'Free'}</p>
    <p>{plan.freeLeft > 0
      ? `You have ${plan.freeLeft} of ${FREE_EXTRACTIONS} free screenshots left. `
      : 'You’ve used your free screenshots. '}
      {plan.trialAvailable ? 'Start a 7-day free trial for unlimited screenshots. Cancel any time before it ends and you won’t be charged.' : 'Subscribe for unlimited screenshots. Cancel any time.'}</p>
    <div className="tile-actions">
      <form action={startCheckout}><button className="primary-button" type="submit">{plan.trialAvailable ? 'Start 7-day free trial' : 'Subscribe'}</button></form>
      {plan.hasCustomer && plan.status && manage}
    </div>
  </>;
}

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?mode=login');
  const query = await searchParams;
  if (query.billing === 'success') await syncFromStripe(user.id);
  const plan = await planSummary(user.id);
  const jar = await cookies();
  const client = createAuthClient({ getAll: () => jar.getAll(), setAll: () => {} });
  const connected = await hasCalendarConnection(client, user.id) === true;
  // Disconnecting only applies to saved (encrypted) connections.
  const savedConnection = savedCalendarConfigured() && connected;
  const name = user.user_metadata?.full_name || user.email;
  const since = user.created_at && new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="workspace">
      <SiteHeader user={user} active="account" />
      <main className="account-page">
        <section className="profile-card" aria-labelledby="account-heading">
          <div className="profile-photo-lg"><ProfilePhoto src={user.user_metadata?.avatar_url} name={name} /></div>
          <div className="profile-copy">
            <p className="upload-eyebrow">YOUR ACCOUNT</p>
            <h1 id="account-heading">{user.user_metadata?.full_name ? `Hey, ${user.user_metadata.full_name.split(' ')[0]}!` : 'Your account'}</h1>
            <p>Signed in as <strong>{user.email}</strong>{since && <> · Member since {since}</>}</p>
          </div>
          <form action={logout} className="profile-signout">
            <button className="ghost-button" type="submit">Sign out</button>
          </form>
        </section>
        {query.billing === 'success' && <p className="setup-success" role="status">🎉 You’re subscribed. Thanks for keeping me caffeinated!</p>}
        {query.billing === 'cancelled' && <p className="upload-alert" role="status">Checkout was cancelled. You haven’t been charged.</p>}
        {query.billing === 'error' && <p role="alert" className="auth-error upload-alert">Couldn’t open billing. Please try again.</p>}
        {query.logout === 'failed' && <p role="alert" className="auth-error upload-alert">Couldn’t sign out. Try again.</p>}

        <div className="account-grid">
          <section className="account-tile account-calendar" aria-labelledby="connection-heading">
            <div className="tile-head">
              <span className="tile-icon" aria-hidden="true">📅</span>
              <h2 id="connection-heading">Google Calendar</h2>
              <span className={`status-pill ${connected ? 'is-on' : 'is-off'}`}>{connected ? '● Connected' : '● Not connected'}</span>
            </div>
            <p>{connected
              ? 'You’re all set. You can see your schedule while reviewing events and add plans in one click.'
              : 'Connect your Google Calendar to see your schedule next to each event and add plans in one click.'}</p>
            {query.calendar === 'save-failed' && <p role="alert" className="auth-error">Your calendar connection couldn’t be saved. Please try connecting again.</p>}
            {query.calendar === 'disconnect-failed' && <p role="alert" className="auth-error">Couldn’t disconnect your calendar. Please try again.</p>}
            <div className="tile-actions">
              <form action={connectGoogleCalendar}>
                {connected
                  ? <button className="ghost-button" type="submit">Reconnect or switch account</button>
                  : <GoogleButton>Connect Google Calendar</GoogleButton>}
              </form>
              {savedConnection && <form action={disconnectGoogleCalendar}><button className="text-button" type="submit">Disconnect</button></form>}
            </div>
            <p className="tile-fineprint">🔒 Access is limited to events on calendars you own. Your connection is encrypted.</p>
          </section>

          <section className="account-tile account-deadlines" id="deadlines" aria-labelledby="deadlines-heading">
            <div className="tile-head">
              <span className="tile-icon" aria-hidden="true">💼</span>
              <h2 id="deadlines-heading">Application deadlines</h2>
            </div>
            <p>Upload a screenshot of an internship or job posting and its due date becomes an all-day “applications due” event. Applications due the same day share one event, listed in its description.</p>
            <DeadlineReminders current={validReminderDays(user.user_metadata?.deadlineReminders)} />
          </section>

          <section className="account-tile account-appearance" aria-labelledby="appearance-heading">
            <div className="tile-head">
              <span className="tile-icon" aria-hidden="true">🎨</span>
              <h2 id="appearance-heading">Your colors</h2>
            </div>
            <p>Pick the color theme you see when you’re logged in. Hover over one to preview it.</p>
            <ThemePicker current={validTheme(user.user_metadata?.theme)} />
          </section>

          <section className="account-tile account-plan" aria-labelledby="plan-heading">
            <div className="tile-head">
              <span className="tile-icon" aria-hidden="true">☕</span>
              <h2 id="plan-heading">Your plan</h2>
            </div>
            <p className="plan-price"><strong>$2.99</strong> / month</p>
            <PlanDetails plan={plan} />
          </section>

          <section className="account-tile account-links" aria-labelledby="links-heading">
            <div className="tile-head">
              <span className="tile-icon" aria-hidden="true">⚡</span>
              <h2 id="links-heading">Jump back in</h2>
            </div>
            <Link className="quick-link" href="/upload"><span aria-hidden="true">📸</span><div><strong>Upload screenshots</strong>Turn new plans into events</div><b aria-hidden="true">→</b></Link>
            <Link className="quick-link" href="/calendar"><span aria-hidden="true">🗓️</span><div><strong>View your calendar</strong>See what’s coming up</div><b aria-hidden="true">→</b></Link>
          </section>
        </div>
      </main>
    </div>
  );
}
