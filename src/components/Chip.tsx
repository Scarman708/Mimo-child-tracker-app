import React from 'react';
import { Pressable, Text } from 'react-native';
import { useColors, font } from '@/theme';

/** Filter / choice pill. Selection is shown by border + fill and exposed to TalkBack (not colour only). */
export function Chip({ label, selected, onPress, accessibilityLabel, emoji }: {
  label: string; selected?: boolean; onPress: () => void; accessibilityLabel?: string; emoji?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5,
        borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.sky : c.card,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.8 : 1,
      })}>
      {emoji ? <Text style={{ fontSize: 16 }}>{emoji}</Text> : null}
      <Text style={{ fontFamily: selected ? font.bold : font.semibold, fontSize: 14, color: c.text }}>{label}</Text>
    </Pressable>
  );
}
