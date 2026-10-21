import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults } from '../shared/invitation.mjs';
import { calendarText, responsesCsv } from '../shared/exports.mjs';

test('Calendar exports preserve local event time, duration, translations and escaping', () => {
  const config = {
    ...defaults,
    date: '2027-07-19',
    timezone: 'Africa/Cairo',
    reception: '16:00',
    venue: 'Garden, Hall; North\nFloor 2',
    city: 'Cairo',
  };
  const calendar = calendarText(config, 'saved-id', new Date('2026-10-20T12:30:00Z'));
  assert.ok(calendar.endsWith('END:VCALENDAR\r\n'));
  assert.ok(calendar.includes('UID:saved-id@blossom-oud.local\r\n'));
  assert.ok(calendar.includes('DTSTAMP:20261020T123000Z\r\n'));
  assert.ok(calendar.includes('DTSTART:20270719T130000Z\r\n'));
  assert.ok(calendar.includes('DTEND:20270719T180000Z\r\n'));
  assert.ok(calendar.includes('SUMMARY:المهندس أسامة و الدكتورة صفاء\r\n'));
  assert.ok(calendar.includes('LOCATION:Garden\\, Hall\\; North\\nFloor 2\\, Cairo\r\n'));
  assert.ok(
    calendarText({ ...config, language: 'fr' }, 'french').includes('SUMMARY:Eng. Osama & Dr. Safaa\r\n'),
  );
});

test('Default invitation calendar uses the supplied November date and Riyadh half-hour reception', () => {
  const calendar = calendarText(defaults, 'demo');
  assert.ok(calendar.includes('DTSTART:20261114T173000Z\r\n'));
  assert.ok(calendar.includes('LOCATION:قصر بصمات للاحتفالات\\, الرياض، المملكة العربية السعودية\r\n'));
});

test('RSVP CSV keeps Arabic, multiline notes, quotes and spreadsheet formula protection', () => {
  const csv = responsesCsv([
    {
      name: '=Guest',
      attendance: 'yes',
      guests: 3,
      note: 'أهلاً, "شكراً"\nNo nuts',
      updatedAt: '2026-10-20T12:00:00Z',
    },
  ]);
  assert.ok(csv.startsWith('\uFEFF"Name","Attending","Guests","Dietary notes","Updated at"\r\n'));
  assert.ok(csv.includes('"\'=Guest","yes","3"'));
  assert.ok(csv.includes('"أهلاً, ""شكراً""\nNo nuts"'));
  assert.equal(responsesCsv([]).split('\r\n').length, 1);
});
