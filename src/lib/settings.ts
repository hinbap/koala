import type { Level } from './alarms';
import type { AlarmSoundId, AlarmVolume } from './sounds';

export interface Settings {
  defaultLevel: Level;
  defaultSound: AlarmSoundId;
  alarmVolume: AlarmVolume;
  hintsPerPuzzle: number;
  showMistakes: boolean;
  volumeClimbsBack: boolean;
  overridePhoneVolume: boolean;
  vibrate: boolean;
  backupAlarm: boolean;
  lockWhileRinging: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultLevel: 'Medium', defaultSound: 'nuclear', alarmVolume: 'max', hintsPerPuzzle: 3,
  showMistakes: true, volumeClimbsBack: true, overridePhoneVolume: true,
  vibrate: true, backupAlarm: true, lockWhileRinging: true,
};

export function restoreSettings(data: unknown): Settings {
  const result = { ...DEFAULT_SETTINGS };
  if (!data || typeof data !== 'object') return result;
  const input = data as Record<string, unknown>;
  for (const key of ['showMistakes', 'volumeClimbsBack', 'overridePhoneVolume', 'vibrate', 'backupAlarm', 'lockWhileRinging'] as const) {
    if (typeof input[key] === 'boolean') result[key] = input[key];
  }
  if (input.defaultLevel === 'Easy' || input.defaultLevel === 'Medium' || input.defaultLevel === 'Hard') result.defaultLevel = input.defaultLevel;
  if (input.defaultSound === 'nuclear') result.defaultSound = input.defaultSound;
  if (input.alarmVolume === 'loud' || input.alarmVolume === 'louder' || input.alarmVolume === 'max') result.alarmVolume = input.alarmVolume;
  if (typeof input.hintsPerPuzzle === 'number' && Number.isFinite(input.hintsPerPuzzle)) {
    result.hintsPerPuzzle = Math.max(0, Math.min(9, Math.round(input.hintsPerPuzzle)));
  }
  return result;
}

/** A ringing session freezes its playback settings until the puzzle is solved. */
export function updateAllowedSettings(current: Settings, patch: Partial<Settings>, ringing: boolean): Settings {
  const next = restoreSettings({ ...current, ...patch });
  if (ringing) {
    next.alarmVolume = current.alarmVolume;
    next.overridePhoneVolume = current.overridePhoneVolume;
    next.volumeClimbsBack = current.volumeClimbsBack;
    next.vibrate = current.vibrate;
    next.backupAlarm = current.backupAlarm;
    next.lockWhileRinging = current.lockWhileRinging;
  }
  return next;
}
