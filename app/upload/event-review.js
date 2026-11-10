'use client';

import { useState } from 'react';
import CalendarDay from '../calendar/calendar-day';

export default function EventReview({ events, onChange, onReject }) {
  const [calendarDate, setCalendarDate] = useState('');

  return (
    <section className="event-review" aria-labelledby="review-heading">
      <h2 id="review-heading">Review your events</h2>
      <p>Check the extracted details and fill in anything missing. These suggestions stay in this tab. Saving events to Google Calendar is coming next.</p>
      {events.map(event => (
        <article key={event.id} className="review-card">
          <p className="review-source">From {event.source}</p>
          <label>Event name<input value={event.title} maxLength={300} onChange={e => onChange(event.id, 'title', e.target.value)} /></label>
          <div className="review-fields">
            <label>Start date<input type="date" value={event.date || ''} onChange={e => onChange(event.id, 'date', e.target.value)} /></label>
            <label>End date<input type="date" value={event.endDate || ''} onChange={e => onChange(event.id, 'endDate', e.target.value)} /></label>
            <label>Start time<input type="time" value={event.startTime || ''} disabled={event.allDay} onChange={e => onChange(event.id, 'startTime', e.target.value)} /></label>
            <label>End time<input type="time" value={event.endTime || ''} disabled={event.allDay} onChange={e => onChange(event.id, 'endTime', e.target.value)} /></label>
          </div>
          <label className="all-day-toggle"><input type="checkbox" checked={event.allDay} onChange={e => onChange(event.id, 'allDay', e.target.checked)} />All-day event</label>
          <label>Location<input value={event.location} maxLength={1000} onChange={e => onChange(event.id, 'location', e.target.value)} /></label>
          <label>Description<textarea value={event.description} maxLength={5000} rows={3} onChange={e => onChange(event.id, 'description', e.target.value)} /></label>
          {(!event.date || (!event.allDay && (!event.startTime || !event.endTime))) && <p className="review-warning">Some dates or times are missing. Check the screenshot before making plans.</p>}
          {event.notes.length > 0 && <ul className="review-notes">{event.notes.map((note, index) => <li key={index}>{note}</li>)}</ul>}
          <div className="review-actions">
            <button className="primary-button" type="button" disabled={!event.date} onClick={() => setCalendarDate(event.date)}>View this day’s calendar</button>
            <button className="text-button" type="button" onClick={() => onReject(event.id)}>Reject suggestion</button>
          </div>
        </article>
      ))}
      {calendarDate && <section className="review-calendar" aria-label="Calendar for the selected event date"><h3>Your calendar for this event</h3><CalendarDay initialDate={calendarDate} /></section>}
    </section>
  );
}
