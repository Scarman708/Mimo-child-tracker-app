import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Button, Screen } from '@/components/ui';
import { useSession } from '@/store/session';
import { useSaveEvent } from '@/features/log/useSaveEvent';
import { emptySolids, SolidsDraft, SolidsFields, solidsToFields, validateSolids } from '@/features/log/solids';
import { useColors, font } from '@/theme';

export function SolidsScreen() {
  const c = useColors();
  const router = useRouter();
  const childId = useSession((s) => s.selectedChildId)!;
  const save = useSaveEvent();
  const [draft, setDraft] = useState<SolidsDraft>(emptySolids);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const id = useRef(randomUUID());

  async function onSave() {
    setError(undefined);
    const problem = validateSolids(draft);
    if (problem) return setError(problem);
    setSaving(true);
    const err = await save({ id: id.current, child_id: childId, category: 'solids', ...solidsToFields(draft) });
    setSaving(false);
    if (err) return setError(err);
    router.back();
  }

  return (
    <Screen headerShown>
      <SolidsFields draft={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} childId={childId} />
      {error ? <Text accessibilityRole="alert" style={{ color: c.error, fontFamily: font.regular, marginBottom: 12 }}>{error}</Text> : null}
      <Button label="Save" onPress={onSave} loading={saving} />
    </Screen>
  );
}
