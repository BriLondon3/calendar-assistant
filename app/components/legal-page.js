import Link from 'next/link';
import '../legal.css';

// Contact address shown on the Privacy Policy and Terms (set CONTACT_EMAIL in Vercel).
export function contactEmail() {
  return (process.env.CONTACT_EMAIL || '').trim();
}

export function ContactLink() {
  const email = contactEmail();
  return email ? <a href={`mailto:${email}`}>{email}</a> : <>the contact email on the Google sign-in screen</>;
}

// Shared layout for the Privacy Policy and Terms of Service.
export default function LegalPage({ title, updated, children }) {
  return (
    <div className="legal-shell">
      <header className="legal-top">
        <Link className="brand" href="/" aria-label="Booked and Busy home">
          <span className="logo"><img src="/calendar-assistant-logo.png" alt="" width="157" height="157" /></span>
          Booked and Busy<span className="brand-dot">.</span>
        </Link>
        <nav aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/">Home</Link>
        </nav>
      </header>
      <main className="legal-page">
        <p className="legal-eyebrow">Booked and Busy</p>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated {updated}</p>
        {children}
      </main>
    </div>
  );
}
