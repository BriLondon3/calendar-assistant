export function layoutDayEvents(events, date) {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const timed = events.filter(event => event.start?.dateTime && event.end?.dateTime).map(event => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    const startMinute = start <= dayStart ? 0 : start.getHours() * 60 + start.getMinutes();
    const endMinute = end >= dayEnd ? 1440 : end.getHours() * 60 + end.getMinutes();
    // A repeated wall-clock hour at daylight saving time still needs a visible block.
    const duration = Math.max(15, endMinute - startMinute);
    return { ...event, startMinute, endMinute: Math.min(1440, startMinute + duration) };
  }).filter(event => Number.isFinite(event.startMinute) && Number.isFinite(event.endMinute))
    .sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);

  let group = [];
  let groupEnd = -1;
  let columnEnds = [];

  function finishGroup() {
    group.forEach(event => { event.columns = columnEnds.length; });
    group = [];
    columnEnds = [];
  }

  for (const event of timed) {
    if (event.startMinute >= groupEnd) finishGroup();
    let column = columnEnds.findIndex(end => end <= event.startMinute);
    if (column === -1) column = columnEnds.length;
    columnEnds[column] = event.endMinute;
    event.column = column;
    group.push(event);
    groupEnd = Math.max(...columnEnds);
  }
  finishGroup();
  return timed;
}

export function readableTextColor(background) {
  const hex = /^#[0-9a-f]{6}$/i.test(background) ? background : '#039be5';
  const channels = [1, 3, 5].map(index => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  return luminance > .179 ? '#172536' : '#ffffff';
}
