import './globals.css';

export const metadata = {
  title: 'Calendar Assistant — Make room for what matters',
  description: 'A little help for your busy day. Calendar Assistant helps you organize your schedule and make time for what matters.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
