import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authConfigured, createAuthClient } from '../auth-client';
import { logout } from '../signup/actions';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }) {
  if (!authConfigured()) redirect('/signup');
  const jar = await cookies();
  const client = createAuthClient({ getAll: () => jar.getAll(), setAll: () => {} });
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/signup?mode=login');

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="account-heading">
        <Link href="/">← Booked and Busy</Link>
        <h1 id="account-heading">Your account</h1>
        <p>Signed in as <strong>{user.email}</strong>.</p>
        <p>Monthly plan · <strong>$2.99/month</strong></p>
        <p>Subscriptions are coming soon. You haven’t been charged.</p>
        {(await searchParams).logout === 'failed' && <p role="alert" className="auth-error">Couldn’t sign out. Try again.</p>}
        <form action={logout}><button className="primary-button" type="submit">Sign out</button></form>
      </section>
    </main>
  );
}
