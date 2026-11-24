import LegalPage, { ContactLink } from '../components/legal-page';

export const metadata = {
  title: 'Terms of Service · Booked and Busy',
  description: 'The terms for using Booked and Busy.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 24, 2026">
      <p className="legal-lede">These terms cover your use of Booked and Busy. By creating an account or using the app, you agree to them. If you don’t agree, please don’t use the app.</p>

      <h2>What Booked and Busy does</h2>
      <p>Booked and Busy reads screenshots you upload, suggests calendar events from them, and adds the events you approve to your Google Calendar. It can also group application deadlines and set reminders you choose.</p>

      <h2>Your account</h2>
      <ul>
        <li>You sign in with a Google account and are responsible for activity on your account.</li>
        <li>You must be at least 13 years old to use Booked and Busy.</li>
        <li>Only upload screenshots you have the right to use, and don’t use the app for anything unlawful or to harm others.</li>
        <li>Don’t try to break, overload, or get around the app’s security or usage limits.</li>
      </ul>

      <h2>Check before you add</h2>
      <p>Event details are read automatically by AI, which can make mistakes: a wrong date, time, place, or deadline. That’s why every event waits for your review. Please check the details before adding them, and confirm important deadlines with the original source. Booked and Busy isn’t responsible for missed events, deadlines, or applications.</p>

      <h2>Plans and billing</h2>
      <ul>
        <li><strong>Free screenshots.</strong> Each account includes 3 free screenshot extractions. Screenshots that fail to process don’t count.</li>
        <li><strong>Free trial.</strong> After that, you can start a 7-day free trial. You add a payment method to start it and aren’t charged until the trial ends. Each person can use one free trial.</li>
        <li><strong>Subscription.</strong> After the trial, the subscription is $2.99 per month (plus any applicable tax) and renews automatically each month until you cancel.</li>
        <li><strong>Cancelling.</strong> You can cancel any time from Manage billing on your account page. Cancelling during the trial means you won’t be charged. After the trial, cancelling stops future charges and you keep access until the end of the month you’ve paid for. We don’t offer refunds for partial months, except where the law requires.</li>
        <li><strong>Price changes.</strong> If the price changes, we’ll tell you in advance, and the new price applies from your next billing period.</li>
        <li><strong>Payments</strong> are processed by Stripe, subject to Stripe’s terms.</li>
      </ul>

      <h2>Google Calendar</h2>
      <p>Connecting Google Calendar is optional and you can disconnect any time. Your use of Google services is also subject to Google’s terms. How we handle your data is explained in our <a href="/privacy">Privacy Policy</a>.</p>

      <h2>Changes to the app</h2>
      <p>We’re always improving Booked and Busy, so features may change. We may suspend or end accounts that break these terms. You can stop using the app at any time.</p>

      <h2>Disclaimers</h2>
      <p>Booked and Busy is provided “as is” and “as available,” without warranties of any kind, to the fullest extent the law allows. We don’t promise the app will always be available, error-free, or that extracted details will be accurate.</p>

      <h2>Limitation of liability</h2>
      <p>To the fullest extent the law allows, Booked and Busy won’t be liable for indirect, incidental, or consequential damages, or for missed events, deadlines, or opportunities. Our total liability for any claim is limited to the amount you paid us in the 12 months before the claim.</p>

      <h2>Changes to these terms</h2>
      <p>If we update these terms, we’ll change the date above, and for significant changes we’ll let you know in the app or by email. Continuing to use the app after changes means you accept the updated terms.</p>

      <h2>Contact</h2>
      <p>Questions about these terms? Reach us at <ContactLink />.</p>
    </LegalPage>
  );
}
