import { cookies } from 'next/headers';
import { authConfigured, createAuthClient, createWritableAuthClient } from '../../auth-client';
import { getCalendarAccess } from '../../calendar-connection';
import { resolveEventColor } from '../../calendar/event-colors';
import { prepareCalendarEvent } from '../../calendar/event-insert';

export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request) {
  if (!authConfigured()) return json({ error: 'Calendar access isn’t available yet.' }, 503);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin && origin !== process.env.SITE_URL) {
    return json({ error: 'Open Booked and Busy to add this event.' }, 403);
  }
  const client = await createWritableAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return json({ error: 'Please log in again.' }, 401);
  const draft = await request.json().catch(() => null);
  const { event, error } = prepareCalendarEvent(draft);
  if (error) return json({ error }, 400);

  try {
    const access = await getCalendarAccess(client, user.id);
    if (access.error) return json({ error: access.error }, 503);
    if (!access.token) return json({ error: 'Connect Google Calendar before adding this event.', reconnect: true }, 403);
    const endpoint = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const headers = { Authorization: `Bearer ${access.token}`, 'Content-Type': 'application/json' };
    const response = await fetch(`${endpoint}?sendUpdates=none`, {
      method: 'POST', headers, body: JSON.stringify(event), signal: AbortSignal.timeout(15000), cache: 'no-store',
    });
    if (response.ok) return json({ added: true });
    if (response.status === 409) {
      const existing = await fetch(`${endpoint}/${event.id}`, { headers, signal: AbortSignal.timeout(10000), cache: 'no-store' });
      if (existing.ok && (await existing.json()).status !== 'cancelled') return json({ added: true });
    }
    if (response.status === 401 || response.status === 403) {
      return json({ error: 'Reconnect Google Calendar and allow access to add events.', reconnect: true }, 403);
    }
    if (response.status === 400) return json({ error: 'Google Calendar rejected the event details. Check the dates and times, then try again.' }, 400);
    return json({ error: 'Couldn’t confirm the event was added. Try again.' }, 502);
  } catch {
    return json({ error: 'Couldn’t confirm the event was added. Try again.' }, 502);
  }
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
    fields: 'nextPageToken,summary,items(id,summary,start,end,location,status,transparency,colorId,eventLabelId)',
  });

  try {
    const headers = { Authorization: `Bearer ${access.token}` };
    const [colorsResponse, calendarResponse, labelsResponse] = await Promise.all([
      fetch('https://www.googleapis.com/calendar/v3/colors', { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) }),
      fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList/primary?fields=backgroundColor,foregroundColor', { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) }),
      fetch('https://www.googleapis.com/calendar/v3/calendars/primary?fields=labelProperties', { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) }),
    ]);
    const colors = colorsResponse.ok ? await colorsResponse.json() : {};
    const calendarColor = calendarResponse.ok ? await calendarResponse.json() : { backgroundColor: '#039be5', foregroundColor: '#ffffff' };
    const labelData = labelsResponse.ok ? await labelsResponse.json() : {};
    const labels = labelData.labelProperties?.eventLabels || [];
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

    const coloredEvents = events.map(event => {
      return {
        ...event,
        ...resolveEventColor(event, labels, colors, calendarColor),
      };
    });
    return json({ events: coloredEvents, calendarName, calendarColorAvailable: calendarResponse.ok, customColorsAvailable: labelsResponse.ok });
  } catch {
    return json({ error: 'Couldn’t load Google Calendar. Try again shortly.' }, 502);
  }
}
