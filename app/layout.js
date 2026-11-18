import './globals.css';

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

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
