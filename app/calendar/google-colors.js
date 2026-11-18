// Google Calendar's event colors, in the order Google's own color menu shows them.
// `id` is the Calendar API colorId; `hex` is how Google Calendar displays it.
export const GOOGLE_EVENT_COLORS = [
  { id: '11', name: 'Tomato', hex: '#d50000' },
  { id: '4', name: 'Flamingo', hex: '#e67c73' },
  { id: '6', name: 'Tangerine', hex: '#f4511e' },
  { id: '5', name: 'Banana', hex: '#f6bf26' },
  { id: '2', name: 'Sage', hex: '#33b679' },
  { id: '10', name: 'Basil', hex: '#0b8043' },
  { id: '7', name: 'Peacock', hex: '#039be5' },
  { id: '9', name: 'Blueberry', hex: '#3f51b5' },
  { id: '1', name: 'Lavender', hex: '#7986cb' },
  { id: '3', name: 'Grape', hex: '#8e24aa' },
  { id: '8', name: 'Graphite', hex: '#616161' },
];

export function validColorId(value) {
  return typeof value === 'string' && /^(?:[1-9]|1[01])$/.test(value) ? value : null;
}

export function googleColor(id) {
  return GOOGLE_EVENT_COLORS.find(color => color.id === id) || null;
}
