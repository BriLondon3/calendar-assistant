import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export function savedCalendarConfigured() {
  return Boolean(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY && process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

function encryptionKey() {
  const value = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error('Invalid calendar encryption configuration');
  return Buffer.from(value, 'hex');
}

function encrypt(token, userId) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAAD(Buffer.from(userId));
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(value => value.toString('base64url')).join('.');
}

function decrypt(value, userId) {
  const [iv, tag, ciphertext] = value.split('.').map(part => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAAD(Buffer.from(userId));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export async function saveCalendarConnection(client, session) {
  if (!savedCalendarConfigured()) return false;
  if (!session?.provider_refresh_token) throw new Error('Google did not return offline access');
  const { error } = await client.from('google_calendar_connections').upsert({
    user_id: session.user.id,
    refresh_token_encrypted: encrypt(session.provider_refresh_token, session.user.id),
  });
  if (error) throw new Error('Calendar connection storage unavailable');
  return true;
}

export async function getCalendarAccess(client, userId) {
  if (!savedCalendarConfigured()) {
    const { data: { session } } = await client.auth.getSession();
    return { token: session?.provider_token };
  }

  const { data, error } = await client.from('google_calendar_connections')
    .select('refresh_token_encrypted').eq('user_id', userId).maybeSingle();
  if (error) return { error: 'Your saved calendar connection is unavailable. Please try again later.' };
  if (!data) return { reconnect: true };

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: decrypt(data.refresh_token_encrypted, userId),
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (result.error === 'invalid_grant') return { reconnect: true };
    if (!response.ok || !result.access_token) return { error: 'Couldn’t refresh Calendar access. Please try again later.' };

    if (result.refresh_token) {
      const { error: updateError } = await client.from('google_calendar_connections')
        .update({ refresh_token_encrypted: encrypt(result.refresh_token, userId) })
        .eq('user_id', userId).eq('refresh_token_encrypted', data.refresh_token_encrypted);
      if (updateError) return { error: 'Couldn’t save refreshed Calendar access. Please try again later.' };
    }
    return { token: result.access_token };
  } catch {
    return { error: 'Couldn’t load your saved Calendar connection. Please try again later.' };
  }
}
