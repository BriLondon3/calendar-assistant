function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

const validTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isBookedAndBusyEvent(id) {
  return typeof id === 'string' && /^bb[0-9a-f]{32}$/.test(id);
}

export function prepareCalendarEvent(draft) {
  if (!draft || typeof draft.id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(draft.id)) {
    return { error: 'This event is missing its identifier. Extract it again.' };
  }
  const summary = typeof draft.title === 'string' ? draft.title.trim() : '';
  if (!summary || summary.length > 300 || !validDate(draft.date)) return { error: 'Enter an event name and a valid start date.' };
  const lastDate = draft.endDate || draft.date;
  if (!validDate(lastDate) || lastDate < draft.date) return { error: 'Choose an end date on or after the start date.' };

  const event = {
    id: `bb${draft.id.replaceAll('-', '').toLowerCase()}`,
    summary,
    location: typeof draft.location === 'string' ? draft.location.trim().slice(0, 1000) : '',
    description: typeof draft.description === 'string' ? draft.description.trim().slice(0, 5000) : '',
  };
  if (draft.allDay === true) {
    const exclusiveEnd = new Date(`${lastDate}T00:00:00Z`);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    const endDate = exclusiveEnd.toISOString().split('T')[0];
    if (!validDate(endDate)) return { error: 'Choose an earlier end date.' };
    return { event: { ...event, start: { date: draft.date }, end: { date: endDate } } };
  }
  if (!validTime.test(draft.startTime) || !validTime.test(draft.endTime)) return { error: 'Enter both start and end times, or mark the event as all day.' };
  const start = `${draft.date}T${draft.startTime}:00`;
  const end = `${lastDate}T${draft.endTime}:00`;
  if (end <= start) return { error: 'The end must be after the start. For overnight events, set the next day as the end date.' };
  const timeZone = draft.timeZone;
  if (typeof timeZone !== 'string' || timeZone.length > 100) return { error: 'Choose a valid time zone.' };
  try {
    new Intl.DateTimeFormat('en', { timeZone });
  } catch {
    return { error: 'Choose a valid time zone.' };
  }
  return { event: { ...event, start: { dateTime: start, timeZone }, end: { dateTime: end, timeZone } } };
}
