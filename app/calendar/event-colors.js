export function resolveEventColor(event, labels, palette, calendar) {
  const label = labels.find(item => item.id === event.eventLabelId);
  if (label?.backgroundColor) {
    return { backgroundColor: label.backgroundColor };
  }
  const color = palette.event?.[event.colorId];
  return {
    backgroundColor: color?.background || calendar.backgroundColor,
    foregroundColor: color?.foreground || calendar.foregroundColor,
  };
}
