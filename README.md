# Koala — Sudoku Alarm

Expo SDK 58 / React Native 0.88 application integrating the Sudoku Alarm design and gameplay. Koala retains its app identifiers (`com.salbap.koala`) and URL scheme (`koala`).

## Run

Use Node.js 24 LTS and npm.

```sh
npm install
npm start
npm run web
```

`react-native-svg` was added for the koala illustration, icons, and voice waves. Rebuild an existing development client before running the updated native app:

```sh
npm run ios
# or
npm run android
```

These commands install native dependencies and build the app. If using existing generated native folders, run `npx expo prebuild` first to synchronize icon/splash configuration. No native source changes are part of this integration. For cloud builds, configure EAS and run `npx eas-cli@latest build --profile development --platform ios` (or `android`). The imported features also use modules bundled in Expo Go: `npx expo start --go`.

## Included

- Alarms: add, edit, delete, repeat days, time, difficulty, sound, and enable/disable.
- Alarm sound: the ringing alarm loops its sound at the volume set in Settings (Loud, Louder, Max). The ringing screen has no volume control. Add sounds to `ALARM_SOUNDS` in `src/lib/sounds.ts` and they appear in each sound dropdown.
- Generated Sudoku at Easy, Medium, and Hard levels, each with exactly one solution. The generator targets 44, 35, and 28 starting clues respectively; these levels use clue density rather than human-solving technique ratings. It retains extra clues if needed to preserve uniqueness within its bounded generation budget.
- Number-first entry: select a digit to highlight every matching value, then tap editable cells to place it. Tap the same digit again to deselect it and inspect cells without editing. Notes follow the same flow on empty cells; Erase and Undo remain explicit actions.
- Notes, hints, undo, mistake highlighting, solve timer, and completion screen. Press **New game**, choose a difficulty, then **Start game** to generate a fresh puzzle; alarm sessions start at the alarm’s configured level.
- Five themes with light/dark variants, bundled fonts, animated koala, and reduced-motion support.
- Wake-up calendar and voice excuse preview.
- Expo Router routes at `/`, `/puzzle`, `/settings`, `/wakeups`, and `/excuse`. Shared providers above the navigator preserve puzzle state while visiting other screens. Direct links to the puzzle start a session.

## Current limitations

This imports the supplied prototype; it is **not a functioning background alarm clock**. Alarms, settings, and appearance are stored in memory and reset on restart. Scheduled notifications, vibration, backup ringing, microphone capture, and an AI voice service are not implemented. Alarm audio plays only while the app is open; it does not play in the background or when the app is closed. Hardware volume buttons still change the phone's volume. Wake-up history uses sample data.

The in-app lock setting blocks leaving a ringing alarm's unfinished puzzle through navigation; it cannot prevent closing the application. Practice sessions started from Play sudoku can always be ended with the stop button. Swipe-back navigation is disabled on every screen.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform all
```

Regression tests independently solve 20 generated puzzles per difficulty, check solution validity and uniqueness, and cover number selection/highlighting, repeated entry, read-only cell inspection, notes/erase/undo, per-puzzle hints and completion, AM/PM conversion, repeat-day selection, disabled alarms, and daylight-saving countdowns. Native device interaction, gestures, and rendering still need a device smoke test.

`npm audit` currently reports eight moderate dependency findings stemming from `minimatch` in Expo fingerprinting and ESLint tooling. A non-breaking `npm audit fix` did not resolve them. The suggested forced fix would downgrade Expo to SDK 52, so it was not applied.

## Source layout

- `src/app/`: route exports and root navigator.
- `src/screens/`: five screen implementations.
- `src/components/`: alarm editor, Sudoku controls, themed UI, and illustrations.
- `src/state/`: shared alarm, settings, and puzzle state.
- `src/theme/`: theme definitions and bundled font loading.
- `src/lib/`: pure Sudoku, alarm-time, color, and sample-history logic.
- `tests/`: Node test runner regression tests.

## Welcome and account access

First launch shows four illustrated introduction pages, followed by sign-in. Skip,
Next, Back, page indicators, and horizontal swipes navigate the introduction.
Completion and guest access persist on the device. Settings → Log out returns to
sign-in without replaying the introduction or deleting local alarms and profile data.
A ringing alarm remains accessible even when the user is signed out.

Email/password sign-in, account creation, and password reset use Firebase Auth.
Copy `.env.example` to `.env.local` and fill in the Firebase web-app configuration
from your Firebase project. Enable **Authentication → Sign-in method → Email/Password**
in Firebase Console, then restart Expo. Do not put service-account credentials in
`EXPO_PUBLIC_` variables. Without this configuration, account actions are disabled
and **Continue as guest** remains available. Authentication does not sync alarms,
profiles, or history; these features retain their existing device-local behavior.

The Veriel theme adds green-accented light/dark palettes, Bricolage Grotesque display
and body type, and IBM Plex Mono captions. Select it under Settings → Appearance.
New installations start with Veriel; existing theme preferences are preserved.
