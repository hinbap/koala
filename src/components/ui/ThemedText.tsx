import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { BodyWeight, DisplayWeight } from '../../theme/themes';

type Tone = 'ink' | 'muted' | 'accent' | 'alarm' | 'onAccent';

interface Props extends TextProps {
  /** `display` = the theme's serif/mono face for times and headings; `body` = working text. */
  face?: 'display' | 'body';
  weight?: DisplayWeight | BodyWeight;
  size?: number;
  lineHeight?: number;
  tone?: Tone;
  color?: string;
  /** Small uppercase label with wide tracking. */
  caption?: boolean;
  style?: StyleProp<TextStyle>;
}

export function ThemedText({ face = 'body', weight, size = 16, lineHeight, tone = 'ink', color, caption, style, children, ...rest }: Props) {
  const t = useTheme();
  let fontFamily: string;
  if (face === 'display') {
    const w = (weight ?? t.def.displayWeight) as DisplayWeight;
    fontFamily = t.def.display[w] ?? t.def.display[400];
  } else {
    const w = (weight ?? (caption ? 500 : 400)) as BodyWeight;
    fontFamily = t.def.body[w] ?? t.def.body[400];
  }
  const base: TextStyle = {
    fontFamily,
    fontSize: caption ? 12 : size,
    lineHeight: caption ? 16 : lineHeight,
    color: color ?? t[tone],
    letterSpacing: caption ? 0.96 : undefined,
    textTransform: caption ? 'uppercase' : undefined,
  };
  return (
    <Text {...rest} style={[base, style]}>
      {children}
    </Text>
  );
}
