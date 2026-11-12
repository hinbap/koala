import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Mode, ThemeDef } from '../theme/themes';
import { Icon } from './ui/Icon';

interface Props {
  def: ThemeDef;
  mode: Mode;
  selected: boolean;
  onPress: () => void;
}

/** A preview of a theme drawn in its own colours and fonts. */
export function ThemeCard({ def, mode, selected, onPress }: Props) {
  const current = useTheme();
  const c = def[mode];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${def.name} theme`}
      style={[
        styles.card,
        {
          backgroundColor: c.paper,
          borderRadius: def.radius,
          borderColor: selected ? current.accent : current.line,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <Text style={{ fontFamily: def.display[def.displayWeight], fontSize: 36, lineHeight: 40, color: c.ink }}>6:45</Text>
      <View style={[styles.swatches, { borderColor: c.line, borderRadius: def.radiusSmall }]}>
        {def.swatches.map((hex) => (
          <View key={hex} style={[styles.swatch, { backgroundColor: hex }]} />
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={{ fontFamily: def.body[500], fontSize: 14, color: c.ink }}>{def.name}</Text>
        {selected && <Icon name="check" size={16} color={c.ink} strokeWidth={2} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 148, height: 172, padding: 14, justifyContent: 'space-between' },
  swatches: { height: 28, flexDirection: 'row', overflow: 'hidden', borderWidth: 1 },
  swatch: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
