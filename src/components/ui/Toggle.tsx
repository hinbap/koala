import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

export function Toggle({ value, onChange, label }: Props) {
  const t = useTheme();
  const [x] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(x, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [value, x]);

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={styles.hit}
    >
      <Animated.View
        style={[styles.track, { backgroundColor: x.interpolate({ inputRange: [0, 1], outputRange: [t.fur, t.accent] }) }]}
      >
        <Animated.View
          style={[styles.knob, { backgroundColor: t.surfaceHi, left: x.interpolate({ inputRange: [0, 1], outputRange: [3, 21] }) }]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { width: 52, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  track: { width: 44, height: 26, borderRadius: 13 },
  knob: { position: 'absolute', top: 3, width: 20, height: 20, borderRadius: 10 },
});
