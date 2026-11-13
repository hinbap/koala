import React from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { keyframes, keyframesDeg, phased, useLoop } from '../../hooks/useLoop';
import { furOf, KoalaArm, KoalaHead, outline } from './KoalaParts';

const W = 342;
const H = 260;

const origin = (x: number, y: number) => `${(x / W) * 100}% ${(y / H) * 100}%`;

function Layer({ children }: { children: React.ReactNode }) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
      {children}
    </Svg>
  );
}

function Animated_({ style, children }: { style: object; children: React.ReactNode }) {
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

export function SceneStage({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const w = Math.min(W, width - 48);
  return <View style={{ width: w, height: (w * H) / W, alignSelf: 'center' }}>{children}</View>;
}

const jabFrames: [number, number][] = [[0, 0], [0.4, 0], [0.48, -12], [0.56, 2], [0.64, -8], [0.72, 0], [1, 0]];

export function ClockScene() {
  const t = useTheme();
  const fur = furOf(t);
  const o = outline(t);
  const shake = useLoop(280);
  const flashL = useLoop(500);
  const breath = useLoop(3600);
  const jab = useLoop(2400);
  const flash = keyframes(flashL, [[0, 1], [0.49, 1], [0.5, 0], [1, 0]]);
  return (
    <SceneStage>
      <Animated_ style={{ opacity: flash }}>
        <Layer>
          <Path d="M196 70q-10 20 0 40M184 62q-14 28 0 56M304 70q10 20 0 40M316 62q14 28 0 56" stroke={t.accent} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Path d="M30 150l-6-8M44 144l-1-10M58 148l5-8" stroke={t.alarm} strokeWidth={2} strokeLinecap="round" fill="none" />
        </Layer>
      </Animated_>
      <Animated_ style={{ transformOrigin: origin(250, 100), transform: [{ rotate: keyframesDeg(shake, [[0, -6], [0.5, 6], [1, -6]]) }] }}>
        <Layer>
          <G {...o} strokeWidth={2.2}>
            <Path d="M222 132l-12 16M278 132l12 16M250 44v-9M241 35h18" fill="none" />
            <Circle cx={220} cy={50} r={13} fill={t.accent} />
            <Circle cx={280} cy={50} r={13} fill={t.accent} />
            <Circle cx={250} cy={92} r={46} fill={t.surface} />
            <Path d="M250 53v6M250 125v6M211 92h6M283 92h6" strokeWidth={1.6} fill="none" />
            <Path d="M250 92V66M250 92l18 9" strokeWidth={2.4} fill="none" />
            <Circle cx={250} cy={92} r={3} fill={t.ink} />
          </G>
        </Layer>
      </Animated_>
      <Layer>
        <Path d="M8 240H334" stroke={t.line} strokeWidth={1.8} />
        <G {...o}>
          <Ellipse cx={183} cy={206} rx={8} ry={14} transform="rotate(-25 183 206)" fill={fur} />
          <Ellipse cx={198} cy={214} rx={8} ry={14} transform="rotate(-10 198 214)" fill={fur} />
        </G>
      </Layer>
      <Animated_ style={{ transformOrigin: origin(120, 238), transform: [{ scaleX: keyframes(breath, [[0, 1], [0.5, 1.012], [1, 1]]) }, { scaleY: keyframes(breath, [[0, 1], [0.5, 1.06], [1, 1]]) }] }}>
        <Layer>
          <Ellipse cx={122} cy={218} rx={66} ry={22} fill={fur} {...o} />
          <Ellipse cx={128} cy={212} rx={40} ry={9} fill={t.paper} />
        </Layer>
      </Animated_>
      <Animated_ style={{ transformOrigin: origin(96, 204), transform: [{ rotate: keyframesDeg(jab, jabFrames) }] }}>
        <Layer>
          <KoalaArm t={t} x1={96} y1={204} x2={152} y2={146} fx={160} fy={136} />
        </Layer>
      </Animated_>
      <Layer>
        <KoalaHead t={t} x={56} y={206} rotate={-14} eyes="annoyed" mouth="frown" />
      </Layer>
    </SceneStage>
  );
}

export function SudokuScene() {
  const t = useTheme();
  const fur = furOf(t);
  const o = outline(t);
  const peek = useLoop(4200);
  const cell = useLoop(2800);
  const tap = useLoop(900);
  const fill = keyframes(cell, [[0, 0], [0.2, 0], [0.35, 1], [0.85, 1], [1, 0]]);
  const font = { fontFamily: t.def.display[t.def.displayWeight], fontSize: 24, fill: t.ink, textAnchor: 'middle' as const };
  return (
    <SceneStage>
      <Animated_
        style={{
          transformOrigin: origin(134, 140),
          transform: [
            { translateX: keyframes(peek, [[0, 0], [0.3, -8], [0.5, -8], [0.7, 2], [1, 0]]) },
            { rotate: keyframesDeg(peek, [[0, 0], [0.3, -4], [0.5, -4], [0.7, 3], [1, 0]]) },
          ],
        }}
      >
        <Layer>
          <KoalaHead t={t} x={128} y={106} scale={1.08} rotate={14} />
        </Layer>
      </Animated_>
      <Layer>
        <Rect x={150} y={50} width={140} height={140} rx={8} fill={t.surface} {...o} strokeWidth={2.2} />
      </Layer>
      <Animated_ style={{ opacity: fill }}>
        <Layer>
          <Rect x={197} y={97} width={46} height={46} fill={t.accent} />
          <SvgText x={220} y={130} {...font} fill={t.onAccent}>7</SvgText>
        </Layer>
      </Animated_>
      <Layer>
        <Path d="M196.7 50v140M243.3 50v140M150 96.7h140M150 143.3h140" stroke={t.thick} strokeWidth={1.3} />
        {[[173, 83, 5], [267, 83, 3], [173, 130, 8], [267, 130, 1], [173, 177, 2], [220, 177, 9]].map(([x, y, d]) => (
          <SvgText key={`${x}-${y}`} x={x} y={y} {...font}>{String(d)}</SvgText>
        ))}
        <G {...o}>
          <Ellipse cx={146} cy={160} rx={9} ry={12} fill={fur} />
          <Path d="M150 152h5M151 158h5M151 164h5" strokeWidth={1.1} fill="none" />
        </G>
      </Layer>
      <Animated_
        style={{
          transform: [
            { translateX: keyframes(tap, [[0, 0], [0.5, 3], [1, 0]]) },
            { translateY: keyframes(tap, [[0, 0], [0.5, 6], [1, 0]]) },
          ],
        }}
      >
        <Layer>
          <G {...o}>
            <Path d="M176 40L206 92" strokeWidth={8} fill="none" />
            <Path d="M176 40L206 92" strokeWidth={5} stroke={t.accent} fill="none" />
            <Path d="M203 87l7 12 -1 -13z" fill={t.ink} />
            <Ellipse cx={170} cy={48} rx={13} ry={9} fill={fur} />
            <Path d="M162 54l-1 4M168 56v4M174 56l1 4" strokeWidth={1.1} fill="none" />
          </G>
        </Layer>
      </Animated_>
    </SceneStage>
  );
}

export function BotScene() {
  const t = useTheme();
  const fur = furOf(t);
  const o = outline(t);
  const swing = useLoop(3600);
  const talk = useLoop(640);
  const dots = useLoop(1200);
  const squint = useLoop(3000);
  const eyes = keyframes(squint, [[0, 1], [0.55, 1], [0.65, 0.35], [0.85, 0.35], [1, 1]]);
  return (
    <SceneStage>
      <Layer>
        <Path d="M0 16q120-10 240 2t102-4" stroke={t.thick} strokeWidth={4} strokeLinecap="round" fill="none" />
        <Path d="M232 16q8 10 2 22" stroke={t.accent} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        <Path d="M234 26q-9 2-10 10q8 0 10-10z" fill={t.soft} stroke={t.accent} strokeWidth={1.6} />
      </Layer>
      <Animated_ style={{ transformOrigin: origin(104, 14), transform: [{ rotate: keyframesDeg(swing, [[0, -5], [0.5, 5], [1, -5]]) }] }}>
        <Layer>
          <G {...o}>
            <Ellipse cx={104} cy={66} rx={26} ry={38} fill={fur} />
            <Ellipse cx={104} cy={70} rx={13} ry={22} fill={t.paper} stroke="none" />
            <Ellipse cx={92} cy={18} rx={9} ry={7} fill={fur} />
            <Ellipse cx={116} cy={18} rx={9} ry={7} fill={fur} />
            <Ellipse cx={80} cy={100} rx={7} ry={15} transform="rotate(14 80 100)" fill={fur} />
          </G>
          <KoalaArm t={t} x1={124} y1={86} x2={150} y2={124} fx={158} fy={134} />
          <KoalaHead t={t} x={104} y={132} scale={0.95} rotate={180} mouth="none" />
        </Layer>
        {/* Talking mouth: upside down, so it sits above the nose. */}
        <Animated_ style={{ transformOrigin: origin(104, 109), transform: [{ scaleX: keyframes(talk, [[0, 1], [0.5, 1.7], [1, 1]]) }, { scaleY: keyframes(talk, [[0, 1], [0.5, 2.3], [1, 1]]) }] }}>
          <Layer>
            <Ellipse cx={104} cy={109} rx={3} ry={2.1} fill={t.ink} />
          </Layer>
        </Animated_>
      </Animated_>
      <Layer>
        <Path d="M168 92h64a12 12 0 0 1 12 12v12a12 12 0 0 1-12 12h-44l-10 10 1-10h-11a12 12 0 0 1-12-12v-12a12 12 0 0 1 12-12z" fill={t.surface} {...o} />
        <G {...o}>
          <Path d="M276 170v-14" fill="none" />
          <Circle cx={276} cy={152} r={5} fill={t.accent} />
          <Rect x={240} y={170} width={72} height={58} rx={16} fill={t.surface} />
          <Path d="M252 180l16 3M300 180l-16 3M262 214h28" strokeWidth={2.2} fill="none" />
        </G>
        <SvgText x={320} y={166} textAnchor="middle" fontSize={22} fontFamily={t.def.display[t.def.displayWeight]} fill={t.muted}>?</SvgText>
      </Layer>
      {[186, 200, 214].map((cx, i) => (
        <Animated_ key={cx} style={{ transform: [{ translateY: phased(dots, i * 0.15, [[0, 0], [0.3, -5], [0.6, 0], [1, 0]]) }] }}>
          <Layer>
            <Circle cx={cx} cy={110} r={3.6} fill={t.muted} />
          </Layer>
        </Animated_>
      ))}
      {[261, 291].map((cx) => (
        <Animated_ key={cx} style={{ transformOrigin: origin(cx, 191), transform: [{ scaleY: eyes }] }}>
          <Layer>
            <Rect x={cx - 7} y={186} width={14} height={10} rx={3} fill={t.accent} />
          </Layer>
        </Animated_>
      ))}
    </SceneStage>
  );
}

const STREAK_ROWS: { who: string; cells: (number | null)[] }[] = [
  { who: 'A', cells: [1, 0.6, 1, 1, 0.85] },
  { who: 'J', cells: [0.85, 1, 0.35, 1, 1] },
  { who: 'K', cells: [1, 1, 1, 0.6, 1] },
  { who: 'You', cells: [0.35, 0.6, 0.35, 0.6, null] },
];

export function StreakScene() {
  const t = useTheme();
  const fur = furOf(t);
  const o = outline(t);
  const fill = useLoop(4000);
  const blinkL = useLoop(1000);
  const breath = useLoop(3600);
  const dangle = useLoop(2600);
  const blink = keyframes(blinkL, [[0, 1], [0.49, 1], [0.5, 0.25], [1, 0.25]]);
  return (
    <SceneStage>
      <Layer>
        <Rect x={62} y={104} width={190} height={136} rx={12} fill={t.surface} stroke={t.line} strokeWidth={1.4} />
        {STREAK_ROWS.map((r, i) => (
          <G key={r.who}>
            <Circle cx={86} cy={128 + i * 30} r={11} fill={t.paper} stroke={t.line} strokeWidth={1.3} />
            <SvgText x={86} y={132 + i * 30} textAnchor="middle" fontSize={r.who.length > 1 ? 9 : 12} fontFamily={t.def.body[600]} fill={t.ink}>
              {r.who}
            </SvgText>
          </G>
        ))}
      </Layer>
      {STREAK_ROWS.flatMap((r, i) =>
        r.cells.map((op, c) => {
          const x = 108 + c * 26;
          const y = 118 + i * 30;
          if (op === null) {
            return (
              <Animated_ key={`${i}-${c}`} style={{ opacity: blink }}>
                <Layer>
                  <Rect x={x} y={y} width={20} height={20} rx={4} fill="none" stroke={t.alarm} strokeWidth={1.6} strokeDasharray="3 3" />
                </Layer>
              </Animated_>
            );
          }
          const start = 0.02 * (i + c);
          return (
            <Animated_ key={`${i}-${c}`} style={{ opacity: keyframes(fill, [[0, 0], [start, 0], [start + 0.15, 1], [1, 1]]) }}>
              <Layer>
                <Rect x={x} y={y} width={20} height={20} rx={4} fill={t.accent} fillOpacity={op} />
              </Layer>
            </Animated_>
          );
        }),
      )}
      <Layer>
        <Ellipse cx={262} cy={112} rx={8} ry={15} transform="rotate(-12 262 112)" fill={fur} {...o} />
      </Layer>
      <Animated_ style={{ transformOrigin: origin(190, 104), transform: [{ scaleY: keyframes(breath, [[0, 1], [0.5, 1.06], [1, 1]]) }] }}>
        <Layer>
          <Ellipse cx={196} cy={92} rx={64} ry={18} fill={fur} {...o} />
          <Path d="M168 82q3-3 6-1M196 79q3-3 6-1M224 82q3-2 5 1" {...o} strokeWidth={1.2} fill="none" />
        </Layer>
      </Animated_>
      <Animated_ style={{ transformOrigin: origin(150, 100), transform: [{ rotate: keyframesDeg(dangle, [[0, 0], [0.5, -7], [1, 0]]) }] }}>
        <Layer>
          <KoalaArm t={t} x1={150} y1={100} x2={210} y2={180} fx={218} fy={190} />
        </Layer>
      </Animated_>
      <Layer>
        <KoalaHead t={t} x={122} y={82} scale={0.92} rotate={-8} eyes="down" />
      </Layer>
    </SceneStage>
  );
}
