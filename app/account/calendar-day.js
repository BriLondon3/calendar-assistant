'use client';

import { useEffect, useState } from 'react';

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function eventTime(event, timeZone) {
  if (event.start?.date) return 'All day';
  const format = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone });
  return `${format.format(new Date(event.start.dateTime))} – ${format.format(new Date(event.end.dateTime))}`;
}

export default function CalendarDay() {
  const [date, setDate] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDate(localDateString(new Date()));
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    if (!date) {
      setResult(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const query = new URLSearchParams({ start: start.toISOString(), end: end.toISOString() });
    setLoading(true);
    setResult(null);

    async function loadDay() {
      try {
        const response = await fetch(`/api/calendar?${query}`, { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (!controller.signal.aborted) setResult(data);
      } catch {
        if (!controller.signal.aborted) setResult({ error: 'Couldn’t load your calendar. Refresh to try again.' });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadDay();
    return () => controller.abort();
  }, [date]);

  return (
    <div className="calendar-day" aria-busy={loading}>
      <label htmlFor="calendar-date">Choose a day</label>
      <input id="calendar-date" type="date" value={date} onChange={event => setDate(event.target.value)} />
      <p className="calendar-timezone">Times shown in {timeZone || 'your local time zone'}. Primary calendar.</p>
      <div aria-live="polite">
        {loading && <p>Loading your calendar…</p>}
        {result?.error && <p role="status">{result.error}</p>}
        {result?.events?.length === 0 && <p>No events on this day.</p>}
        {result?.events?.length > 0 && (
          <ul className="calendar-events">
            {result.events.map(event => (
              <li key={event.id}>
                <span className="calendar-event-time">{eventTime(event, timeZone)}</span>
                <strong>{event.summary || 'Untitled event'}</strong>
                {event.location && <span>{event.location}</span>}
                {event.transparency === 'transparent' && <span>Shown as available</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
