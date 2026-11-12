'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { layoutDayEvents, readableTextColor } from './day-layout';
import { isBookedAndBusyEvent } from './event-insert';

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function eventTime(event, timeZone) {
  if (event.start?.date) return 'All day';
  const format = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone });
  return `${format.format(new Date(event.start.dateTime))} – ${format.format(new Date(event.end.dateTime))}`;
}

export default function CalendarDay({ initialDate, fixedDate = false, preview }) {
  const [date, setDate] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const timeline = useRef(null);
  const previewStart = preview?.start?.dateTime;

  useEffect(() => {
    if (result?.events && timeline.current) {
      const timed = layoutDayEvents(result.events, date);
      const firstMinute = timed[0]?.startMinute ?? 480;
      const proposedStart = previewStart ? new Date(previewStart) : null;
      const minute = proposedStart ? proposedStart.getHours() * 60 + proposedStart.getMinutes() : Math.min(480, firstMinute);
      timeline.current.scrollTop = Math.max(0, (minute - 30) / 60 * 64);
    }
  }, [result, date, previewStart]);

  useEffect(() => {
    setDate(initialDate || localDateString(new Date()));
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [initialDate]);

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
      {!fixedDate && <>
        <label htmlFor="calendar-date">Choose a day</label>
        <input id="calendar-date" type="date" value={date} onChange={event => setDate(event.target.value)} />
      </>}
      <p className="calendar-timezone">Times shown in {timeZone || 'your local time zone'}. Primary calendar.</p>
      <div aria-live="polite">
        {loading && <p>Loading your calendar…</p>}
        {result?.error && <p role="status">{result.error}</p>}
        {result?.events?.length === 0 && !preview && <p>No events on this day.</p>}
        {result?.events && <DayTimeline events={result.events} preview={preview} date={date} timeZone={timeZone} timelineRef={timeline}
          onRemove={fixedDate ? undefined : id => setResult(current => current?.events ? { ...current, events: current.events.filter(event => event.id !== id) } : current)} />}
        {result?.calendarColorAvailable === false && result?.events && <p className="calendar-timezone">Event colors are shown where available. <Link href="/account">Reconnect Calendar</Link> to also use your calendar’s default color.</p>}
        {result?.customColorsAvailable === false && result?.events && <p className="calendar-timezone"><Link href="/account">Reconnect Calendar</Link> to use your custom Google event colors.</p>}
      </div>
    </div>
  );
}

function DayTimeline({ events, preview, date, timeZone, timelineRef, onRemove }) {
  const entries = preview ? [...events, { ...preview, id: 'proposed-event', proposed: true }] : events;
  const timed = layoutDayEvents(entries, date);
  const allDay = entries.filter(event => event.start?.date);
  const [selected, setSelected] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => { setSelected(null); }, [date, preview?.summary, preview?.start?.dateTime, preview?.end?.dateTime]);

  function colorStyle(event) {
    if (event.proposed) return {};
    return { backgroundColor: event.backgroundColor || '#039be5', color: readableTextColor(event.backgroundColor) };
  }

  async function removeSelected() {
    setRemoving(true);
    setRemoveError('');
    try {
      const response = await fetch('/api/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selected.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.removed) throw new Error(result.error || 'Couldn’t remove this event.');
      onRemove(selected.id);
      setSelected(null);
    } catch (error) {
      setRemoveError(error.message);
    } finally {
      setRemoving(false);
    }
  }

  function selectEvent(event) {
    if (removing) return;
    setRemoveError('');
    setSelected(event);
  }

  return (
    <div className="day-view">
      <div className="day-view-heading">{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      {allDay.length > 0 && <div className="all-day-row"><span>All day</span><div>{allDay.map(event => <button key={event.id} className={event.proposed ? 'proposed-event' : undefined} type="button" onClick={() => selectEvent(event)} style={colorStyle(event)}>{event.proposed && 'Proposed · '}{event.summary || 'Untitled event'}</button>)}</div></div>}
      <div className="day-scroll" ref={timelineRef} tabIndex={0} role="region" aria-label="Scrollable 24-hour day calendar">
        <div className="hour-labels" aria-hidden="true">
          {Array.from({ length: 24 }, (_, hour) => <span key={hour} style={{ top: hour * 64 }}>{hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}</span>)}
        </div>
        <div className="day-grid">
          {timed.map(event => <button
            type="button"
            className={event.proposed ? 'timed-event proposed-event' : 'timed-event'}
            key={event.id}
            style={{
              ...colorStyle(event),
              top: event.startMinute / 60 * 64,
              height: (event.endMinute - event.startMinute) / 60 * 64,
              left: `calc(${event.column / event.columns * 100}% + 2px)`,
              width: `calc(${100 / event.columns}% - 4px)`,
            }}
            onClick={() => selectEvent(event)}
            aria-label={`${event.proposed ? 'Proposed event: ' : ''}${event.summary || 'Untitled event'}, ${eventTime(event, timeZone)}`}
            title={`${event.summary || 'Untitled event'}\n${eventTime(event, timeZone)}`}
          ><strong>{event.proposed && 'Proposed · '}{event.summary || 'Untitled event'}</strong><span>{eventTime(event, timeZone)}</span>{event.location && <span>{event.location}</span>}</button>)}
        </div>
      </div>
      {selected && <section className="selected-event" aria-label="Selected event details" aria-live="polite">
        <button className="text-button" type="button" disabled={removing} onClick={() => setSelected(null)}>Close details</button>
        <h3>{selected.summary || 'Untitled event'}</h3>
        <p>{eventTime(selected, timeZone)}</p>
        {selected.location && <p>{selected.location}</p>}
        {selected.transparency === 'transparent' && <p>Shown as available</p>}
        {removeError && <p role="alert">{removeError}</p>}
        {onRemove && isBookedAndBusyEvent(selected.id) && <button className="review-skip-button" type="button" disabled={removing} onClick={removeSelected}>{removing ? 'Removing…' : 'Remove from calendar'}</button>}
      </section>}
    </div>
  );
}
