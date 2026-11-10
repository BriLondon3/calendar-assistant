import { redirect } from 'next/navigation';
import { getCurrentUser } from '../auth-client';
import { logout } from '../signup/actions';
import SiteHeader from '../components/site-header';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?mode=login');
  const query = await searchParams;

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
        </section>
      </main>
    </div>
  );
}
