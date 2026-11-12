import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from './Icon';
import { ThemedText } from './ThemedText';

interface Props {
  title: string;
  backLabel: string;
  onBack: () => void;
}

/** "‹ Back" link above a large serif title — used by Settings and Wake-ups. */
export function ScreenHeader({ title, backLabel, onBack }: Props) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={`Back to ${backLabel}`} style={styles.back}>
        <Icon name="chevron-left" size={18} color={t.accent} strokeWidth={1.6} />
        <ThemedText weight={500} size={14} tone="accent">
          {backLabel}
        </ThemedText>
      </Pressable>
      <ThemedText face="display" size={32} lineHeight={40} accessibilityRole="header">
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 8 },
  back: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
});
