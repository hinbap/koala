import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Alarm, DAY_FULL, DAY_SHORT, describeDays, Level, LEVELS } from '../lib/alarms';
import { ThemedText } from './ui/ThemedText';
import { ChoiceGroup } from './ui/ChoiceGroup';
import { Dropdown } from './ui/Dropdown';
import { TimeWheel } from './TimeWheel';
import { AlarmSoundId, SOUND_OPTIONS } from '../lib/sounds';

export type AlarmDraft = Omit<Alarm, 'id'> & { id: number | null };

interface Props {
  draft: AlarmDraft;
  onCancel: () => void;
  onSave: (draft: AlarmDraft) => void;
  onDelete: (id: number) => void;
}

/** Bottom sheet for adding or editing an alarm. */
export function AlarmEditorSheet({ draft, onCancel, onSave, onDelete }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [d, setD] = useState(draft);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.scrim}>
          <View style={[styles.sheet, { backgroundColor: t.paper, borderTopLeftRadius: t.def.radius, borderTopRightRadius: t.def.radius, paddingBottom: insets.bottom }]}>
            <View style={[styles.bar, { borderBottomColor: t.line }]}>
              <Pressable onPress={onCancel} style={styles.barButton} accessibilityRole="button">
                <ThemedText tone="muted">Cancel</ThemedText>
              </Pressable>
              <ThemedText face="display" size={20} lineHeight={28} accessibilityRole="header">
                {d.id === null ? 'New alarm' : 'Edit alarm'}
              </ThemedText>
              <Pressable onPress={() => onSave(d)} style={[styles.barButton, styles.barRight]} accessibilityRole="button">
                <ThemedText weight={600} tone="accent">Save</ThemedText>
              </Pressable>
            </View>

            <View style={styles.picker}>
              <TimeWheel value={d} onChange={(patch) => setD((cur) => ({ ...cur, ...patch }))} />
            </View>

            <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
              <View style={styles.group}>
                <View style={styles.spread}>
                  <ThemedText caption tone="muted">Repeat</ThemedText>
                  <ThemedText size={14} tone="muted">{describeDays(d.days)}</ThemedText>
                </View>
                <View style={styles.spread}>
                  {d.days.map((on, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setD({ ...d, days: d.days.map((x, k) => (k === i ? !x : x)) })}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`Repeat on ${DAY_FULL[i]}`}
                      style={[styles.day, { borderRadius: t.def.radiusSmall, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.soft : 'transparent' }]}
                    >
                      <ThemedText caption tone={on ? 'accent' : 'muted'}>{DAY_SHORT[i]}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: t.line }}>
                <View style={[styles.field, { borderBottomColor: t.line }]}>
                  <ThemedText>Label</ThemedText>
                  <TextInput
                    value={d.label}
                    onChangeText={(label) => setD({ ...d, label })}
                    placeholder="Alarm"
                    placeholderTextColor={t.muted}
                    accessibilityLabel="Label"
                    style={[styles.input, { color: t.muted, fontFamily: t.def.body[400] }]}
                  />
                </View>
                <Dropdown<AlarmSoundId>
                  label="Sound"
                  value={d.sound}
                  options={SOUND_OPTIONS}
                  onChange={(sound) => setD({ ...d, sound })}
                />
              </View>

              <View style={styles.group}>
                <ThemedText caption tone="muted">To turn it off</ThemedText>
                <ChoiceGroup<Level>
                  label="Sudoku difficulty"
                  value={d.level}
                  onChange={(level) => setD({ ...d, level })}
                  options={LEVELS.map((l) => ({ value: l, label: l }))}
                />
                <ThemedText size={14} lineHeight={20} tone="muted">
                  Solve the sudoku to silence the alarm.
                </ThemedText>
              </View>

              {d.id !== null && (
                <Pressable onPress={() => d.id !== null && onDelete(d.id)} style={styles.deleteLink} accessibilityRole="button">
                  <ThemedText weight={500} tone="alarm">Delete alarm</ThemedText>
                </Pressable>
              )}
            </ScrollView>
          </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { width: '100%', maxWidth: 600, alignSelf: 'center', maxHeight: '94%', overflow: 'hidden' },
  bar: { height: 56, flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, borderBottomWidth: 1 },
  barButton: { minWidth: 72, minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  barRight: { alignItems: 'flex-end' },
  content: { padding: 16, paddingBottom: 32, gap: 32 },
  picker: { padding: 16, flexShrink: 0 },
  form: { flexShrink: 1, minHeight: 0 },
  group: { gap: 8 },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  day: { flex: 1, maxWidth: 44, height: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  field: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1 },
  input: { flex: 1, textAlign: 'right', fontSize: 16 },
  deleteLink: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
});
