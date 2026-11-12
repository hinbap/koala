import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Level, LEVELS } from '../../lib/alarms';
import { useTheme } from '../../theme/ThemeProvider';
import { ChoiceGroup } from '../ui/ChoiceGroup';
import { ThemedText } from '../ui/ThemedText';

interface Props {
  title: string;
  description: string;
  actionLabel: string;
  level: Level;
  onStart: (level: Level) => void;
  onCancel: () => void;
}

export function DifficultySheet({ title, description, actionLabel, level, onStart, onCancel }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedLevel, setSelectedLevel] = useState(level);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel={`Cancel ${title.toLowerCase()}`} accessibilityRole="button" />
        <View style={[styles.sheet, { backgroundColor: theme.paper, paddingBottom: Math.max(insets.bottom, 20), borderTopLeftRadius: theme.def.radius, borderTopRightRadius: theme.def.radius }]}>
          <ThemedText face="display" size={28} accessibilityRole="header">{title}</ThemedText>
          <ThemedText size={14} lineHeight={20} tone="muted">{description}</ThemedText>
          <ChoiceGroup<Level>
            label={`${title} difficulty`}
            options={LEVELS.map((value) => ({ value, label: value }))}
            value={selectedLevel}
            onChange={setSelectedLevel}
          />
          <View style={styles.actions}>
            <Pressable onPress={onCancel} accessibilityRole="button" style={styles.button}>
              <ThemedText tone="muted">Cancel</ThemedText>
            </Pressable>
            <Pressable onPress={() => onStart(selectedLevel)} accessibilityRole="button" style={[styles.button, { backgroundColor: theme.accent, borderRadius: theme.def.radius }]}>
              <ThemedText weight={500} tone="onAccent">{actionLabel}</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 20, gap: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
