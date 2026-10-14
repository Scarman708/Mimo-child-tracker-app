import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Body, Button, Card, Screen, SectionLabel, TextField } from '@/components/ui';
import { Chip } from '@/components/Chip';
import { DateField } from '@/components/DateField';
import { Milestone, PRESETS, fromYmd, useMilestone, useMilestoneActions, ymd } from '@/features/milestones/api';
import { useSession } from '@/store/session';
import { useColors, font } from '@/theme';

export default function MilestoneScreen() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { data, isLoading, isError, refetch } = useMilestone(isNew ? undefined : id);
  if (!isNew && isLoading) return <Screen headerShown><ActivityIndicator color={c.primary} style={{ marginTop: 40 }} /></Screen>;
  if (!isNew && isError) return <Screen headerShown><Card><Body>Couldn’t load this milestone.</Body><View style={{ height: 8 }} /><Button label="Retry" variant="secondary" onPress={() => refetch()} /></Card></Screen>;
  if (!isNew && !data) return (
    <Screen headerShown>
      <Card tint="sky"><Body>This milestone isn’t available. It may have been deleted.</Body></Card>
      <View style={{ height: 12 }} /><Button label="Go back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
  return <MilestoneForm key={data?.id ?? 'new'} initial={data ?? null} />;
}

function MilestoneForm({ initial }: { initial: Milestone | null }) {
  const c = useColors();
  const router = useRouter();
  const nav = useNavigation();
  const childId = useSession((s) => s.selectedChildId)!;
  const actions = useMilestoneActions();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [date, setDate] = useState(() => (initial ? fromYmd(initial.occurred_on) : new Date()));
  const [note, setNote] = useState(initial?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const newId = useRef(randomUUID());

  const sig = JSON.stringify([title, ymd(date), note]);
  const base = useRef(sig).current;
  const dirty = sig !== base;
  const finished = useRef(false);
  useEffect(() => nav.addListener('beforeRemove', (e: any) => {
    if (!dirty || finished.current) return;
    e.preventDefault();
    Alert.alert('Discard changes?', 'You have unsaved changes.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => nav.dispatch(e.data.action) },
    ]);
  }), [nav, dirty]);

  async function onSave() {
    setError(undefined);
    const t = title.trim().replace(/\s+/g, ' ');
    if (!t) return setError('Enter a milestone name, or pick one above.');
    if (t.length > 80) return setError('The name can be at most 80 characters.');
    if (date.getTime() > Date.now() + 86400000) return setError('The date can’t be in the future.');
    const fields = { title: t, preset_key: PRESETS.find((p) => p.label === t)?.key ?? null, occurred_on: ymd(date), note };
    setSaving(true);
    const err = initial ? await actions.update(initial.id, initial.version, fields) : await actions.create({ id: newId.current, child_id: childId, ...fields });
    setSaving(false);
    if (err) return setError(err);
    finished.current = true;
    router.back();
  }

  function onDelete() {
    Alert.alert('Delete this milestone?', `“${initial!.title}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const err = await actions.remove(initial!.id);
        if (err) return Alert.alert('Couldn’t delete', err);
        finished.current = true;
        router.back();
      } },
    ]);
  }

  return (
    <Screen headerShown>
      <Stack.Screen options={{ title: initial ? 'Edit milestone' : 'New milestone' }} />
      <SectionLabel>Pick one</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {PRESETS.map((p) => <Chip key={p.key} emoji={p.emoji} label={p.label} selected={title.trim() === p.label} onPress={() => setTitle(p.label)} />)}
      </View>
      <TextField label="Or write your own" value={title} onChangeText={setTitle} maxLength={80} placeholder="e.g. Waved goodbye" />
      <DateField label="Date" value={date} onChange={setDate} maximumDate={new Date()} />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} multiline maxLength={1000} placeholder="Where were you? Who saw it?" />
      {error ? <Text accessibilityRole="alert" style={{ color: c.error, fontFamily: font.regular, marginBottom: 12 }}>{error}</Text> : null}
      <Button label="Save" onPress={onSave} loading={saving} />
      {initial ? <><View style={{ height: 12 }} /><Button label="Delete" variant="danger" onPress={onDelete} disabled={saving} /></> : null}
    </Screen>
  );
}
