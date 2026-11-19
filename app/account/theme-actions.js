'use server';

import { redirect } from 'next/navigation';
import { authConfigured, createWritableAuthClient } from '../auth-client';
import { THEMES } from '../themes';

async function signedInClient() {
  if (!authConfigured()) return {};
  const client = await createWritableAuthClient();
  const { data: { user } } = await client.auth.getUser();
  return { client, user };
}

// Saves the color theme on the user's account (Supabase user metadata).
export async function saveTheme(theme) {
  if (!THEMES.some(item => item.id === theme)) return { error: 'Choose one of the color themes.' };
  const { client, user } = await signedInClient();
  if (!user) return { error: 'Please log in again to save your colors.' };
  const { error } = await client.auth.updateUser({ data: { theme } });
  if (error) return { error: 'Couldn’t save your colors. Try again.' };
  return { saved: true };
}

// Marks first-time setup (calendar + colors) as done and starts uploading.
export async function finishSetup() {
  const { client, user } = await signedInClient();
  if (!user) redirect('/signup?mode=login');
  await client.auth.updateUser({ data: { onboarded: true } });
  redirect('/upload');
}
