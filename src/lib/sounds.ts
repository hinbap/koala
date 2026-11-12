// Add new alarm sounds here; they appear in every sound dropdown in the order listed.
export const ALARM_SOUNDS = [
  { id: 'nuclear', label: 'Nuclear', source: require('../../assets/sounds/nuclear.mp3') },
] as const;

export type AlarmSoundId = (typeof ALARM_SOUNDS)[number]['id'];
export const DEFAULT_ALARM_SOUND: AlarmSoundId = 'nuclear';
export const SOUND_OPTIONS = ALARM_SOUNDS.map((s) => ({ value: s.id, label: s.label }));

export function alarmSoundSource(id: AlarmSoundId) {
  return (ALARM_SOUNDS.find((s) => s.id === id) ?? ALARM_SOUNDS[0]).source;
}

/** Playback volume while ringing. The user cannot change it from the ringing screen. */
export const ALARM_VOLUMES = [
  { value: 'loud', label: 'Loud', level: 0.7 },
  { value: 'louder', label: 'Louder', level: 0.85 },
  { value: 'max', label: 'Max', level: 1 },
] as const;

export type AlarmVolume = (typeof ALARM_VOLUMES)[number]['value'];
export const VOLUME_OPTIONS = ALARM_VOLUMES.map((v) => ({ value: v.value, label: v.label }));

export function alarmVolumeLevel(volume: AlarmVolume): number {
  return (ALARM_VOLUMES.find((v) => v.value === volume) ?? ALARM_VOLUMES[ALARM_VOLUMES.length - 1]).level;
}
