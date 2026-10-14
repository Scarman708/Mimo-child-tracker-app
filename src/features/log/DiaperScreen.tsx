import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Button, Screen, SectionLabel, TextField } from '@/components/ui';
import { DateTimeField } from '@/components/DateTimeField';
import { useSession } from '@/store/session';
import { useSaveEvent } from '@/features/log/useSaveEvent';
import { useColors, font, radius } from '@/theme';

type DiaperType = 'wet' | 'dirty' | 'mixed' | 'dry';
const TYPES: { value: DiaperType; label: string; emoji: string }[] = [
  { value: 'wet', label: 'Wet', emoji: '💧' },
  { value: 'dirty', label: 'Dirty', emoji: '💩' },
  { value: 'mixed', label: 'Mixed', emoji: '💧💩' },
  { value: 'dry', label: 'Dry', emoji: '☁️' },
];

export function DiaperScreen() {
  const c = useColors();
  const router = useRouter();
  const childId = useSession((s) => s.selectedChildId)!;
  const save = useSaveEvent();
  const [type, setType] = useState<DiaperType | null>(null);
  const [when, setWhen] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const id = useRef(randomUUID()); // one id per form -> retried saves are idempotent

  async function onSave() {
    setError(undefined);
    if (!type) return setError('Choose a diaper type.');
    if (when.getTime() > Date.now() + 60000) return setError('The time can’t be in the future.');
    setSaving(true);
    const err = await save({ id: id.current, child_id: childId, category: 'diaper', subtype: type, started_at: when.toISOString(), note });
    setSaving(false);
    if (err) return setError(err);
    router.back();
  }

  return (
    <Screen headerShown>
      <SectionLabel>Type</SectionLabel>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        {TYPES.map((t) => {
          const on = type === t.value;
          return (
            <Pressable key={t.value} accessibilityRole="radio" accessibilityLabel={t.label} accessibilityState={{ selected: on }} onPress={() => setType(t.value)}
              style={{ width: '47%', flexGrow: 1, minHeight: 92, borderRadius: radius.lg, borderWidth: 2, borderColor: on ? c.primary : c.border, backgroundColor: on ? c.sky : c.card, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
              <Text style={{ fontFamily: font.bold, fontSize: 16, color: c.text }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <DateTimeField label="When" value={when} onChange={setWhen} maximumDate={new Date()} />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} multiline maxLength={500} placeholder="e.g. a little rash" />
      {error ? <Text accessibilityRole="alert" style={{ color: c.error, fontFamily: font.regular, marginBottom: 12 }}>{error}</Text> : null}
      <Button label="Save" onPress={onSave} loading={saving} />
    </Screen>
  );
}
