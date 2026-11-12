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

- Alarms: add, edit, delete, repeat days, time, difficulty, and enable/disable.
- Playable Sudoku: notes, hints, undo, mistake highlighting, solve timer, and completion screen.
- Five themes with light/dark variants, bundled fonts, animated koala, and reduced-motion support.
- Wake-up calendar and voice excuse preview.
- Expo Router routes at `/`, `/puzzle`, `/settings`, `/wakeups`, and `/excuse`. Shared providers above the navigator preserve puzzle state while visiting other screens. Direct links to the puzzle start a session.

## Current limitations

This imports the supplied prototype; it is **not a functioning background alarm clock**. Alarms, settings, and appearance are stored in memory and reset on restart. Scheduled notifications, alarm audio, volume controls, vibration, backup ringing, microphone capture, and an AI voice service are not implemented. Wake-up history uses sample data. Difficulty is saved on alarms, but all sessions currently use one fixed puzzle.

The in-app lock setting blocks leaving an unfinished puzzle through navigation; it cannot prevent closing the application. Disable it in Settings to leave a practice session before solving.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform all
```

Regression tests cover a unique Sudoku solution, notes/entries/erase/undo, hint bookkeeping, completion, AM/PM conversion, repeat-day selection, disabled alarms, and daylight-saving countdowns. Native device interaction, gestures, and rendering still need a device smoke test.

`npm audit` currently reports eight moderate dependency findings stemming from `minimatch` in Expo fingerprinting and ESLint tooling. A non-breaking `npm audit fix` did not resolve them. The suggested forced fix would downgrade Expo to SDK 52, so it was not applied.

## Source layout

- `src/app/`: route exports and root navigator.
- `src/screens/`: five screen implementations.
- `src/components/`: alarm editor, Sudoku controls, themed UI, and illustrations.
- `src/state/`: shared alarm, settings, and puzzle state.
- `src/theme/`: theme definitions and bundled font loading.
- `src/lib/`: pure Sudoku, alarm-time, color, and sample-history logic.
- `tests/`: Node test runner regression tests.
