// Application deadlines: every internship/job application due on the same day
// shares one all-day Google Calendar event. Each application is stored as a
// private extended property on that event, and the title, description and
// reminders are rebuilt from them whenever one is added or removed.

export const REMINDER_OPTIONS = [
  { days: 1, label: '1 day before' },
  { days: 2, label: '2 days before' },
  { days: 3, label: '3 days before' },
  { days: 7, label: '1 week before' },
  { days: 14, label: '2 weeks before' },
];
export const DEFAULT_DEADLINE_REMINDERS = [7, 2];
// Reminders fire at this hour (local time) on the chosen day.
export const REMINDER_HOUR = 9;

export function validReminderDays(value) {
  if (!Array.isArray(value)) return DEFAULT_DEADLINE_REMINDERS;
  const allowed = new Set(REMINDER_OPTIONS.map(option => option.days));
  return [...new Set(value.filter(days => allowed.has(days)))].sort((a, b) => b - a);
}

export function reminderSummary(days) {
  if (!days.length) return 'No reminders';
  const parts = days.map(day => REMINDER_OPTIONS.find(option => option.days === day).label.replace(' before', ''));
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
  return `${list} before`;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Google event ids allow base32hex characters (0-9, a-v), so "deadline" is valid.
export function deadlineEventId(date) {
  return `bbdeadline${date.replaceAll('-', '')}`;
}

export function isDeadlineEventId(id) {
  return typeof id === 'string' && /^bbdeadline\d{8}$/.test(id);
}

export function deadlineItemKey(id) {
  return `bbapp_${id.replaceAll('-', '').toLowerCase()}`;
}

export function isDeadlineItemKey(key) {
  return typeof key === 'string' && /^bbapp_[0-9a-f]{32}$/.test(key);
}

export function deadlineLabel({ company, role, title }) {
  if (company && role) return `${company} – ${role}`;
  return company || role || title || 'Application';
}

function safeLink(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href.slice(0, 500) : '';
  } catch {
    return '';
  }
}

// The stored value for one application (extended property values max out at 1024 characters).
export function deadlineItemValue(draft) {
  const item = {
    company: (draft.company || '').trim().slice(0, 120),
    role: (draft.role || '').trim().slice(0, 200),
    title: (draft.title || '').trim().slice(0, 200),
    due: /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime || '') ? draft.startTime : '',
    link: safeLink(draft.link),
  };
  let value = JSON.stringify(item);
  if (value.length > 1024) value = JSON.stringify({ ...item, link: '' });
  return value.slice(0, 1024);
}

function parseItem(value) {
  try {
    const item = JSON.parse(value);
    return item && typeof item === 'object' ? item : null;
  } catch {
    return null;
  }
}

function formatDue(time) {
  const [hour, minute] = time.split(':').map(Number);
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function deadlineItems(privateProps = {}) {
  return Object.entries(privateProps)
    .filter(([key]) => isDeadlineItemKey(key))
    .map(([key, value]) => ({ key, ...parseItem(value) }))
    .filter(item => item.company || item.role || item.title);
}

function nextDay(date) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

export function deadlineSummary(items) {
  const names = items.map(item => item.company || deadlineLabel(item));
  if (names.length === 1) return `Application due: ${deadlineLabel(items[0])}`;
  const shown = names.slice(0, 3).join(', ');
  return `${names.length} applications due: ${shown}${names.length > 3 ? ` +${names.length - 3} more` : ''}`;
}

// Builds the full Google Calendar event for a day's deadlines.
export function buildDeadlineEvent({ date, props, reminderDays, colorId }) {
  const items = deadlineItems(props);
  const lines = items.map(item => {
    const due = item.due ? ` (due ${formatDue(item.due)})` : '';
    return `• ${deadlineLabel(item)}${due}${item.link ? `\n  ${item.link}` : ''}`;
  });
  const description = [
    `${items.length === 1 ? 'Application' : 'Applications'} due today:`,
    '',
    ...lines,
    '',
    'Added by Booked and Busy. New deadlines for this day are added here automatically.',
  ].join('\n');
  return {
    id: deadlineEventId(date),
    status: 'confirmed',
    summary: deadlineSummary(items),
    description: description.slice(0, 8000),
    start: { date },
    end: { date: nextDay(date) },
    transparency: 'transparent',
    ...(colorId && { colorId }),
    reminders: {
      useDefault: false,
      overrides: reminderDays.slice(0, 5).map(days => ({ method: 'popup', minutes: days * 1440 - REMINDER_HOUR * 60 })),
    },
    extendedProperties: { private: { ...props, bbkind: 'deadlines' } },
  };
}

export function validDeadlineDate(date) {
  return typeof date === 'string' && DATE.test(date);
}
