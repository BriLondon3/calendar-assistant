import { prepareCalendarEvent } from '../calendar/event-insert.js';

export function eventFingerprint(event) {
  return JSON.stringify([
    event.title, event.date, event.endDate, event.startTime, event.endTime,
    event.allDay, event.location, event.description,
  ]);
}

export function mergeExtractedEvents(current, incoming) {
  const events = new Map(current.map(event => [event.fingerprint, event]));
  for (const event of incoming) {
    const existing = events.get(event.fingerprint);
    events.set(event.fingerprint, existing ? {
      ...existing,
      screenshotIds: [...new Set([...existing.screenshotIds, ...event.screenshotIds])],
    } : event);
  }
  return [...events.values()];
}

export function groupEventsByDay(events) {
  const groups = new Map();
  const start = event => event.allDay ? '' : event.startTime || '24:00';
  const sorted = [...events].sort((a, b) =>
    (a.date || '9999-99-99').localeCompare(b.date || '9999-99-99', 'en') || start(a).localeCompare(start(b), 'en'));
  for (const event of sorted) {
    const date = event.date || '';
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(event);
  }
  return [...groups.entries()];
}


export function proposedEventsForDay(events, date, timeZone) {
  if (!date) return [];
  return events.flatMap(draft => {
    if (draft.added || !draft.date || draft.date > date || (draft.endDate || draft.date) < date) return [];
    const { event } = prepareCalendarEvent({ ...draft, timeZone });
    if (!event || event.end.dateTime === `${date}T00:00:00`) return [];
    return [{ ...event, proposed: true }];
  });
}
