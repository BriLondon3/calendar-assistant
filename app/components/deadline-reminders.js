'use client';

import { useState } from 'react';
import { REMINDER_HOUR, REMINDER_OPTIONS, reminderSummary } from '../calendar/deadlines';
import { saveDeadlineReminders } from '../account/deadline-actions';

// Choose when Google Calendar reminds you about application deadlines.
export default function DeadlineReminders({ current }) {
  const [days, setDays] = useState(current);
  const [saved, setSaved] = useState(current);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const changed = days.join() !== saved.join();

  function toggle(day) {
    setStatus('');
    setDays(list => (list.includes(day) ? list.filter(item => item !== day) : [...list, day]).sort((a, b) => b - a));
  }

  async function save() {
    setSaving(true);
    setStatus('Saving…');
    const result = await saveDeadlineReminders(days).catch(() => ({ error: 'Couldn’t save your reminders. Try again.' }));
    setSaving(false);
    if (result.error) return setStatus(result.error);
    setSaved(days);
    const upcoming = result.updated ? ` Updated ${result.updated} upcoming deadline ${result.updated === 1 ? 'day' : 'days'} on your calendar.` : '';
    const problem = result.calendarError ? ' Some calendar events couldn’t be updated; they’ll pick this up the next time you add a deadline that day.' : '';
    setStatus(`Saved.${upcoming}${problem}`);
  }

  return (
    <div className="deadline-reminders">
      <fieldset>
        <legend>Remind me</legend>
        <div className="reminder-options">
          {REMINDER_OPTIONS.map(option => (
            <label key={option.days} className="reminder-chip" data-on={days.includes(option.days)}>
              <input type="checkbox" checked={days.includes(option.days)} disabled={saving} onChange={() => toggle(option.days)} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="reminder-summary">{days.length ? `${reminderSummary(days)}, at ${REMINDER_HOUR} AM.` : 'No reminders. The deadline will still show as an all-day event.'}</p>
      <div className="tile-actions">
        <button className="primary-button" type="button" disabled={!changed || saving} onClick={save}>{saving ? 'Saving…' : 'Save reminders'}</button>
        {status && <p className="theme-status" role="status">{status}</p>}
      </div>
    </div>
  );
}
