import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Button, Screen } from '@/components/ui';
import { useSession } from '@/store/session';
import { useSaveEvent } from '@/features/log/useSaveEvent';
import { TempDraft, TemperatureFields, emptyTemp, tempToFields, validateTemp } from '@/features/log/temperature';
import { tempUnitFor } from '@/lib/health';
import { useColors, font } from '@/theme';

export function TemperatureScreen() {
  const c = useColors();
  const router = useRouter();
  const childId = useSession((s) => s.selectedChildId)!;
  const child = useSession((s) => s.children.find((k) => k.id === s.selectedChildId));
  const save = useSaveEvent();
  const [draft, setDraft] = useState<TempDraft>(() => emptyTemp(tempUnitFor(child)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const id = useRef(randomUUID()); // one id per form -> a retried save can't create a duplicate

  async function onSave() {
    setError(undefined);
    const problem = validateTemp(draft);
    if (problem) return setError(problem);
    setSaving(true);
    const err = await save({ id: id.current, child_id: childId, category: 'temperature', ...tempToFields(draft) });
    setSaving(false);
    if (err) return setError(err);
    router.back();
  }

  return (
    <Screen headerShown>
      <TemperatureFields draft={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} />
      {error ? <Text accessibilityRole="alert" style={{ color: c.error, fontFamily: font.regular, marginBottom: 12 }}>{error}</Text> : null}
      <Button label="Save" onPress={onSave} loading={saving} />
    </Screen>
  );
}
