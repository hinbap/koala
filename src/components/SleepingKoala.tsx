import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { keyframes, keyframesDeg, phased, useLoop } from '../hooks/useLoop';

const W = 156;
const H = 112;

/** One full-size SVG layer so every part shares the same 156×112 coordinate space. */
function Layer({ children }: { children: React.ReactNode }) {
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
      {children}
    </Svg>
  );
}

/**
 * A koala asleep on a eucalyptus branch. It breathes, snores and lets out Zs on a
 * 4 s cycle; every so often an ear flicks or it nuzzles its paw (9 s / 13 s / 17 s
 * cycles that rarely line up). Holds still when the OS asks for reduced motion.
 */
export function SleepingKoala() {
  const t = useTheme();
  const fur = t.mode === 'dark' ? t.surface : t.thin;
  const stroke = { stroke: t.ink, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const fine = { ...stroke, strokeWidth: 1.2 };

  const breath = useLoop(4000);
  const twitchFront = useLoop(9000);
  const twitchBack = useLoop(13000);
  const shift = useLoop(17000);
  const sway = useLoop(6000);

  const bodyScaleY = keyframes(breath, [[0, 1], [0.5, 1.06], [1, 1]]);
  const bodyScaleX = keyframes(breath, [[0, 1], [0.5, 1.015], [1, 1]]);
  const mouthScale = keyframes(breath, [[0, 1], [0.5, 2], [1, 1]]);
  const earFront = keyframesDeg(twitchFront, [[0, 0], [0.78, 0], [0.81, -14], [0.84, 6], [0.87, -8], [0.9, 2], [0.92, 0], [1, 0]]);
  const earBack = keyframesDeg(twitchBack, [[0, 0], [0.6, 0], [0.63, 10], [0.66, -4], [0.7, 0], [1, 0]]);
  const headRot = keyframesDeg(shift, [[0, 0], [0.55, 0], [0.6, -5], [0.66, 3], [0.7, -2], [0.75, 0], [1, 0]]);
  const pawX = keyframes(shift, [[0, 0], [0.56, 0], [0.61, 4], [0.67, 2], [0.74, 0], [1, 0]]);
  const pawY = keyframes(shift, [[0, 0], [0.56, 0], [0.61, -3], [0.67, -1], [0.74, 0], [1, 0]]);
  const pawRot = keyframesDeg(shift, [[0, 0], [0.56, 0], [0.61, -8], [0.67, -3], [0.74, 0], [1, 0]]);
  const leafRot = keyframesDeg(sway, [[0, 0], [0.5, 5], [1, 0]]);

  /** Zs share the breath loop, each starting a little later (phase-shifted keyframes). */
  const z = (offset: number) => ({
    opacity: phased(breath, offset, [[0, 0], [0.25, 1], [0.7, 1], [1, 0]]),
    transform: [
      { translateX: phased(breath, offset, [[0, -4], [1, 4]]) },
      { translateY: phased(breath, offset, [[0, 6], [1, -6]]) },
    ],
  });

  return (
    <View style={{ width: W, height: H }} accessible accessibilityLabel="A koala asleep on a branch, snoring">
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '140px 96px', transform: [{ rotate: leafRot }] }]}>
        <Layer>
          <Path d="M140 96q6 6 4 16" stroke={t.accent} strokeWidth={1.6} strokeLinecap="round" fill="none" />
          <Path d="M142 100q-9 1-11 9q8 0 11-9z" fill={t.soft} stroke={t.accent} strokeWidth={1.6} />
          <Path d="M143 104q8 0 10 8q-8 0-10-8z" fill={t.soft} stroke={t.accent} strokeWidth={1.6} />
        </Layer>
      </Animated.View>

      <Layer>
        <Path d="M2 99q40-6 80-3t72-4" stroke={t.thick} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d="M40 96q4 1 7-1M96 95q4 2 8 0" stroke={t.thick} strokeWidth={1.2} strokeLinecap="round" fill="none" />
        <Ellipse cx={128} cy={90} rx={13} ry={8} fill={fur} {...stroke} />
        <Path d="M136 95l2 3M132 96l1 3" {...fine} fill="none" />
      </Layer>

      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '100px 94px', transform: [{ scaleX: bodyScaleX }, { scaleY: bodyScaleY }] }]}>
        <Layer>
          <Path d="M58 64q8-22 46-22q34 0 40 24q4 18-12 26q-30 8-62 2q-16-6-12-30z" fill={fur} {...stroke} />
          <Path d="M70 84q24 8 56 2" stroke={t.paper} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M82 48q3-3 6-1M98 45q3-3 6-1M114 47q3-3 6-1M128 54q3-2 5 1M90 56q2-2 4 0M108 55q2-2 4 0" {...fine} fill="none" />
        </Layer>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '45px 85px', transform: [{ rotate: headRot }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '34px 46px', transform: [{ rotate: earBack }] }]}>
          <Layer>
            <Path d="M14 46q-10-16 4-26q14-8 24 4q4 8-2 14" fill={fur} {...stroke} />
            <Path d="M18 40q-4-9 3-13q8-4 13 3" fill={t.paper} />
            <Path d="M11 30l-4-2M10 36l-4 0M14 23l-3-4" {...fine} fill="none" />
          </Layer>
        </Animated.View>
        <Layer>
          <Circle cx={40} cy={62} r={25} fill={fur} {...stroke} />
          <Path d="M26 60q4 3 8 0M44 59q4 3 8 0" {...stroke} strokeWidth={1.8} fill="none" />
          <Path d="M27 55q3-2 6-1M45 54q3-2 6 0" stroke={t.muted} strokeWidth={1} strokeLinecap="round" fill="none" />
          <Path d="M33 66q6-4 12 0q3 10-6 15q-9-5-6-15z" fill={t.ink} {...stroke} />
          <Path d="M36 68q2-1 3 0" stroke={t.paper} strokeWidth={1} strokeLinecap="round" fill="none" />
        </Layer>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '39px 85px', transform: [{ scale: mouthScale }] }]}>
          <Layer>
            <Ellipse cx={39} cy={85} rx={1.8} ry={1.2} fill={t.ink} />
          </Layer>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '56px 50px', transform: [{ rotate: earFront }] }]}>
          <Layer>
            <Path d="M52 40q2-18 18-18q16 2 14 18q-2 12-16 12" fill={fur} {...stroke} />
            <Path d="M58 40q2-11 11-11q9 1 8 11q-1 6-9 6" fill={t.paper} />
            <Path d="M76 22l3-4M82 28l4-2M85 35l4 0" {...fine} fill="none" />
          </Layer>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFill, { transformOrigin: '60px 92px', transform: [{ translateX: pawX }, { translateY: pawY }, { rotate: pawRot }] }]}
      >
        <Layer>
          <Path d="M34 92q4-8 18-7q12 1 12 7q-1 6-14 6q-14 0-16-6z" fill={fur} {...stroke} />
          <Path d="M40 97l-1 3M45 98l-1 3M50 98l0 3" {...fine} fill="none" />
        </Layer>
      </Animated.View>

      {[
        { d: 'M70 12h7l-7 8h7', o: 0 },
        { d: 'M84 2h6l-6 7h6', o: 0.15 },
        { d: 'M97 -8h5l-5 6h5', o: 0.3 },
      ].map((zz) => (
        <Animated.View key={zz.d} style={[StyleSheet.absoluteFill, z(zz.o)]}>
          <Svg width={W} height={H} viewBox={`0 -12 ${W} ${H}`} style={[StyleSheet.absoluteFill, { top: -12 }]}>
            <G>
              <Path d={zz.d} stroke={t.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </G>
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}
