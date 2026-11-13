import React, { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from './ThemedText';

interface Props extends TextInputProps {
  label: string;
  invalid?: boolean;
    trailing?: React.ReactNode;
}

export type TextFieldRef = React.ComponentRef<typeof TextInput>;

export const TextField = forwardRef<TextFieldRef, Props>(function TextField({ label, invalid, trailing, style, onFocus, onBlur, ...rest }, ref) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = invalid ? t.alarm : focused ? t.accent : t.line;
  return (
    <View style={styles.wrap}>
      <ThemedText caption tone="muted">{label}</ThemedText>
      <View style={[styles.box, { backgroundColor: t.surface, borderColor, borderRadius: t.def.radius }]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={t.muted}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, { color: t.ink, fontFamily: t.def.body[400] }, style]}
          {...rest}
        />
        {trailing}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  box: { height: 52, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: '100%', paddingHorizontal: 14, fontSize: 16 },
});
