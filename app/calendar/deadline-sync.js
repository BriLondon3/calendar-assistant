import { buildDeadlineEvent, deadlineItems, isDeadlineItemKey } from './deadlines.js';

const EVENTS = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

// Adds (value) or removes (value = null) one application on a day's shared
// deadline event. Uses the event's etag so two quick changes can't overwrite
// each other; retries a couple of times if the event changed in between.
export async function changeDeadline(token, eventId, key, value, { reminderDays, colorId }) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const date = `${eventId.slice(10, 14)}-${eventId.slice(14, 16)}-${eventId.slice(16, 18)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await fetch(`${EVENTS}/${eventId}`, { headers, signal: AbortSignal.timeout(10000), cache: 'no-store' });
    if (!existing.ok && existing.status !== 404 && existing.status !== 410) return existing;
    const current = existing.ok ? await existing.json() : null;
    // A deleted event's old applications were removed on purpose, so start fresh.
    const live = current && current.status !== 'cancelled';
    const props = Object.fromEntries(Object.entries(live ? current.extendedProperties?.private || {} : {}).filter(([name]) => isDeadlineItemKey(name)));
    if (value) props[key] = value;
    else delete props[key];

    if (!deadlineItems(props).length) {
      if (!live) return new Response(null, { status: 204 });
      const removed = await fetch(`${EVENTS}/${eventId}?sendUpdates=none`, { method: 'DELETE', headers: { ...headers, 'If-Match': current.etag }, signal: AbortSignal.timeout(15000), cache: 'no-store' });
      if (removed.status === 412) continue;
      return removed;
    }
    const body = JSON.stringify(buildDeadlineEvent({ date, props, reminderDays, colorId: colorId || (live ? current.colorId : null) }));
    const response = current
      ? await fetch(`${EVENTS}/${eventId}?sendUpdates=none`, { method: 'PUT', headers: { ...headers, 'If-Match': current.etag }, body, signal: AbortSignal.timeout(15000), cache: 'no-store' })
      : await fetch(`${EVENTS}?sendUpdates=none`, { method: 'POST', headers, body, signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (response.status === 412 || response.status === 409) continue;
    return response;
  }
  return new Response(null, { status: 409 });
}
