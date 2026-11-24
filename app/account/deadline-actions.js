'use server';

import { authConfigured, createWritableAuthClient } from '../auth-client';
import { getCalendarAccess } from '../calendar-connection';
import { REMINDER_HOUR, REMINDER_OPTIONS, validReminderDays } from '../calendar/deadlines';

// Saves when application-deadline reminders fire, then updates the reminders on
// upcoming deadline events already on the user's Google Calendar.
export async function saveDeadlineReminders(days) {
  if (!Array.isArray(days) || days.some(day => !REMINDER_OPTIONS.some(option => option.days === day))) {
    return { error: 'Choose from the reminder options.' };
  }
  if (!authConfigured()) return { error: 'Please log in again to save reminders.' };
  const client = await createWritableAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { error: 'Please log in again to save reminders.' };
  const reminderDays = validReminderDays(days);
  const { error } = await client.auth.updateUser({ data: { deadlineReminders: reminderDays } });
  if (error) return { error: 'Couldn’t save your reminders. Try again.' };

  let updated = 0;
  try {
    const access = await getCalendarAccess(client, user.id);
    if (!access.token) return { saved: true, updated };
    const headers = { Authorization: `Bearer ${access.token}`, 'Content-Type': 'application/json' };
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const query = new URLSearchParams({ privateExtendedProperty: 'bbkind=deadlines', timeMin: yesterday, singleEvents: 'true', maxResults: '100', fields: 'items(id)' });
    const list = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${query}`, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!list.ok) return { saved: true, updated, calendarError: true };
    const { items = [] } = await list.json();
    const reminders = JSON.stringify({ reminders: { useDefault: false, overrides: reminderDays.map(day => ({ method: 'popup', minutes: day * 1440 - REMINDER_HOUR * 60 })) } });
    for (const item of items) {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${item.id}?sendUpdates=none`, {
        method: 'PATCH', headers, body: reminders, cache: 'no-store', signal: AbortSignal.timeout(15000),
      });
      if (response.ok) updated++;
    }
    return { saved: true, updated, calendarError: updated < items.length };
  } catch {
    return { saved: true, updated, calendarError: true };
  }
}
