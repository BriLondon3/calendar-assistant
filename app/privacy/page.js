import LegalPage, { ContactLink } from '../components/legal-page';

export const metadata = {
  title: 'Privacy Policy · Booked and Busy',
  description: 'What Booked and Busy collects, how it is used, and the choices you have.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 24, 2026">
      <p className="legal-lede">Booked and Busy turns screenshots of plans into Google Calendar events. This policy explains what we collect to do that, how we use it, and the choices you have. In short: we use your information only to run the app for you, we never sell it, and nothing goes on your calendar without your OK.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Your Google account basics.</strong> When you sign in with Google, we receive your name, email address, and profile photo so we can create and show your account.</li>
        <li><strong>Google Calendar access, if you connect it.</strong> With your permission, we can view events on calendars you own and add events you approve. We use this to show your schedule next to each suggested event and to add the events you choose. To keep you connected, we store a Google access token, encrypted (AES-256-GCM) and tied to your account.</li>
        <li><strong>Screenshots you upload.</strong> Each screenshot is sent to Google’s Gemini API to read the event details in it. We don’t keep a copy of your screenshots after they’re read.</li>
        <li><strong>Suggested events.</strong> The details read from your screenshots (like a title, date, time, place, and notes) are saved to your account so you can review them on any device. They stay until you add, skip, or clear them.</li>
        <li><strong>Your settings.</strong> Preferences like your color theme and application deadline reminders are saved to your account.</li>
        <li><strong>Billing details.</strong> Payments are handled by Stripe. We store your Stripe customer ID, your subscription status and dates, and how many free screenshots you’ve used. We never see or store your full card number.</li>
        <li><strong>Basic technical logs.</strong> Our hosting provider keeps standard request logs (like IP address and browser type) to keep the service secure and working.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To sign you in and run your account.</li>
        <li>To read events from your screenshots and show them to you for review.</li>
        <li>To show your calendar and add only the events you choose to Google Calendar.</li>
        <li>To manage your subscription, free screenshots, and receipts.</li>
        <li>To keep the service secure, fix problems, and answer your questions.</li>
      </ul>
      <p>We don’t sell your information, we don’t show ads, and we don’t use your information to build advertising profiles.</p>

      <h2>Google user data</h2>
      <p>Booked and Busy’s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements. Specifically:</p>
      <ul>
        <li>We use Google Calendar data only to show your schedule in the app and to add events you approve.</li>
        <li>We don’t transfer Google Calendar data to anyone except as needed to provide this feature, to comply with the law, or as part of a merger or acquisition with notice to you.</li>
        <li>We don’t use Google Calendar data for advertising, and we don’t sell it.</li>
        <li>We don’t use Google Calendar data to train AI or machine learning models. Your calendar data is never sent to Gemini; only the screenshots you upload are.</li>
        <li>People don’t read your Google Calendar data unless you ask us to for support, it’s needed for security or to comply with the law, or it has been made anonymous.</li>
      </ul>

      <h2>Services we rely on</h2>
      <p>We share information only with the providers that run the app for us, and only what each one needs:</p>
      <ul>
        <li><strong>Google</strong>: sign-in, Google Calendar, and the Gemini API that reads your screenshots.</li>
        <li><strong>Supabase</strong>: account and data storage.</li>
        <li><strong>Vercel</strong>: website hosting.</li>
        <li><strong>Stripe</strong>: payments and subscription billing.</li>
      </ul>
      <p>We may also share information if required by law or to protect the safety and security of our users and service.</p>

      <h2>Your choices</h2>
      <ul>
        <li><strong>Disconnect Google Calendar</strong> any time from your account page. You can also remove access from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account permissions</a>.</li>
        <li><strong>Clear suggested events</strong> by adding or skipping them, then clearing skipped ones from the review screen.</li>
        <li><strong>Remove events we added</strong> from the review screen or your calendar page, or directly in Google Calendar.</li>
        <li><strong>Cancel your subscription</strong> any time from Manage billing on your account page.</li>
        <li><strong>Delete your account</strong> and its data by contacting us at <ContactLink />. We’ll delete it within 30 days, except billing records we’re required to keep.</li>
      </ul>

      <h2>Security and retention</h2>
      <p>Your data is protected with access controls so each account can only reach its own information, and calendar tokens are encrypted. We keep your information while your account is active and delete it when you ask us to, except where we must keep records for legal, tax, or billing reasons.</p>

      <h2>Children</h2>
      <p>Booked and Busy is made for college students and isn’t intended for anyone under 13. We don’t knowingly collect information from children under 13.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we’ll update the date above. For significant changes, we’ll let you know in the app or by email.</p>

      <h2>Contact</h2>
      <p>Questions or requests? Reach us at <ContactLink />.</p>
    </LegalPage>
  );
}
