'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CalendarDay from '../calendar/calendar-day';
import { prepareCalendarEvent } from '../calendar/event-insert';

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(time) {
  if (!time) return '';
  return new Date(`2000-01-01T${time}:00`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function EventEditor({ event, onSave, onCancel }) {
  const [draft, setDraft] = useState(event);
  const field = (name) => ({
    value: draft[name] || '',
    onChange: (e) => setDraft(current => ({ ...current, [name]: e.target.value })),
  });

  return (
    <form className="event-edit-form" onSubmit={e => { e.preventDefault(); onSave(draft); }}>
      <label>Event name<input {...field('title')} required maxLength={300} /></label>
      <div className="review-fields">
        <label>Start date<input {...field('date')} type="date" /></label>
        <label>{draft.allDay ? 'Last day' : 'End date'}<input {...field('endDate')} type="date" /></label>
        <label>Start time<input {...field('startTime')} type="time" disabled={draft.allDay} /></label>
        <label>End time<input {...field('endTime')} type="time" disabled={draft.allDay} /></label>
      </div>
      <label className="all-day-toggle"><input type="checkbox" checked={draft.allDay} onChange={e => setDraft(current => ({ ...current, allDay: e.target.checked }))} />All-day event</label>
      <label>Location<input {...field('location')} maxLength={1000} /></label>
      <label>Description<textarea {...field('description')} maxLength={5000} rows={3} /></label>
      <div className="review-actions">
        <button className="primary-button" type="submit">Save edits</button>
        <button className="text-button" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function EventReview({ events, onChange, onReject }) {
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [calendarVersion, setCalendarVersion] = useState(0);
  const saving = useRef(false);
  const heading = useRef(null);
  const selected = events.find(event => event.id === selectedId) || events[0];
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    heading.current?.focus();
  }, []);

  async function addEvent(event) {
    if (saving.current) return;
    setSelectedId(event.id);
    setFeedback(null);
    const draft = { ...event, timeZone };
    const { error } = prepareCalendarEvent(draft);
    if (error) {
      setFeedback({ id: event.id, message: error });
      setEditingId(event.id);
      return;
    }
    saving.current = true;
    setAddingId(event.id);
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (!response.ok || !result.added) {
        setFeedback({ id: event.id, message: result.error || 'Couldn’t confirm the event was added. Try again.', reconnect: result.reconnect });
        return;
      }
      onChange(event.id, { added: true });
      setCalendarVersion(version => version + 1);
    } catch {
      setFeedback({ id: event.id, message: 'Couldn’t confirm the event was added. Try again.' });
    } finally {
      saving.current = false;
      setAddingId(null);
    }
  }

  return (
    <section className="event-review" aria-labelledby="review-heading">
      <h2 ref={heading} id="review-heading" tabIndex={-1}>Review your events</h2>
      <div className="review-layout">
        <ul className="review-list" aria-label="Extracted events">
          {events.map(event => (
            <li key={event.id}>
              <article className="review-card" data-selected={selected.id === event.id}>
                <button className="review-event-title" type="button" aria-pressed={selected.id === event.id} onClick={() => setSelectedId(event.id)}>
                  {event.title || 'Untitled event'}
                </button>
                <p className="review-date">
                  {event.date ? formatDate(event.date) : 'Date to confirm'}
                  {event.endDate && event.endDate !== event.date && ` – ${formatDate(event.endDate)}`}
                </p>
                <p className="review-date">{event.allDay ? 'All day' : event.startTime ? `${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ' · End time to confirm'}` : 'Time to confirm'}</p>
                {event.location && <p className="review-date">{event.location}</p>}
                {event.description && <p className="review-description">{event.description}</p>}
                {event.notes.length > 0 && !event.added && <details className="review-notes"><summary>Extraction notes</summary><ul>{event.notes.map((note, index) => <li key={index}>{note}</li>)}</ul></details>}
                {feedback?.id === event.id && <p role="alert" className="review-warning">{feedback.message} {feedback.reconnect && <Link href="/account">Manage Calendar connection</Link>}</p>}
                {event.added ? <p className="review-added" role="status">Added to Google Calendar</p> : editingId === event.id ? (
                  <EventEditor key={event.id} event={event} onCancel={() => setEditingId(null)} onSave={draft => {
                    onChange(event.id, draft);
                    setFeedback(null);
                    setEditingId(null);
                  }} />
                ) : (
                  <div className="review-actions">
                    <button className="primary-button" type="button" disabled={Boolean(addingId)} onClick={() => addEvent(event)}>{addingId === event.id ? 'Adding…' : 'Add to calendar'}</button>
                    <button className="text-button" type="button" disabled={Boolean(addingId)} onClick={() => { setSelectedId(event.id); setEditingId(event.id); setFeedback(null); }}>Edit</button>
                    <button className="text-button" type="button" disabled={Boolean(addingId)} onClick={() => onReject(event.id)}>Skip this</button>
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>
        <aside className="review-calendar" aria-label="Calendar for the selected event">
          <h3>Your calendar</h3>
          {selected.date
            ? <CalendarDay key={`${selected.date}:${calendarVersion}`} initialDate={selected.date} fixedDate />
            : <p>Add a date to the selected event to see that day’s calendar.</p>}
        </aside>
      </div>
    </section>
  );
}
