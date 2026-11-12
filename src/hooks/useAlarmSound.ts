import { useEffect } from 'react';
import { AudioPlayer, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useStore } from '../state/AppStore';
import * as Sudoku from '../lib/sudoku';
import { alarmSoundSource, alarmVolumeLevel } from '../lib/sounds';

// expo-audio exposes loop and volume only as properties, so the writes live here.
function configure(player: AudioPlayer, volume: number) {
  player.loop = true;
  player.volume = volume;
}

/**
 * Loops the ringing alarm's sound at the volume chosen in Settings.
 * Plays only while an alarm is ringing and its puzzle is unsolved.
 */
export function useAlarmSound() {
  const { ringing, puzzle, settings } = useStore();
  const playing = ringing !== null && !Sudoku.isSolved(puzzle);
  const sound = ringing?.sound ?? settings.defaultSound;
  const level = alarmVolumeLevel(settings.alarmVolume);
  const player = useAudioPlayer(alarmSoundSource(sound));

  // "Override phone volume" lets the alarm ring through silent mode.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: settings.overridePhoneVolume }).catch(console.warn);
  }, [settings.overridePhoneVolume]);

  useEffect(() => {
    configure(player, level);
  }, [player, level]);

  useEffect(() => {
    if (!playing) {
      player.pause();
      return;
    }
    player.seekTo(0).catch(console.warn);
    player.play();
    return () => player.pause();
  }, [player, playing]);
}
