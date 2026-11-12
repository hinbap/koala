import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon, IconName } from '../ui/Icon';
import { ThemedText } from '../ui/ThemedText';

interface Props {
  notesOn: boolean;
  hintsLeft: number;
  onUndo: () => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
}

function Tool({ icon, label, onPress, active, disabled, a11y }: { icon: IconName; label: string; onPress: () => void; active?: boolean; disabled?: boolean; a11y?: string }) {
  const t = useTheme();
  const color = disabled ? t.fur : active ? t.accent : t.muted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      style={({ pressed }) => [styles.tool, { borderRadius: t.def.radius, backgroundColor: active ? t.soft : 'transparent' }, pressed && { opacity: 0.6 }]}
    >
      <Icon name={icon} color={color} />
      <ThemedText caption color={color}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function PuzzleToolbar({ notesOn, hintsLeft, onUndo, onErase, onToggleNotes, onHint }: Props) {
  return (
    <View style={styles.row}>
      <Tool icon="undo" label="Undo" onPress={onUndo} />
      <Tool icon="eraser" label="Erase" onPress={onErase} />
      <Tool icon="pencil" label="Notes" onPress={onToggleNotes} active={notesOn} />
      <Tool icon="bulb" label={`Hint · ${hintsLeft}`} a11y={`Hint, ${hintsLeft} left`} onPress={onHint} disabled={hintsLeft <= 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  tool: { width: 72, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
