const assert = require('node:assert/strict');
const { test } = require('node:test');
const A = require('../src/lib/alarms.ts');
process.env.TZ = 'America/Chicago';
const alarm = (patch = {}) => ({ ...A.SAMPLE_ALARMS[0], hour: 7, minute: 0, meridiem: 'AM', days: Array(7).fill(false), ...patch });

test('12 AM and 12 PM map to midnight and noon', () => {
  assert.equal(A.minutesOfDay(alarm({ hour: 12 })), 0);
  assert.equal(A.minutesOfDay(alarm({ hour: 12, meridiem: 'PM' })), 720);
});

test('one-time alarms roll over to tomorrow after their scheduled time', () => {
  assert.equal(A.minutesUntil(alarm(), new Date(2026, 10, 11, 6, 59, 30)), 0);
  assert.equal(A.minutesUntil(alarm(), new Date(2026, 10, 11, 6, 59)), 1);
  assert.equal(A.minutesUntil(alarm(), new Date(2026, 10, 11, 8)), 23 * 60);
});

test('countdowns round down to whole minutes and never overstate the time left', () => {
  const now = new Date(2026, 10, 11, 6, 21, 15);
  assert.equal(A.minutesUntil(alarm({ hour: 7 }), now), 38);
  assert.equal(A.formatCountdown(A.minutesUntil(alarm({ hour: 7 }), now)), '38 min');
  assert.equal(A.formatCountdown(0), 'under 1 min');
});

test('weekly alarms wrap to next week and disabled alarms are skipped', () => {
  const monday = alarm({ days: [false, true, false, false, false, false, false] });
  const now = new Date(2026, 10, 9, 8);
  assert.equal(A.minutesUntil(monday, now), 7 * 1440 - 60);
  assert.equal(A.nextAlarm([alarm({ on: false }), monday], now).alarm, monday);
  assert.equal(A.nextAlarm([alarm({ on: false })], now), null);
  assert.equal(A.nextAlarm([], now), null);
});

test('countdowns account for daylight saving transitions', () => {
  assert.equal(A.minutesUntil(alarm(), new Date(2026, 2, 7, 8)), 22 * 60);
  assert.equal(A.minutesUntil(alarm(), new Date(2026, 9, 31, 8)), 24 * 60);
});
