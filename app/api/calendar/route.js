import { cookies } from 'next/headers';
import { authConfigured, createAuthClient } from '../../auth-client';
import { getCalendarAccess } from '../../calendar-connection';

export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET(request) {
  if (!authConfigured()) return json({ error: 'Calendar access isn’t available yet.' }, 503);
  const jar = await cookies();
  const client = createAuthClient({ getAll: () => jar.getAll(), setAll: () => {} });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return json({ error: 'Please log in again.' }, 401);

  const params = new URL(request.url).searchParams;
  const start = new Date(params.get('start') || '');
  const end = new Date(params.get('end') || '');
  const duration = end - start;
  if (!Number.isFinite(duration) || duration < 0 || duration > 26 * 60 * 60 * 1000 || duration === 0) {
    return json({ error: 'Choose a valid calendar day.' }, 400);
  }

  const access = await getCalendarAccess(client, user.id);
  if (access.error) return json({ error: access.error }, 503);
  if (!access.token) return json({ error: 'Connect Google Calendar to load your plans.', reconnect: true }, 403);

  const query = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
    fields: 'nextPageToken,summary,items(id,summary,start,end,location,status,transparency)',
  });

  try {
    const events = [];
    let pageToken;
    let calendarName;
    do {
      if (pageToken) query.set('pageToken', pageToken);
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${query}`, {
        headers: { Authorization: `Bearer ${access.token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 401) return json({ error: 'Your calendar connection expired. Connect Google Calendar again.', reconnect: true }, 403);
      if (response.status === 403) return json({ error: 'Calendar access wasn’t granted. Reconnect and allow Calendar access. If this continues, check that the Google Calendar API is enabled.', reconnect: true }, 403);
      if (!response.ok) return json({ error: 'Google Calendar is unavailable right now. Try again shortly.' }, 502);
      const data = await response.json();
      events.push(...(data.items || []).filter(event => event.status !== 'cancelled'));
      calendarName = data.summary;
      pageToken = data.nextPageToken;
    } while (pageToken);

    return json({ events, calendarName });
  } catch {
    return json({ error: 'Couldn’t load Google Calendar. Try again shortly.' }, 502);
  }
}
