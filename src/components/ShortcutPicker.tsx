import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { useSession } from '@/store/session';
import { ALL_SHORTCUTS, ShortcutKey } from '@/types';
import { useColors, font, radius } from '@/theme';

/** Tap order = dashboard order (numbered badge). Used in onboarding and Settings. */
export function ShortcutPicker({ onDone, label = 'Continue' }: { onDone: () => void; label?: string }) {
  const c = useColors();
  const { shortcuts, saveShortcuts } = useSession();
  const [selected, setSelected] = useState<ShortcutKey[]>(shortcuts);
  const [saving, setSaving] = useState(false);
  const toggle = (k: ShortcutKey) => setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  async function next() { setSaving(true); await saveShortcuts(selected); setSaving(false); onDone(); }

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {ALL_SHORTCUTS.map((s) => {
          const idx = selected.indexOf(s.key);
          const on = idx >= 0;
          return (
            <Pressable key={s.key} onPress={() => toggle(s.key)} accessibilityRole="checkbox"
              accessibilityLabel={on ? `${s.label}, position ${idx + 1}` : s.label} accessibilityState={{ checked: on }}
              style={{ width: '30%', flexGrow: 1, minHeight: 96, borderRadius: radius.lg, borderWidth: 2, borderColor: on ? c.primary : c.border, backgroundColor: on ? c.sky : c.card, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name={s.icon as any} size={28} color={c.primary} />
              <Text style={{ fontFamily: font.semibold, color: c.text }}>{s.label}</Text>
              {on && (
                <View style={{ position: 'absolute', top: 6, right: 6, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.onPrimary, fontFamily: font.bold, fontSize: 12 }}>{idx + 1}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <Button label={label} onPress={next} loading={saving} disabled={selected.length === 0} />
    </View>
  );
}
