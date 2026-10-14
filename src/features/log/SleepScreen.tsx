import React, { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Body, Button, Card, Screen, SectionLabel, Segmented, TextField } from '@/components/ui';
import { DateTimeField } from '@/components/DateTimeField';
import { useSession } from '@/store/session';
import { SleepKind, sessionKey, useTimers } from '@/store/timers';
import { durationMs, formatClock, formatDuration, lastEnd } from '@/lib/timer';
import { useNow } from '@/lib/useNow';
import { useSaveEvent } from '@/features/log/useSaveEvent';
import { useColors, font } from '@/theme';

const KINDS = [{ value: 'nap' as SleepKind, label: 'Nap' }, { value: 'night' as SleepKind, label: 'Night Sleep' }];
const suggestedKind = (): SleepKind => { const h = new Date().getHours(); return h >= 19 || h < 6 ? 'night' : 'nap'; };

export function SleepScreen() {
  const c = useColors();
  const router = useRouter();
  const childId = useSession((s) => s.selectedChildId)!;
  const session = useTimers((s) => s.sessions[sessionKey(childId, 'sleep')]);
  const { startSleep, setSleepSubtype, setSleepStart, setNote, finish, discard } = useTimers.getState();
  const save = useSaveEvent();
  const [kind, setKind] = useState<SleepKind>(suggestedKind());
  const [manual, setManual] = useState(false);
  const [mStart, setMStart] = useState(() => new Date(Date.now() - 60 * 60000));
  const [mEnd, setMEnd] = useState(() => new Date());
  const [mNote, setMNote] = useState('');
  const manualId = useRef(randomUUID()); // one id per form -> a retried save can't create a duplicate
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const main = session?.timers.main ?? [];
  const active = !!session && main.length > 0 && main[main.length - 1].end === null;
  const now = useNow(active);

  async function stop() {
    setError(undefined);
    const s = finish(childId, 'sleep');
    const segs = s?.timers.main ?? [];
    const dur = durationMs(segs, 0);
    if (!s || dur < 1000) return setError('That was under a second — discard it or keep sleeping.');
    setSaving(true);
    const err = await save({
      id: s.id, child_id: childId, category: 'sleep', subtype: s.subtype ?? 'nap',
      started_at: new Date(s.startedAt).toISOString(), ended_at: new Date(lastEnd(segs, 0)!).toISOString(),
      note: s.note, payload: { duration_ms: dur },
    });
    setSaving(false);
    if (err) return setError(err);
    discard(childId, 'sleep');
    router.back();
  }

  async function saveManual() {
    setError(undefined);
    const dur = mEnd.getTime() - mStart.getTime();
    if (dur <= 0) return setError('The end time must be after the start time.');
    if (mEnd.getTime() > Date.now() + 60000) return setError('The end time can’t be in the future.');
    if (dur > 24 * 3600000) return setError('Sleep longer than 24 hours isn’t supported. Split it into two entries.');
    setSaving(true);
    const err = await save({
      id: manualId.current, child_id: childId, category: 'sleep', subtype: kind,
      started_at: mStart.toISOString(), ended_at: mEnd.toISOString(), note: mNote, payload: { duration_ms: dur },
    });
    setSaving(false);
    if (err) return setError(err);
    router.back();
  }

  const onDiscard = () => Alert.alert('Discard this sleep?', 'The timer will be deleted and nothing is saved.', [
    { text: 'Keep', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: () => { discard(childId, 'sleep'); router.back(); } },
  ]);

  const ErrorLine = error ? <Text accessibilityRole="alert" style={{ color: c.error, fontFamily: font.regular, marginVertical: 8 }}>{error}</Text> : null;

  // ---- Active session ----
  if (session) {
    return (
      <Screen headerShown>
        <Segmented<SleepKind> label="Sleep type" value={session.subtype ?? 'nap'} onChange={(k) => setSleepSubtype(childId, k)} options={KINDS} />
        <View style={{ alignItems: 'center', marginVertical: 28 }}>
          <Text accessibilityLabel={`Sleeping for ${formatDuration(durationMs(main, now))}`} style={{ fontFamily: font.bold, fontSize: 60, color: c.text }}>{formatClock(durationMs(main, now))}</Text>
          <Body muted>{active ? 'Sleeping…' : 'Stopped — tap Stop & Save to retry'}</Body>
        </View>
        <Card>
          <DateTimeField label="Started" value={new Date(session.startedAt)} maximumDate={new Date()}
            onChange={(d) => (d.getTime() > Date.now() ? setError('Start time can’t be in the future.') : (setError(undefined), setSleepStart(childId, d.getTime())))} />
          <TextField label="Note (optional)" value={session.note} onChangeText={(t) => setNote(childId, 'sleep', t)} multiline maxLength={500} placeholder="e.g. woke once, fussy" containerStyle={{ marginBottom: 0 }} />
        </Card>
        {ErrorLine}
        <View style={{ gap: 12, marginTop: 16 }}>
          <Button label="Stop & Save" onPress={stop} loading={saving} />
          <Button label="Discard" variant="secondary" onPress={onDiscard} />
        </View>
      </Screen>
    );
  }

  // ---- No active session: start a timer, or log a past sleep ----
  return (
    <Screen headerShown>
      <Segmented<SleepKind> label="Sleep type" value={kind} onChange={setKind} options={KINDS} />
      {!manual ? (
        <View style={{ marginTop: 24, gap: 12 }}>
          <Button label={`Start ${kind === 'nap' ? 'Nap' : 'Night Sleep'}`} onPress={() => startSleep(childId, kind)} />
          <Button label="Log a past sleep instead" variant="secondary" onPress={() => setManual(true)} />
        </View>
      ) : (
        <View style={{ marginTop: 20 }}>
          <SectionLabel>Past sleep</SectionLabel>
          <DateTimeField label="Fell asleep" value={mStart} maximumDate={new Date()} onChange={setMStart} />
          <DateTimeField label="Woke up" value={mEnd} maximumDate={new Date()} onChange={setMEnd} />
          <Card tint="mint" style={{ marginBottom: 16 }}>
            <Body>Duration: {mEnd > mStart ? formatDuration(mEnd.getTime() - mStart.getTime()) : '—'}</Body>
          </Card>
          <TextField label="Note (optional)" value={mNote} onChangeText={setMNote} multiline maxLength={500} />
          {ErrorLine}
          <View style={{ gap: 12, marginTop: 8 }}>
            <Button label="Save Sleep" onPress={saveManual} loading={saving} />
            <Button label="Back to timer" variant="secondary" onPress={() => { setManual(false); setError(undefined); }} />
          </View>
        </View>
      )}
    </Screen>
  );
}
