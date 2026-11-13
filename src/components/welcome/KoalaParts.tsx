import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { Theme } from '../../theme/themes';

export const furOf = (t: Theme) => (t.mode === 'dark' ? t.surface : t.thin);

export const outline = (t: Theme) => ({
  stroke: t.ink,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

type Eyes = 'open' | 'down' | 'annoyed';
type Mouth = 'smile' | 'frown' | 'none';

interface HeadProps {
  t: Theme;
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  eyes?: Eyes;
  mouth?: Mouth;
}

export function KoalaHead({ t, x, y, scale = 1, rotate = 0, eyes = 'open', mouth = 'smile' }: HeadProps) {
  const fur = furOf(t);
  const o = outline(t);
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} {...o}>
      <Circle cx={-27} cy={-22} r={16} fill={fur} />
      <Circle cx={-27} cy={-22} r={9} fill={t.paper} stroke="none" />
      <Circle cx={27} cy={-22} r={16} fill={fur} />
      <Circle cx={27} cy={-22} r={9} fill={t.paper} stroke="none" />
      <Path d="M-41 -30l-5-3M-43 -21h-6M41 -30l5-3M43 -21h6" strokeWidth={1.2} fill="none" />
      <Circle cx={0} cy={0} r={30} fill={fur} />
      {eyes === 'annoyed' ? (
        <>
          <Path d="M-16 -1h9M7 -1h9" strokeWidth={2.4} fill="none" />
          <Path d="M-17 -10l9 4M17 -10l-9 4" fill="none" />
        </>
      ) : (
        <>
          <Ellipse cx={-11} cy={eyes === 'down' ? 1 : -2} rx={2.8} ry={3.4} fill={t.ink} stroke="none" />
          <Ellipse cx={11} cy={eyes === 'down' ? 1 : -2} rx={2.8} ry={3.4} fill={t.ink} stroke="none" />
          <Path d={eyes === 'down' ? 'M-16 -8q5-2 10 0M6 -8q5-2 10 0' : 'M-16 -11q5-3 10-1M6 -12q5-2 10 1'} strokeWidth={1.3} fill="none" />
        </>
      )}
      <Path d="M-7 5q7-4 14 0q3 10-7 15q-10-5-7-15z" fill={t.ink} />
      <Path d="M-4 7q2-1 3 0" strokeWidth={1.1} stroke={t.paper} fill="none" />
      {mouth === 'smile' && <Path d="M-5 23q5 3 10 0" strokeWidth={1.6} fill="none" />}
      {mouth === 'frown' && <Path d="M-5 25q5-3 10 0" strokeWidth={1.6} fill="none" />}
    </G>
  );
}

export function KoalaArm({ t, x1, y1, x2, y2, fx, fy }: { t: Theme; x1: number; y1: number; x2: number; y2: number; fx: number; fy: number }) {
  const fur = furOf(t);
  const o = outline(t);
  return (
    <G {...o} fill="none">
      <Path d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth={17} />
      <Path d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth={13.6} stroke={fur} />
      <Circle cx={x2} cy={y2} r={7} fill={fur} />
      <Path d={`M${x2} ${y2}L${fx} ${fy}`} strokeWidth={6.4} />
      <Path d={`M${x2} ${y2}L${fx} ${fy}`} strokeWidth={3.2} stroke={fur} />
    </G>
  );
}
