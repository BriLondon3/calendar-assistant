import Link from 'next/link';
import ProfilePhoto from './profile-photo';

export default function SiteHeader({ user, active, variant }) {
  const name = user?.user_metadata?.full_name || user?.email || 'Your account';
  const avatar = user?.user_metadata?.avatar_url;
  const marketing = variant === 'marketing' && !user;

  return (
    <header className={`app-header${marketing ? ' marketing-header' : ''}`}>
      <Link className="brand" href="/" aria-label="Booked and Busy home">
        <span className="logo"><img src="/calendar-assistant-logo.png" alt="" width="157" height="157" /></span>
        Booked and Busy<span className="brand-dot">.</span>
      </Link>
      {marketing ? (
        <>
          <nav className="app-navigation" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="header-actions">
            <Link className="header-login" href="/signup?mode=login">Log in</Link>
            <Link className="primary-button header-cta" href="/signup">Get started</Link>
          </div>
        </>
      ) : (
        <>
          <nav className="app-navigation" aria-label="Main navigation">
            <Link href="/upload" aria-current={active === 'upload' ? 'page' : undefined}>Upload screenshots</Link>
            <Link href="/calendar" aria-current={active === 'calendar' ? 'page' : undefined}>View your calendar</Link>
          </nav>
          <Link className="account-avatar" href={user ? '/account' : '/signup?mode=login'} aria-label={user ? `Your account, ${name}` : 'Log in'} title={user ? 'Your account' : 'Log in'} aria-current={active === 'account' ? 'page' : undefined}>
            <ProfilePhoto src={avatar} name={name} />
          </Link>
        </>
      )}
    </header>
  );
}
