import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { keyframes, useLoop } from '../hooks/useLoop';

const W = 390;
const H = 180;

/** A sine wave two screens wide, so sliding left by one width loops seamlessly. */
function wavePath(amp: number, period: number, phase: number) {
  const mid = H / 2, half = period / 2;
  let x = -phase;
  let d = `M${x} ${mid} q ${half / 2} ${-amp * 2} ${half} 0`;
  while (x + half < W * 2 + period) {
    d += ` t ${half} 0`;
    x += half;
  }
  return d;
}

const WAVES = [
  { d: wavePath(26, 390, 0), width: 3, opacity: 1, move: 7000, swell: 3200 },
  { d: wavePath(20, 260, 60), width: 2.5, opacity: 0.45, move: 5000, swell: 2200 },
  { d: wavePath(32, 195, 130), width: 2, opacity: 0.25, move: 9000, swell: 4400 },
];

function Wave({ d, width, opacity, move, swell, running }: (typeof WAVES)[number] & { running: boolean }) {
  const t = useTheme();
  const slide = useLoop(move, running);
  const amp = useLoop(swell, running);
  return (
    <Animated.View
      style={[
        styles.layer,
        {
          opacity,
          transform: [
            { translateX: keyframes(slide, [[0, 0], [1, -W]]) },
            { scaleY: keyframes(amp, [[0, 0.55], [0.5, 1.15], [1, 0.55]]) },
          ],
        },
      ]}
    >
      <Svg width={W * 2} height={H} viewBox={`0 0 ${W * 2} ${H}`}>
        <Path d={d} stroke={t.accent} strokeWidth={width} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

/** Three overlapping voice waves; they freeze in place when `running` is false. */
export function VoiceWaves({ running }: { running: boolean }) {
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {WAVES.map((w) => (
        <Wave key={w.d} {...w} running={running} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: H, overflow: 'hidden' },
  layer: { position: 'absolute', left: 0, top: 0, width: W * 2, height: H },
});
