import { redirect } from 'next/navigation';
import { getCurrentUser } from '../auth-client';
import SiteHeader from '../components/site-header';
import ScreenshotPicker from './screenshot-picker';

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?mode=login');

  return (
    <div className="workspace">
      <SiteHeader user={user} active="upload" />
      <main className="upload-page">
        <ScreenshotPicker />
      </main>
    </div>
  );
}
