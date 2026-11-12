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
    (a.date || '9999-99-99').localeCompare(b.date || '9999-99-99') || start(a).localeCompare(start(b)));
  for (const event of sorted) {
    const date = event.date || '';
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(event);
  }
  return [...groups.entries()];
}
