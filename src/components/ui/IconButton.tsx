import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Icon, IconName } from './Icon';

interface Props {
  icon: IconName;
  label: string;
  color: string;
  onPress: () => void;
  size?: number;
  strokeWidth?: number;
}

/** 44×44 hit area around a stroke icon. `label` is read by screen readers. */
export function IconButton({ icon, label, color, onPress, size = 22, strokeWidth }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name={icon} size={size} color={color} strokeWidth={strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.55 },
});
