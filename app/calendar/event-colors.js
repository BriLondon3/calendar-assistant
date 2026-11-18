import { googleColor } from './google-colors.js';

// Google's Calendar API still returns its older, paler palette. These map each
// older calendar color to the shade Google Calendar shows today, so the app
// matches what people see in Google Calendar. Custom calendar colors pass through.
const CURRENT_CALENDAR_SHADES = {
  '#ac725e': '#795548', // Cocoa
  '#d06b64': '#e67c73', // Flamingo
  '#f83a22': '#d50000', // Tomato
  '#fa573c': '#f4511e', // Tangerine
  '#ff7537': '#ef6c00', // Pumpkin
  '#ffad46': '#f09300', // Mango
  '#42d692': '#009688', // Eucalyptus
  '#16a765': '#0b8043', // Basil
  '#7bd148': '#7cb342', // Pistachio
  '#b3dc6c': '#c0ca33', // Avocado
  '#fbe983': '#e4c441', // Citron
  '#fad165': '#f6bf26', // Banana
  '#92e1c0': '#33b679', // Sage
  '#9fe1e7': '#039be5', // Peacock
  '#9fc6e7': '#4285f4', // Cobalt
  '#4986e7': '#3f51b5', // Blueberry
  '#9a9cff': '#7986cb', // Lavender
  '#b99aff': '#b39ddb', // Wisteria
  '#c2c2c2': '#616161', // Graphite
  '#cabdbf': '#a79b8e', // Birch
  '#cca6ac': '#ad1457', // Radicchio
  '#f691b2': '#d81b60', // Cherry Blossom
  '#cd74e6': '#8e24aa', // Grape
  '#a47ae2': '#9e69af', // Amethyst
};

export function currentCalendarShade(hex) {
  return typeof hex === 'string' ? CURRENT_CALENDAR_SHADES[hex.toLowerCase()] || hex : hex;
}

export function resolveEventColor(event, labels, palette, calendar) {
  // Google's newer color labels already come back as the exact shade.
  const label = labels.find(item => item.id === event.eventLabelId);
  if (label?.backgroundColor) {
    return { backgroundColor: label.backgroundColor };
  }
  // Event colors: use the current shade (same as the review color picker).
  const current = googleColor(event.colorId);
  if (current) return { backgroundColor: current.hex, foregroundColor: '#ffffff' };
  const color = palette.event?.[event.colorId];
  if (color?.background) {
    return { backgroundColor: color.background, foregroundColor: color.foreground };
  }
  // No event color: fall back to the calendar's own color, in its current shade.
  const calendarShade = currentCalendarShade(calendar.backgroundColor);
  return {
    backgroundColor: calendarShade,
    foregroundColor: calendarShade === calendar.backgroundColor ? calendar.foregroundColor : '#ffffff',
  };
}
