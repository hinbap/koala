import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/** True when the OS "reduce motion" setting is on. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/**
 * A 0→1 value that repeats every `durationMs`. Interpolate it into keyframes.
 * Pass `running = false` to pause (it holds its current position).
 */
export function useLoop(durationMs: number, running = true): Animated.Value {
  const [value] = useState(() => new Animated.Value(0));
  const reduce = useReduceMotion();
  const focused = useIsFocused();
  useEffect(() => {
    if (reduce || !running || !focused) return;
    value.setValue(0);
    const anim = Animated.loop(
      Animated.timing(value, { toValue: 1, duration: durationMs, easing: Easing.linear, useNativeDriver: true, isInteraction: false }),
    );
    anim.start();
    return () => anim.stop();
  }, [durationMs, running, reduce, focused, value]);
  return value;
}

/** Keyframe helper: `frames` maps progress (0–1) to output values. */
type Interpolatable = Pick<Animated.Value, 'interpolate'>;

export function keyframes(v: Interpolatable, frames: [number, number][]) {
  return v.interpolate<number>({ inputRange: frames.map((f) => f[0]), outputRange: frames.map((f) => f[1]) });
}

/**
 * Like `keyframes`, but the cycle starts `offset` (0–1) later — lets several
 * elements share one loop while staying out of step.
 */
export function phased(v: Animated.Value, offset: number, frames: [number, number][]) {
  const at = (p: number) => {
    for (let i = 1; i < frames.length; i++) {
      const [x0, y0] = frames[i - 1];
      const [x1, y1] = frames[i];
      if (p <= x1) return y0 + ((y1 - y0) * (p - x0)) / (x1 - x0 || 1);
    }
    return frames[frames.length - 1][1];
  };
  if (offset <= 0) return keyframes(v, frames);
  const eps = 0.0001;
  const points = new Set<number>([0, 1, offset - eps, offset]);
  for (const [x] of frames) points.add((x + offset) % 1);
  const input = [...points].filter((p) => p >= 0 && p <= 1).sort((a, b) => a - b);
  const output = input.map((p) => (p < offset ? at(p - offset + 1) : at(p - offset)));
  return v.interpolate<number>({ inputRange: input, outputRange: output });
}

export function keyframesDeg(v: Animated.Value, frames: [number, number][]) {
  return v.interpolate({ inputRange: frames.map((f) => f[0]), outputRange: frames.map((f) => `${f[1]}deg`) });
}
