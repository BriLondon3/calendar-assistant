import { createHash, randomUUID } from 'node:crypto';
import { authConfigured, createWritableAuthClient } from '../../auth-client';
import { eventFingerprint } from '../../upload/review-events';
import { validColorId } from '../../calendar/google-colors';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

async function withQueue(request, run) {
  if (!authConfigured()) return json({ error: 'Review sync isn’t configured.' }, 503);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin && origin !== process.env.SITE_URL) {
    return json({ error: 'Open Booked and Busy to use the review queue.' }, 403);
  }
  const client = await createWritableAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return json({ error: 'Sign in again to use the review queue.' }, 401);
  const queue = () => client.from('review_events');
  try {
    return await run(queue, user.id);
  } catch (error) {
    console.error('Review queue request failed', { code: error?.code });
    return json({ error: 'Couldn’t sync your review queue. Try again shortly.' }, 503);
  }
}

function details(value) {
  const string = (key, max) => typeof value?.[key] === 'string' ? value[key].slice(0, max) : '';
  const date = key => {
    const input = value?.[key];
    if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input) || !Number.isFinite(Date.parse(input))) return null;
    return new Date(input).toISOString().slice(0, 10) === input ? input : null;
  };
  const time = key => {
    const input = value?.[key];
    return typeof input === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input) ? input : null;
  };
  return {
    title: string('title', 300), date: date('date'),
    endDate: date('endDate'), startTime: time('startTime'),
    endTime: time('endTime'), allDay: value?.allDay === true,
    location: string('location', 1000), description: string('description', 5000),
    notes: Array.isArray(value?.notes) ? value.notes.filter(note => typeof note === 'string').slice(0, 12).map(note => note.slice(0, 1000)) : [],
    // Chosen Google Calendar color, and whether the user skipped it (skips can be undone).
    colorId: validColorId(value?.colorId), skipped: value?.skipped === true,
  };
}

function present(row) {
  return { ...row.event, queueId: row.id, version: row.version };
}

export function GET(request) {
  return withQueue(request, async (queue, userId) => {
    const { data, error } = await queue().select('id,event,version').eq('user_id', userId).order('created_at').order('id');
    if (error) throw error;
    return json({ events: data.map(present) });
  });
}

export function POST(request) {
  return withQueue(request, async (queue, userId) => {
    const body = await request.json().catch(() => null);
    if (!Array.isArray(body?.events) || !body.events.length || body.events.length > 20) return json({ error: 'Choose up to 20 extracted events.' }, 400);
    const rows = new Map();
    for (const value of body.events) {
      const event = details(value);
      if (!event.title.trim()) return json({ error: 'An extracted event is missing its title.' }, 400);
      const fingerprint = createHash('sha256').update(eventFingerprint(event)).digest('hex');
      if (!rows.has(fingerprint)) rows.set(fingerprint, { user_id: userId, fingerprint, event: { ...event, id: randomUUID() } });
    }
    const { error } = await queue().upsert([...rows.values()], { onConflict: 'user_id,fingerprint', ignoreDuplicates: true });
    if (error) throw error;
    return json({ saved: true });
  });
}

export function PATCH(request) {
  return update(request, false);
}

export function DELETE(request) {
  return update(request, true);
}

function update(request, remove) {
  return withQueue(request, async (queue, userId) => {
    const body = await request.json().catch(() => null);
    if (typeof body?.queueId !== 'string' || !/^[\da-f-]{36}$/i.test(body.queueId) || !Number.isSafeInteger(body.version) || body.version < 0) {
      return json({ error: 'Choose a valid review event.' }, 400);
    }
    const match = query => query.eq('user_id', userId).eq('id', body.queueId).eq('version', body.version);
    if (remove) {
      const { data, error } = await match(queue().delete()).select('id').maybeSingle();
      if (error) throw error;
      return data ? json({ removed: true }) : json({ error: 'This event changed on another device. Refresh the queue.' }, 409);
    }
    const { data: row, error: readError } = await match(queue().select('event')).maybeSingle();
    if (readError) throw readError;
    if (!row) return json({ error: 'This event changed on another device. Refresh the queue.' }, 409);

    const fields = body.fields;
    if (!fields || typeof fields !== 'object') return json({ error: 'Send event changes.' }, 400);
    let event;
    if (fields.added === true) {
      event = { ...row.event, added: true, calendarEventId: `bb${row.event.id.replaceAll('-', '')}` };
    } else if (fields.added === false && row.event.added) {
      event = { ...row.event, id: randomUUID(), added: false, calendarEventId: null };
    } else if (!row.event.added) {
      event = { ...row.event, ...details({ ...row.event, ...fields }) };
    } else {
      return json({ error: 'Remove this event from Google Calendar before editing.' }, 409);
    }
    const { data, error } = await match(queue().update({ event, version: body.version + 1 })).select('id,event,version').maybeSingle();
    if (error) throw error;
    return data ? json({ event: present(data) }) : json({ error: 'This event changed on another device. Refresh the queue.' }, 409);
  });
}
