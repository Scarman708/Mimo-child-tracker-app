import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Body, Button, Card, Screen } from '@/components/ui';
import { EventEditor } from '@/features/events/EventEditor';
import { canDuplicate, confirmDelete, useEventActions } from '@/features/events/eventActions';
import { EventDetail, categoryMeta, describeEvent, eventDetails, fmtDateTime } from '@/lib/eventText';
import { fmtTime } from '@/lib/format';
import { useSession } from '@/store/session';
import { useColors, font } from '@/theme';

export default function EventScreen() {
  const c = useColors();
  const router = useRouter();
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const prefs = useSession((s) => s.prefs);
  const userId = useSession((s) => s.session?.user.id);
  const actions = useEventActions();
  const [editing, setEditing] = useState(edit === '1');
  const [busy, setBusy] = useState(false);

  const { data: ev, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('events')
        .select('id,child_id,category,subtype,started_at,ended_at,payload,note,creator_id,created_at,updated_at,version,local_timezone,deleted_at')
        .eq('id', id!).maybeSingle();
      if (error) throw error;
      if (!data || data.deleted_at) return null;
      return data as unknown as EventDetail;
    },
  });

  if (isLoading) return <Screen headerShown><ActivityIndicator color={c.primary} style={{ marginTop: 40 }} /></Screen>;
  if (isError) return (
    <Screen headerShown>
      <Card><Body>Couldn’t load this entry.</Body><View style={{ height: 8 }} /><Button label="Retry" variant="secondary" onPress={() => refetch()} /></Card>
    </Screen>
  );
  if (!ev) return (
    <Screen headerShown>
      <Card tint="sky"><Body>This entry isn’t available. It may have been deleted.</Body></Card>
      <View style={{ height: 12 }} />
      <Button label="Go back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );

  const meta = categoryMeta(ev.category);
  const details = eventDetails(ev);
  const edited = ev.version > 1 && ev.updated_at;
  const who = !ev.creator_id ? '—' : ev.creator_id === userId ? 'You' : 'Another caregiver';
  const range = ev.ended_at && ['sleep', 'breastfeeding', 'bottle'].includes(ev.category) ? ` → ${fmtTime(ev.ended_at, prefs.timeFormat)}` : '';

  if (editing) {
    return (
      <Screen headerShown>
        <Stack.Screen options={{ title: `Edit ${meta.label.toLowerCase()}` }} />
        <EventEditor event={ev} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </Screen>
    );
  }

  const Line = ({ label, value }: { label: string; value: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <Text style={{ fontFamily: font.regular, fontSize: 15, color: c.textMuted }}>{label}</Text>
      <Text style={{ fontFamily: font.semibold, fontSize: 15, color: c.text, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );

  return (
    <Screen headerShown>
      <Stack.Screen options={{ title: meta.label }} />
      <Card>
        <Text style={{ fontSize: 34 }}>{meta.emoji}</Text>
        <Text accessibilityRole="header" style={{ fontFamily: font.bold, fontSize: 22, color: c.text, marginTop: 4 }}>{describeEvent(ev)}</Text>
        <Text style={{ fontFamily: font.regular, fontSize: 15, color: c.textMuted, marginTop: 2, marginBottom: 8 }}>{fmtDateTime(ev.started_at, prefs.timeFormat)}{range}</Text>
        {details.map((d) => <Line key={d.label} label={d.label} value={d.value} />)}
        {ev.note ? <Line label="Note" value={ev.note} /> : null}
        <Line label="Recorded by" value={who} />
        {edited ? <Line label="Last edited" value={fmtDateTime(ev.updated_at!, prefs.timeFormat)} /> : null}
      </Card>

      <View style={{ height: 20 }} />
      <Button label="Edit" onPress={() => setEditing(true)} />
      {canDuplicate(ev) ? (
        <>
          <View style={{ height: 12 }} />
          <Button label="Duplicate as new" variant="secondary" loading={busy} onPress={async () => {
            setBusy(true);
            const err = await actions.duplicate(ev);
            setBusy(false);
            if (err) return alertError(err);
            router.back();
          }} />
        </>
      ) : null}
      <View style={{ height: 12 }} />
      <Button label="Delete" variant="danger" onPress={() => confirmDelete(ev, actions.remove, () => router.back())} />
    </Screen>
  );
}

const alertError = (m: string) => Alert.alert('Couldn’t duplicate', m);
