const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validateCredentials, isEmail, restoreWelcome, authErrorMessage, routeAccess } = require('../src/lib/auth.ts');
const { THEME_ORDER, THEMES, resolveTheme } = require('../src/theme/themes.ts');

test('credentials validate email and require stronger passwords only for new accounts', () => {
  assert.equal(isEmail(' person@example.com '), true);
  for (const email of ['', 'person', 'person@', 'person @example.com']) assert.equal(isEmail(email), false);
  assert.equal(validateCredentials('signin', '', '').field, 'email');
  assert.equal(validateCredentials('signin', 'person@example.com', '').field, 'password');
  assert.equal(validateCredentials('signup', 'person@example.com', '1234567').field, 'password');
  assert.equal(validateCredentials('signup', ' person@example.com ', '12345678'), null);
  assert.equal(validateCredentials('signin', 'person@example.com', 'legacy'), null);
});

test('welcome persistence restores only explicit flags, never a fabricated account', () => {
  for (const value of [null, undefined, {}, false, 'bad', { completed: 'true', guest: 'true' }, { guest: true }]) {
    assert.deepEqual(restoreWelcome(value), { completed: false, guest: false });
  }
  assert.deepEqual(restoreWelcome({ completed: true }), { completed: true, guest: false });
  assert.deepEqual(restoreWelcome({ completed: true, guest: true }), { completed: true, guest: true });
  assert.deepEqual(restoreWelcome({ completed: true, email: 'person@example.com' }), { completed: true, guest: false });
});

test('first launch, completed introduction, guest/session, and logout have exclusive routes', () => {
  assert.deepEqual(routeAccess(false, false, false), { app: false, welcome: true, signIn: false, puzzle: false });
  assert.deepEqual(routeAccess(true, false, false), { app: false, welcome: false, signIn: true, puzzle: false });
  assert.deepEqual(routeAccess(true, true, false), { app: true, welcome: false, signIn: false, puzzle: true });
  assert.equal(routeAccess(false, true, false).welcome, true);
});

test('a ringing alarm remains accessible before onboarding or sign-in', () => {
  for (const completed of [true, false]) {
    assert.deepEqual(routeAccess(completed, false, true), { app: false, welcome: false, signIn: false, puzzle: true });
  }
});

test('auth errors never expose backend details and reset failures are actionable', () => {
  assert.equal(authErrorMessage({ code: 'auth/user-not-found' }), authErrorMessage({ code: 'auth/wrong-password' }));
  assert.match(authErrorMessage({ code: 'auth/network-request-failed' }), /connection/);
  assert.match(authErrorMessage({ code: 'auth/too-many-requests' }), /wait/);
  assert.doesNotMatch(authErrorMessage(new Error('private backend details')), /private/);
  assert.equal(typeof authErrorMessage(null), 'string');
});

test('Veriel is selectable in both modes without removing existing themes', () => {
  assert.equal(THEME_ORDER.length, 6);
  assert.equal(new Set(THEME_ORDER).size, 6);
  for (const id of THEME_ORDER) {
    for (const mode of ['light', 'dark']) {
      const theme = resolveTheme(id, mode);
      assert.equal(theme.def, THEMES[id]);
      for (const key of ['paper', 'ink', 'accent', 'onAccent', 'line']) assert.match(theme[key], /^#[a-f0-9]{6}$/i);
    }
  }
  assert.equal(resolveTheme('veriel', 'dark').accent, '#5bd684');
  assert.equal(resolveTheme('veriel', 'light').accent, '#137a3f');
  assert.equal(THEMES.veriel.caption, 'IBMPlexMono_500Medium');
});
