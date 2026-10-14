import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSession } from '@/store/session';
import { useColors, font } from '@/theme';

export function ChildSwitcher() {
  const c = useColors();
  const { children, selectedChildId, selectChild } = useSession();
  if (children.length < 2) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
      {children.map((k) => {
        const on = k.id === selectedChildId;
        return (
          <Pressable key={k.id} onPress={() => selectChild(k.id)} accessibilityRole="button" accessibilityLabel={`Switch to ${k.name}`} accessibilityState={{ selected: on }}
            style={{ minHeight: 48, paddingHorizontal: 16, borderRadius: 24, justifyContent: 'center', backgroundColor: on ? c.primary : c.card, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ fontFamily: font.bold, color: on ? c.onPrimary : c.text }}>{k.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
