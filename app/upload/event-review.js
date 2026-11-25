'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CalendarDay from '../calendar/calendar-day';
import { prepareCalendarEvent } from '../calendar/event-insert';
import { groupEventsByDay, proposedEventsForDay } from './review-events';
import { GOOGLE_EVENT_COLORS, googleColor } from '../calendar/google-colors';
import { deadlineItemKey, deadlineLabel } from '../calendar/deadlines';

// Local YYYY-MM-DD for "today + days".
function daysFromToday(days) {
  const day = new Date();
  day.setDate(day.getDate() + days);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}

// For postings without a deadline: let the user choose when they want to apply by.
function ApplyByPicker({ disabled, onPick }) {
  const [custom, setCustom] = useState('');
  const quick = [['In 3 days', 3], ['In 1 week', 7], ['In 2 weeks', 14]];
  return (
    <div className="apply-by">
      <p><strong>No deadline listed.</strong> When do you want to apply by? We’ll put it on your calendar with your reminders.</p>
      <div className="apply-by-options">
        {quick.map(([label, days]) => (
          <button key={days} type="button" className="apply-by-chip" disabled={disabled} onClick={() => onPick(daysFromToday(days))}>{label}</button>
        ))}
        <label className="apply-by-date">
          <span className="visually-hidden">Pick an apply-by date</span>
          <input type="date" min={daysFromToday(0)} value={custom} disabled={disabled} onChange={e => setCustom(e.target.value)} />
        </label>
        {custom && <button type="button" className="apply-by-chip is-set" disabled={disabled} onClick={() => onPick(custom)}>Set {shortDate(custom)}</button>}
      </div>
    </div>
  );
}

function shortDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

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

  const deadline = draft.kind === 'deadline';
  function setDeadline(on) {
    setDraft(current => on
      ? { ...current, kind: 'deadline', allDay: true, endDate: null, endTime: null }
      : { ...current, kind: 'event' });
  }

  return (
    <form className="event-edit-form" onSubmit={e => { e.preventDefault(); onSave(draft); }}>
      <label className="all-day-toggle deadline-toggle"><input type="checkbox" checked={deadline} onChange={e => setDeadline(e.target.checked)} />💼 Application deadline (internship, job, program)</label>
      <label>{deadline ? 'Name on your calendar' : 'Event name'}<input {...field('title')} required maxLength={300} /></label>
      {deadline ? <>
        <div className="review-fields">
          <label>Company or organization<input {...field('company')} maxLength={120} /></label>
          <label>Role or program<input {...field('role')} maxLength={200} /></label>
          <label>Due date<input {...field('date')} type="date" required /></label>
          <label>Due time (optional)<input {...field('startTime')} type="time" /></label>
        </div>
        <label>Job posting link (optional)<input {...field('link')} type="url" maxLength={500} placeholder="https://" /></label>
      </> : <>
      <div className="review-fields">
        <label>Start date<input {...field('date')} type="date" /></label>
        <label>{draft.allDay ? 'Last day' : 'End date'}<input {...field('endDate')} type="date" /></label>
        <label>Start time<input {...field('startTime')} type="time" disabled={draft.allDay} /></label>
        <label>End time<input {...field('endTime')} type="time" disabled={draft.allDay} /></label>
      </div>
      <label className="all-day-toggle"><input type="checkbox" checked={draft.allDay} onChange={e => setDraft(current => ({ ...current, allDay: e.target.checked }))} />All-day event</label>
      <label>Location<input {...field('location')} maxLength={1000} /></label>
      </>}
      <label>Description<textarea {...field('description')} maxLength={5000} rows={3} /></label>
      <div className="review-actions">
        <button className="primary-button" type="submit">Save edits</button>
        <button className="text-button" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function ColorPicker({ value, disabled, title, onPick }) {
  return (
    <div className="color-picker" role="radiogroup" aria-label={`Google Calendar color for ${title || 'this event'}`}>
      <button type="button" role="radio" aria-checked={!value} className="color-dot color-dot-default" title="Calendar default" aria-label="Calendar default color" disabled={disabled} onClick={() => onPick(null)} />
      {GOOGLE_EVENT_COLORS.map(color => (
        <button key={color.id} type="button" role="radio" aria-checked={value === color.id} className="color-dot" title={color.name} aria-label={color.name} style={{ '--dot': color.hex }} disabled={disabled} onClick={() => onPick(color.id)} />
      ))}
    </div>
  );
}

export default function EventReview({ events, onChange, onReject, onUploadMore }) {
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [calendarVersion, setCalendarVersion] = useState(0);
  const [pendingColors, setPendingColors] = useState({});
  const [undoId, setUndoId] = useState(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const saving = useRef(false);
  const heading = useRef(null);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Colors show instantly while they save in the background.
  const colorOf = event => Object.hasOwn(pendingColors, event.queueId) ? pendingColors[event.queueId] : event.colorId || null;
  const withColors = events.map(event => ({ ...event, colorId: colorOf(event) }));
  const active = withColors.filter(event => !event.skipped);
  const skipped = withColors.filter(event => event.skipped);
  const selected = active.find(event => event.id === selectedId) || active[0];
  const undoEvent = undoId && skipped.find(event => event.queueId === undoId);
  const busy = Boolean(addingId) || Object.keys(pendingColors).length > 0;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!undoId) return;
    const timer = setTimeout(() => setUndoId(null), 4000);
    return () => clearTimeout(timer);
  }, [undoId]);

  async function updateCalendar(event, remove = false) {
    if (saving.current) return;
    setSelectedId(event.id);
    setFeedback(null);
    const draft = { ...event, timeZone };
    const { error } = remove ? {} : prepareCalendarEvent(draft);
    if (error) {
      setFeedback({ id: event.id, message: error });
      setEditingId(event.id);
      return;
    }
    saving.current = true;
    setAddingId(event.id);
    try {
      const response = await fetch('/api/calendar', {
        method: remove ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remove
          ? { eventId: event.calendarEventId, ...(event.kind === 'deadline' && { itemKey: deadlineItemKey(event.id) }) }
          : draft),
      });
      const result = await response.json();
      if (!response.ok || !(remove ? result.removed : result.added)) {
        setFeedback({ id: event.id, message: result.error || 'Couldn’t update Google Calendar. Try again.', reconnect: result.reconnect });
        return;
      }
      setCalendarVersion(version => version + 1);
      try {
        const updated = await onChange(event, { added: !remove });
        setSelectedId(updated.id);
      } catch (error) {
        setFeedback({ id: event.id, message: `Google Calendar was updated, but the review queue didn’t sync. ${error.message}` });
      }
    } catch {
      setFeedback({ id: event.id, message: 'Couldn’t update Google Calendar. Try again.' });
    } finally {
      saving.current = false;
      setAddingId(null);
    }
  }

  async function saveReviewChange(event, fields) {
    if (saving.current) return;
    saving.current = true;
    setAddingId(event.id);
    setFeedback(null);
    try {
      if (fields) {
        await onChange(event, fields);
        setEditingId(null);
      } else {
        await onReject(event);
      }
    } catch (error) {
      setFeedback({ id: event.id, message: error.message });
    } finally {
      saving.current = false;
      setAddingId(null);
    }
  }

  async function pickColor(event, colorId) {
    if (saving.current || (event.colorId || null) === colorId) return;
    saving.current = true;
    setSelectedId(event.id);
    setFeedback(null);
    setPendingColors(current => ({ ...current, [event.queueId]: colorId }));
    try {
      await onChange(event, { colorId });
    } catch (error) {
      setFeedback({ id: event.id, message: `Couldn’t save that color. ${error.message}` });
    } finally {
      saving.current = false;
      setPendingColors(current => {
        const next = { ...current };
        delete next[event.queueId];
        return next;
      });
    }
  }

  // Skipping hides the event instead of deleting it, so a misclick can be undone.
  async function skipEvent(event) {
    if (saving.current) return;
    saving.current = true;
    setAddingId(event.id);
    setFeedback(null);
    try {
      await onChange(event, { skipped: true });
      setUndoId(event.queueId);
    } catch (error) {
      setFeedback({ id: event.id, message: error.message });
    } finally {
      saving.current = false;
      setAddingId(null);
    }
  }

  async function restoreEvent(event) {
    if (saving.current) return;
    saving.current = true;
    setAddingId(event.id);
    try {
      const updated = await onChange(event, { skipped: false });
      setUndoId(null);
      if (updated) setSelectedId(updated.id);
    } catch (error) {
      setFeedback({ id: event.id, message: error.message });
    } finally {
      saving.current = false;
      setAddingId(null);
    }
  }

  async function clearSkipped() {
    if (saving.current) return;
    saving.current = true;
    setAddingId('clearing');
    try {
      for (const event of skipped) await onReject(event);
      setUndoId(null);
      setShowSkipped(false);
    } catch (error) {
      setFeedback({ id: 'skipped', message: error.message });
    } finally {
      saving.current = false;
      setAddingId(null);
    }
  }

  const previews = selected ? proposedEventsForDay(withColors, selected.date, timeZone) : [];
  const focusedPreview = selected && !selected.added ? prepareCalendarEvent({ ...selected, timeZone }).event?.id : null;

  return (
    <section className="event-review" aria-labelledby="review-heading">
      <div className="review-heading-row">
        <h1 ref={heading} id="review-heading" tabIndex={-1}>Review events</h1>
        <button className="text-button" type="button" disabled={busy} onClick={onUploadMore}>Upload more screenshots</button>
      </div>
      <div className="review-layout">
        <div className="review-list" aria-label="Extracted events">
          {active.length === 0 && (
            <div className="review-done">
              <span aria-hidden="true">🎉</span>
              <p><strong>All caught up.</strong> Nothing left to review.</p>
              <button className="primary-button" type="button" onClick={onUploadMore}>Upload more screenshots</button>
            </div>
          )}
          {groupEventsByDay(active).map(([date, dayEvents]) => (
            <section key={date} className="review-day-group">
              <h3 className="review-day-divider">{date ? new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Date to confirm'}</h3>
              <ul className="review-list">
                {dayEvents.map(event => {
                  const color = googleColor(event.colorId);
                  const deadline = event.kind === 'deadline';
                  // Other applications already on this day's deadline event.
                  const sameDay = deadline && event.date
                    ? active.filter(other => other.kind === 'deadline' && other.added && other.date === event.date && other.id !== event.id)
                    : [];
                  return (
                  <li key={event.id}>
                    <article className="review-card" data-deadline={deadline || undefined} data-selected={selected?.id === event.id} data-has-picker={!event.added} style={color ? { '--event-color': color.hex } : undefined}>
                      <div className="review-card-main">
                      <div className="review-card-heading">
                        <button className="review-event-title" type="button" aria-pressed={selected?.id === event.id} onClick={() => setSelectedId(event.id)}>
                          {event.title || 'Untitled event'}
                        </button>
                        {!event.added && <button className="review-edit-button" type="button" aria-label={`Edit ${event.title || 'event'}`} title="Edit event" disabled={busy} onClick={() => { setSelectedId(event.id); setEditingId(event.id); setFeedback(null); }}><span aria-hidden="true">✎</span></button>}
                      </div>
                      {deadline && <p className="deadline-badge"><span aria-hidden="true">💼</span>Application deadline</p>}
                      <div className="review-event-meta">
                      {deadline && (event.company || event.role) && !(event.title || '').includes(event.company || event.role) && <p className="review-date deadline-who"><strong>{event.company || 'Company to confirm'}</strong>{event.role && ` · ${event.role}`}</p>}
                      <p className="review-date">
                        {deadline && event.date && 'Due '}{event.date ? formatDate(event.date) : deadline ? 'Apply-by date: not set' : 'Date to confirm'}
                        {event.endDate && event.endDate !== event.date && ` – ${formatDate(event.endDate)}`}
                      </p>
                      <p className="review-date">{deadline ? (event.startTime ? `Due by ${formatTime(event.startTime)} · all-day reminder` : 'All-day reminder') : event.allDay ? 'All day' : event.startTime ? `${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ' · End time to confirm'}` : 'Time to confirm'}</p>
                      {event.location && <p className="review-date">{event.location}</p>}
                      </div>
                      {!event.added && <p className="review-color-label">{color ? <><i style={{ background: color.hex }} />{color.name}</> : 'Calendar default color'}</p>}
                      {deadline && (event.link || event.postingId) && <p className="review-date">{event.link && <a className="deadline-link" href={event.link} target="_blank" rel="noopener noreferrer">Open job posting ↗</a>}{event.link && event.postingId && ' · '}{event.postingId && `Posting ID ${event.postingId}`}</p>}
                      {event.description && <p className="review-description">{event.description}</p>}
                      {deadline && !event.added && !event.date && editingId !== event.id && <ApplyByPicker disabled={busy} onPick={date => saveReviewChange(event, { date })} />}
                      {deadline && !event.added && event.date && <p className="deadline-hint">{sameDay.length
                        ? <>Joins your {shortDate(event.date)} deadlines with {sameDay.map(other => other.company || deadlineLabel(other)).join(', ')}.</>
                        : <>Creates an all-day “applications due” event on {shortDate(event.date)}, with the reminders from <Link href="/account#deadlines">your account</Link>.</>}</p>}
                      {event.notes.length > 0 && !event.added && <details className="review-notes"><summary>Extraction notes</summary><ul>{event.notes.map((note, index) => <li key={index}>{note}</li>)}</ul></details>}
                      {feedback?.id === event.id && <p role="alert" className="review-warning">{feedback.message} {feedback.reconnect && <Link href="/account">Manage Calendar connection</Link>}</p>}
                      {event.added ? <div className="review-actions"><p className="review-added" role="status">{color && <i className="review-added-dot" style={{ background: color.hex }} />}{deadline && event.date ? `Added to your ${shortDate(event.date)} deadlines` : 'Added to Google Calendar'}</p><button className="review-skip-button" type="button" disabled={busy} onClick={() => updateCalendar(event, true)}>{addingId === event.id ? 'Removing…' : 'Remove from calendar'}</button></div> : editingId === event.id ? (
                        <EventEditor key={`${event.id}:${event.version}`} event={event} onCancel={() => setEditingId(null)} onSave={draft => saveReviewChange(event, draft)} />
                      ) : (
                        <div className="review-actions">
                          {!(deadline && !event.date) && <button className="primary-button" type="button" disabled={busy} onClick={() => updateCalendar(event)}>{addingId === event.id ? 'Adding…' : deadline ? 'Add to deadlines' : 'Add to calendar'}</button>}
                          <button className="review-skip-button" type="button" disabled={busy} onClick={() => skipEvent(event)}>Skip this</button>
                        </div>
                      )}
                      </div>
                      {!event.added && <ColorPicker value={event.colorId} title={event.title} disabled={busy} onPick={colorId => pickColor(event, colorId)} />}
                    </article>
                  </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {skipped.length > 0 && (
            <section className="review-skipped" aria-labelledby="skipped-heading">
              <button className="review-skipped-toggle" type="button" aria-expanded={showSkipped} onClick={() => setShowSkipped(open => !open)}>
                <span id="skipped-heading">Skipped ({skipped.length})</span><span aria-hidden="true">{showSkipped ? '▴' : '▾'}</span>
              </button>
              {showSkipped && <>
                <ul>
                  {skipped.map(event => (
                    <li key={event.id}>
                      <div><strong>{event.title || 'Untitled event'}</strong><span>{event.date ? formatDate(event.date) : 'Date to confirm'}{event.startTime && !event.allDay ? ` · ${formatTime(event.startTime)}` : ''}</span></div>
                      <button className="text-button" type="button" disabled={busy} onClick={() => restoreEvent(event)}>{addingId === event.id ? 'Restoring…' : 'Restore'}</button>
                    </li>
                  ))}
                </ul>
                {feedback?.id === 'skipped' && <p role="alert" className="review-warning">{feedback.message}</p>}
                <button className="review-clear-skipped" type="button" disabled={busy} onClick={clearSkipped}>{addingId === 'clearing' ? 'Clearing…' : 'Clear skipped for good'}</button>
              </>}
            </section>
          )}
        </div>
        <aside className="review-calendar" aria-label="Calendar for the selected event">
          <h3>Your calendar</h3>
          {selected?.date
            ? <CalendarDay key={`${selected.date}:${calendarVersion}`} initialDate={selected.date} fixedDate previews={previews} focusedPreview={focusedPreview} />
            : <p>{selected ? 'Add a date to the selected event to see that day’s calendar.' : 'Pick an event to see that day’s calendar.'}</p>}
        </aside>
      </div>

      {undoEvent && (
        <div className="undo-toast" role="status">
          <span>Skipped “{undoEvent.title || 'Untitled event'}”</span>
          <button type="button" disabled={busy} onClick={() => restoreEvent(undoEvent)}>Undo</button>
        </div>
      )}
    </section>
  );
}
