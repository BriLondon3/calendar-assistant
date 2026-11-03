import './globals.css';

export const metadata = {
  title: 'Booked and Busy — Screenshot it. Schedule it.',
  description: 'Turn screenshots from group chats, GroupMe, Flare, flyers, and invites into calendar events. Review details, spot conflicts, and add your plans to Google Calendar.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
