const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DEFAULT_SETTINGS, restoreSettings, updateAllowedSettings } = require('../src/lib/settings.ts');
const { notificationPlan } = require('../src/lib/notificationPlan.ts');
const { SAMPLE_ALARMS, msUntil } = require('../src/lib/alarms.ts');

test('restores saved preferences without letting invalid data break settings', () => {
  assert.deepEqual(restoreSettings(null), DEFAULT_SETTINGS);
  const restored = restoreSettings({ hintsPerPuzzle: 200, alarmVolume: 'missing', defaultLevel: 'Hard', showMistakes: false, vibrate: 'false' });
  assert.equal(restored.hintsPerPuzzle, 9);
  assert.equal(restored.alarmVolume, 'max');
  assert.equal(restored.defaultLevel, 'Hard');
  assert.equal(restored.showMistakes, false);
  assert.equal(restored.vibrate, true);
  assert.equal(restoreSettings({ hintsPerPuzzle: -1 }).hintsPerPuzzle, 0);
  assert.equal(restoreSettings({ hintsPerPuzzle: NaN }).hintsPerPuzzle, 3);
});

test('ringing freezes playback and safety controls but permits future puzzle defaults', () => {
  const patch = { alarmVolume: 'loud', vibrate: false, backupAlarm: false, lockWhileRinging: false, overridePhoneVolume: false, volumeClimbsBack: false, hintsPerPuzzle: 0, defaultLevel: 'Easy', showMistakes: false };
  const locked = updateAllowedSettings(DEFAULT_SETTINGS, patch, true);
  for (const key of ['alarmVolume', 'vibrate', 'backupAlarm', 'lockWhileRinging', 'overridePhoneVolume', 'volumeClimbsBack']) assert.equal(locked[key], DEFAULT_SETTINGS[key]);
  assert.equal(locked.hintsPerPuzzle, 0);
  assert.equal(locked.defaultLevel, 'Easy');
  assert.equal(locked.showMistakes, false);
  assert.deepEqual(updateAllowedSettings(DEFAULT_SETTINGS, patch, false), { ...DEFAULT_SETTINGS, ...patch });
});

test('schedules enabled recurring alarms with Expo Sunday-based weekdays and 24-hour time', () => {
  const alarm = { ...SAMPLE_ALARMS[0], hour: 12, minute: 15, meridiem: 'AM', days: [true, false, true, false, false, false, false] };
  const plan = notificationPlan([alarm, { ...alarm, id: 2, on: false }], Date.now());
  assert.deepEqual(plan.map(p => [p.weekday, p.hour, p.minute]), [[1, 0, 15], [3, 0, 15]]);
  assert.equal(notificationPlan([{ ...alarm, meridiem: 'PM' }], Date.now())[0].hour, 12);
  assert.equal(new Set(plan.map(p => p.identifier)).size, 2);
});

test('one-time alarms retain their absolute date and never silently roll to tomorrow on restart', () => {
  const now = Date.now();
  const alarm = { ...SAMPLE_ALARMS[0], days: Array(7).fill(false), oneTimeAt: now + 1000 };
  assert.equal(notificationPlan([alarm], now)[0].date, now + 1000);
  assert.equal(msUntil(alarm, new Date(now)), 1000);
  assert.equal(msUntil(alarm, new Date(now + 2000)), 0);
  assert.deepEqual(notificationPlan([alarm], now + 2000), []);
  assert.deepEqual(notificationPlan([{ ...alarm, on: false }], now), []);
});

const { reconcileNotifications } = require('../src/lib/reconcileNotifications.ts');
const request = (identifier, signature) => ({ identifier, content: { data: { signature } } });

test('solving cancels backup while preserving regular alarms and unrelated notifications', async () => {
  const alarm = request('koala.alarm.1.1', 'alarm');
  const calls = [];
  await reconcileNotifications([alarm, request('koala.backup', 'session'), request('other.feature', 'x')], [alarm],
    async id => { calls.push(['cancel', id]); }, async item => { calls.push(['schedule', item.identifier]); });
  assert.deepEqual(calls, [['cancel', 'koala.backup']]);
});

test('unchanged backup timer is retained across resumes; edits replace only affected alarms', async () => {
  const backup = request('koala.backup', 'session');
  const calls = [];
  await reconcileNotifications([request('koala.alarm.1.1', 'old'), backup], [request('koala.alarm.1.1', 'edited'), backup],
    async id => { calls.push(['cancel', id]); }, async item => { calls.push(['schedule', item.identifier]); });
  assert.deepEqual(calls, [['cancel', 'koala.alarm.1.1'], ['schedule', 'koala.alarm.1.1']]);
});

test('disabling notifications removes all Koala reminders', async () => {
  const calls = [];
  await reconcileNotifications([request('koala.alarm.1.once', 'x'), request('koala.backup', 'y')], [],
    async id => { calls.push(id); }, async () => assert.fail('must not schedule'));
  assert.deepEqual(calls, ['koala.alarm.1.once', 'koala.backup']);
});
