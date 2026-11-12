import { useEffect, useState } from 'react';
import { AppState, Platform, Vibration } from 'react-native';
import { AudioPlayer, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useStore } from '../state/AppStore';
import * as Sudoku from '../lib/sudoku';
import { alarmSoundSource, alarmVolumeLevel, IDLE_RING_MS, SOLVING_VOLUME_LEVEL } from '../lib/sounds';

// expo-audio exposes loop and volume only as properties, so the writes live here.
function configure(player: AudioPlayer, volume: number) {
  player.loop = true;
  player.volume = volume;
}

/**
 * Loops the ringing alarm's sound at the volume chosen in Settings.
 * Plays only while an alarm is ringing and its puzzle is unsolved.
 * The first move quiets it; with "Volume climbs back" on, 30 seconds without a move rings it at full volume again.
 */
export function useAlarmSound() {
  const { ringing, puzzle, settings, lastMoveAt } = useStore();
  const playing = ringing !== null && !Sudoku.isSolved(puzzle);
  const sound = ringing?.sound ?? settings.defaultSound;
  const climbsBack = settings.volumeClimbsBack;
  const player = useAudioPlayer(alarmSoundSource(sound));

  // Remembers which move the player went idle after; any newer move quiets the alarm again.
  const [idleAfter, setIdleAfter] = useState<number | null>(null);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && lastMoveAt !== null && Date.now() - lastMoveAt >= IDLE_RING_MS) setIdleAfter(lastMoveAt);
    });
    return () => subscription.remove();
  }, [lastMoveAt]);
  useEffect(() => {
    if (!playing || !climbsBack || lastMoveAt === null) return;
    const id = setTimeout(() => setIdleAfter(lastMoveAt), Math.max(0, lastMoveAt + IDLE_RING_MS - Date.now()));
    return () => clearTimeout(id);
  }, [playing, climbsBack, lastMoveAt]);

  const solving = lastMoveAt !== null && !(climbsBack && idleAfter === lastMoveAt);
  const level = solving ? SOLVING_VOLUME_LEVEL : alarmVolumeLevel(settings.alarmVolume);

  useEffect(() => {
    if (!playing || !settings.vibrate || Platform.OS === 'web') return;
    // iOS arrays contain pauses between fixed vibrations; Android alternates pauses and durations.
    Vibration.vibrate(Platform.OS === 'ios' ? [0, 1000] : [0, 500, 1000], true);
    return () => Vibration.cancel();
  }, [playing, settings.vibrate]);

  useEffect(() => {
    configure(player, level);
  }, [player, level]);

  useEffect(() => {
    if (!playing) {
      player.pause();
      return;
    }
    let cancelled = false;
    // Configure the audio session before starting playback, including the first alarm.
    setAudioModeAsync({ playsInSilentMode: settings.overridePhoneVolume }).then(async () => {
      if (cancelled) return;
      await player.seekTo(0);
      if (!cancelled) player.play();
    }).catch(console.warn);
    return () => { cancelled = true; player.pause(); };
  }, [player, playing, settings.overridePhoneVolume]);
}
