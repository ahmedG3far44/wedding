import { eventInstant, names, words } from './invitation.mjs';

export function calendarText(config, invitationId, now = new Date()) {
  const stamp = (date) =>
    date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const escape = (text) =>
    text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const start = eventInstant(config);
  const end = new Date(start.getTime() + 5 * 3600000);
  const [groom, bride] = names(config);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Blossom and Oud//Invitation//EN',
    'BEGIN:VEVENT',
    `UID:${invitationId}@blossom-oud.local`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`${groom} ${words[config.language].and} ${bride}`)}`,
    `LOCATION:${escape(`${config.venue}, ${config.city}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function responsesCsv(responses) {
  const cell = (value) =>
    '"' +
    String(value)
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  const rows = [
    ['Name', 'Attending', 'Guests', 'Dietary notes', 'Updated at'],
    ...responses.map((row) => [row.name, row.attendance, row.guests, row.note, row.updatedAt]),
  ];
  return '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}
