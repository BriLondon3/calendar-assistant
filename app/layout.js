import './globals.css';
import { getCurrentUser } from './auth-client';
import { validTheme } from './themes';

const siteUrl = process.env.SITE_URL || 'https://calendar-assistant-tau.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Booked and Busy — Screenshot it. Schedule it.',
  description: 'Turn screenshots from GroupMe, Flare, texts, emails, and flyers into calendar events. Review them next to your schedule and add the ones you want to Google Calendar in one click. Made for college students.',
  openGraph: {
    title: 'Booked and Busy — Screenshot it. Schedule it.',
    description: 'Turn screenshots from group chats, invites, and flyers into Google Calendar events in one click.',
    images: [{ url: '/scattered-plans-to-calendar.png', width: 1672, height: 941, alt: 'Screenshots becoming organized calendar events' }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', images: ['/scattered-plans-to-calendar.png'] },
};

export const viewport = { themeColor: '#faf7f1' };

// Signed-in users see the color theme they chose; everyone else sees the brand default.
export default async function RootLayout({ children }) {
  const user = await getCurrentUser().catch(() => null);
  const theme = validTheme(user?.user_metadata?.theme);
  return <html lang="en" data-theme={theme}><body>{children}</body></html>;
}
