import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'plus' | 'gear' | 'grid' | 'chevron-left' | 'chevron-right' | 'sun' | 'moon'
  | 'arrow-right' | 'undo' | 'eraser' | 'pencil' | 'bulb' | 'check' | 'stop' | 'mic' | 'sudoku';

interface Props {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

const GEAR =
  'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z';

/** Stroke icons drawn on a 24×24 grid. */
export function Icon({ name, size = 22, color, strokeWidth = 1.5 }: Props) {
  const s = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  let body: React.ReactNode;
  switch (name) {
    case 'plus': body = <Path d="M12 5v14M5 12h14" {...s} />; break;
    case 'gear': body = <><Circle cx={12} cy={12} r={3} {...s} /><Path d={GEAR} {...s} /></>; break;
    case 'grid': body = <><Rect x={3} y={3} width={7} height={7} rx={1} {...s} /><Rect x={14} y={3} width={7} height={7} rx={1} {...s} /><Rect x={3} y={14} width={7} height={7} rx={1} {...s} /><Rect x={14} y={14} width={7} height={7} rx={1} {...s} /></>; break;
    case 'chevron-left': body = <Path d="M15 18l-6-6 6-6" {...s} />; break;
    case 'arrow-right': body = <Path d="M5 12h14M13 6l6 6-6 6" {...s} />; break;
    case 'chevron-right': body = <Path d="M9 18l6-6-6-6" {...s} />; break;
    case 'sun': body = <><Circle cx={12} cy={12} r={4} {...s} /><Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" {...s} /></>; break;
    case 'moon': body = <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" {...s} />; break;
    case 'undo': body = <><Path d="M9 4L5 8l4 4" {...s} /><Path d="M5 8h8a6 6 0 1 1-6 6" {...s} /></>; break;
    case 'eraser': body = <><Path d="M16.5 3.5l4 4L10 18H6l-2.5-2.5L16.5 3.5z" {...s} /><Path d="M9.5 10.5l4 4M4 21h16" {...s} /></>; break;
    case 'pencil': body = <><Path d="M16 3.5l4.5 4.5L8 20.5H3.5V16L16 3.5z" {...s} /><Path d="M13.5 6l4.5 4.5" {...s} /></>; break;
    case 'bulb': body = <><Path d="M9 18h6M10 21h4" {...s} /><Path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" {...s} /></>; break;
    case 'check': body = <Path d="M5 12.5l4.5 4.5L19 7.5" {...s} />; break;
    case 'stop': body = <Rect x={5} y={5} width={14} height={14} rx={2} fill={color} />; break;
    case 'mic': body = <><Rect x={9} y={3} width={6} height={11} rx={3} {...s} /><Path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...s} /></>; break;
    case 'sudoku': body = <><Rect x={3} y={3} width={18} height={18} rx={1} {...s} /><Path d="M9 3v18M15 3v18M3 9h18M3 15h18" {...s} /></>; break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}
