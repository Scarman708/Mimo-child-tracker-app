import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Body, Button, Card, Screen, SectionLabel, TextField } from '@/components/ui';
import { useSession } from '@/store/session';
import { sessionKey, Side, useTimers } from '@/store/timers';
import { durationMs, firstStart, formatClock, formatDuration, isRunning, lastEnd, lastStart } from '@/lib/timer';
import { useNow } from '@/lib/useNow';
import { fmtTime } from '@/lib/format';
import { describeEvent } from '@/lib/eventText';
import { useLastEvents } from '@/features/log/useLastEvents';
import { useSaveEvent } from '@/features/log/useSaveEvent';
import { useColors, font, radius } from '@/theme';

const LABEL: Record<Side, string> = { left: 'Left', right: 'Right' };

export function BreastfeedingScreen() {
  const c = useColors();
  const router = useRouter();
  const { selectedChildId, prefs } = useSession();
  const childId = selectedChildId!;
  const session = useTimers((s) => s.sessions[sessionKey(childId, 'breastfeeding')]);
  const { toggleSide, switchSide, setNote, finish, discard } = useTimers.getState();
  const save = useSaveEvent();
  const { data } = useLastEvents(childId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const timers = { left: session?.timers.left ?? [], right: session?.timers.right ?? [] };
  const anyRunning = isRunning(timers.left) || isRunning(timers.right);
  const now = useNow(anyRunning);
  const ms = { left: durationMs(timers.left, now), right: durationMs(timers.right, now) };
  const lastFeed = data?.lastFeed;
  const priorSide = lastFeed?.category === 'breastfeeding' ? (lastFeed.payload?.last_side as Side | undefined) : undefined;

  async function onFinish() {
    setError(undefined);
    const s = finish(childId, 'breastfeeding'); // pauses + persists, so a failed save can be retried safely
    const l = s?.timers.left ?? [], r = s?.timers.right ?? [];
    const leftMs = durationMs(l, 0), rightMs = durationMs(r, 0);
    if (!s || leftMs + rightMs < 1000) return setError('Start a timer first — nothing to save yet.');

    const starts = [firstStart(l), firstStart(r)].filter((x): x is number => x != null);
    const ends = [lastEnd(l, 0), lastEnd(r, 0)].filter((x): x is number => x != null);
    const firstSide: Side = (firstStart(l) ?? Infinity) <= (firstStart(r) ?? Infinity) ? 'left' : 'right';
    const lastSide: Side = (lastStart(l) ?? 0) >= (lastStart(r) ?? 0) ? 'left' : 'right';

    setSaving(true);
    const err = await save({
      id: s.id, child_id: childId, category: 'breastfeeding',
      started_at: new Date(Math.min(...starts)).toISOString(),
      ended_at: new Date(Math.max(...ends)).toISOString(),
      note: s.note,
      payload: { left_ms: leftMs, right_ms: rightMs, total_ms: leftMs + rightMs, first_side: firstSide, last_side: lastSide, segments: { left: l, right: r } },
    });
    setSaving(false);
    if (err) return setError(err);
    discard(childId, 'breastfeeding');
    router.back();
  }

  const onDiscard = () => {
    if (!session) return router.back();
    Alert.alert('Discard this feeding?', 'The timers and note will be deleted and nothing is saved.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { discard(childId, 'breastfeeding'); router.back(); } },
    ]);
  };

  // A render function (not a nested component) so the buttons aren't remounted on every 1-second tick.
  const renderSide = (side: Side) => {
    const running = isRunning(timers[side]);
    const hasTime = timers[side].length > 0;
    return (
      <View key={side} style={{ flex: 1, borderRadius: radius.lg, borderWidth: 2, borderColor: running ? c.primary : c.border, backgroundColor: running ? c.mint : c.card, padding: 14, alignItems: 'center', gap: 6 }}>
        <Text style={{ fontFamily: font.semibold, fontSize: 14, color: c.textMuted }}>{LABEL[side]}{priorSide && priorSide !== side && !session ? ' · suggested' : ''}</Text>
        <Text accessibilityLabel={`${LABEL[side]} side, ${formatDuration(ms[side])}`} style={{ fontFamily: font.bold, fontSize: 34, color: c.text }}>{formatClock(ms[side])}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${running ? 'Pause' : hasTime ? 'Resume' : 'Start'} ${LABEL[side]} side`}
          onPress={() => toggleSide(childId, side)}
          style={{ minHeight: 52, alignSelf: 'stretch', borderRadius: radius.md, backgroundColor: c.primary, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={running ? 'pause' : 'play'} size={20} color={c.onPrimary} />
          <Text style={{ fontFamily: font.bold, color: c.onPrimary }}>{running ? 'Pause' : hasTime ? 'Resume' : 'Start'}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Screen headerShown>
      <Card tint="sky" style={{ marginBottom: 16 }}>
        <Body muted style={{ fontSize: 13 }}>Last feeding</Body>
        <Text style={{ fontFamily: font.bold, fontSize: 16, color: c.text }}>
          {lastFeed ? `${fmtTime(lastFeed.started_at, prefs.timeFormat)} · ${describeEvent(lastFeed)}` : '—'}
        </Text>
        {priorSide ? <Body muted style={{ fontSize: 13 }}>Last side: {LABEL[priorSide]}</Body> : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {renderSide('left')}
        {renderSide('right')}
      </View>

      <View style={{ marginVertical: 16 }}>
        <Button label="Switch Side" variant="secondary" onPress={() => switchSide(childId)} disabled={!session} />
      </View>

      <Card style={{ alignItems: 'center' }}>
        <Body muted>Total</Body>
        <Text style={{ fontFamily: font.bold, fontSize: 40, color: c.text }}>{formatClock(ms.left + ms.right)}</Text>
        <Body muted style={{ fontSize: 13 }}>Left {formatDuration(ms.left)} · Right {formatDuration(ms.right)}</Body>
      </Card>

      <SectionLabel>Note (optional)</SectionLabel>
      {session ? (
        <TextField label="Note" value={session.note} onChangeText={(t) => setNote(childId, 'breastfeeding', t)} multiline placeholder="e.g. sleepy, good latch" maxLength={500} />
      ) : <Body muted style={{ fontSize: 14 }}>Start a timer to add a note.</Body>}

      {error ? <Text accessibilityRole="alert" style={{ color: c.error, fontFamily: font.regular, marginVertical: 8 }}>{error}</Text> : null}
      <View style={{ gap: 12, marginTop: 12 }}>
        <Button label="Finish & Save" onPress={onFinish} loading={saving} disabled={!session} />
        <Button label="Discard" variant="secondary" onPress={onDiscard} />
      </View>
    </Screen>
  );
}
