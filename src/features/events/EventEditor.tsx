import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { Body, Button, SectionLabel, Segmented, TextField } from '@/components/ui';
import { DateTimeField } from '@/components/DateTimeField';
import { EventDetail, EventFields, categoryMeta } from '@/lib/eventText';
import { parseAmount, round1, volumeUnitFor } from '@/lib/volume';
import { useSession } from '@/store/session';
import { useEventActions } from '@/features/events/eventActions';
import { BottleDraft, BottleFields, bottleFromEvent, bottleToFields, validateBottle } from '@/features/log/bottle';
import { SolidsDraft, SolidsFields, solidsFromEvent, solidsToFields, validateSolids } from '@/features/log/solids';
import { useColors, font } from '@/theme';

export interface EditorProps { event: EventDetail; onDone: () => void; onCancel: () => void }

/** Shared save / dirty-tracking / "discard changes?" logic for every category editor. */
function useEditor(event: EventDetail, sig: string, onDone: () => void, onCancel: () => void) {
  const { update } = useEventActions();
  const nav = useNavigation();
  const initial = useRef(sig).current;
  const dirty = sig !== initial;
  const finished = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const unsub = nav.addListener('beforeRemove', (e: any) => {
      if (!dirty || finished.current) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'You have unsaved changes to this entry.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => nav.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [nav, dirty]);

  async function save(validate: () => string | null, build: () => EventFields) {
    setError(undefined);
    const problem = validate();
    if (problem) return setError(problem);
    setSaving(true);
    const err = await update(event.id, event.version, build());
    setSaving(false);
    if (err) return setError(err);
    finished.current = true;
    onDone();
  }
  function cancel() {
    if (!dirty) return onCancel();
    Alert.alert('Discard changes?', 'Your edits will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { finished.current = true; onCancel(); } },
    ]);
  }
  return { saving, error, save, cancel };
}

function Footer({ ed, onSave }: { ed: ReturnType<typeof useEditor>; onSave: () => void }) {
  const c = useColors();
  return (
    <>
      {ed.error ? <Text accessibilityRole="alert" style={{ color: c.error, fontFamily: font.regular, marginBottom: 12 }}>{ed.error}</Text> : null}
      <Button label="Save changes" onPress={onSave} loading={ed.saving} />
      <View style={{ height: 12 }} />
      <Button label="Cancel" variant="secondary" onPress={ed.cancel} disabled={ed.saving} />
    </>
  );
}

const futureCheck = (d: Date) => (d.getTime() > Date.now() + 60000 ? 'The time can’t be in the future.' : null);

function DiaperEditor({ event, onDone, onCancel }: EditorProps) {
  const [type, setType] = useState<string | null>(event.subtype ?? null);
  const [when, setWhen] = useState(() => new Date(event.started_at));
  const [note, setNote] = useState(event.note ?? '');
  const ed = useEditor(event, JSON.stringify([type, when.getTime(), note]), onDone, onCancel);
  return (
    <>
      <SectionLabel>Type</SectionLabel>
      <Segmented value={type} onChange={setType} label="Diaper type"
        options={['wet', 'dirty', 'mixed', 'dry'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
      <View style={{ height: 16 }} />
      <DateTimeField label="When" value={when} onChange={setWhen} maximumDate={new Date()} />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} multiline maxLength={500} />
      <Footer ed={ed} onSave={() => ed.save(
        () => (type ? futureCheck(when) : 'Choose a diaper type.'),
        () => ({ subtype: type, started_at: when.toISOString(), ended_at: null, payload: event.payload ?? {}, note }),
      )} />
    </>
  );
}

function SleepEditor({ event, onDone, onCancel }: EditorProps) {
  const [kind, setKind] = useState<string | null>(event.subtype ?? 'nap');
  const [start, setStart] = useState(() => new Date(event.started_at));
  const [end, setEnd] = useState(() => new Date(event.ended_at ?? event.started_at));
  const [note, setNote] = useState(event.note ?? '');
  const ed = useEditor(event, JSON.stringify([kind, start.getTime(), end.getTime(), note]), onDone, onCancel);
  return (
    <>
      <SectionLabel>Type</SectionLabel>
      <Segmented value={kind} onChange={setKind} label="Sleep type" options={[{ value: 'nap', label: 'Nap' }, { value: 'night', label: 'Night sleep' }]} />
      <View style={{ height: 16 }} />
      <DateTimeField label="Fell asleep" value={start} onChange={setStart} maximumDate={new Date()} />
      <DateTimeField label="Woke up" value={end} onChange={setEnd} maximumDate={new Date()} />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} multiline maxLength={500} />
      <Footer ed={ed} onSave={() => ed.save(
        () => {
          if (end.getTime() <= start.getTime()) return 'Wake-up time must be after the time they fell asleep.';
          if (end.getTime() - start.getTime() > 24 * 3600_000) return 'A sleep can’t be longer than 24 hours.';
          return futureCheck(end);
        },
        () => ({ subtype: kind, started_at: start.toISOString(), ended_at: end.toISOString(), payload: { ...(event.payload ?? {}), duration_ms: end.getTime() - start.getTime() }, note }),
      )} />
    </>
  );
}

function BottleEditor({ event, onDone, onCancel }: EditorProps) {
  const child = useSession((s) => s.children.find((k) => k.id === event.child_id));
  const [draft, setDraft] = useState<BottleDraft>(() => bottleFromEvent(event, volumeUnitFor(child)));
  const ed = useEditor(event, JSON.stringify({ ...draft, when: draft.when.getTime() }), onDone, onCancel);
  return (
    <>
      <BottleFields draft={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} />
      <Footer ed={ed} onSave={() => ed.save(() => validateBottle(draft), () => bottleToFields(draft))} />
    </>
  );
}

function SolidsEditor({ event, onDone, onCancel }: EditorProps) {
  const [draft, setDraft] = useState<SolidsDraft>(() => solidsFromEvent(event));
  const ed = useEditor(event, JSON.stringify({ ...draft, when: draft.when.getTime() }), onDone, onCancel);
  return (
    <>
      <SolidsFields draft={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} childId={event.child_id} />
      <Footer ed={ed} onSave={() => ed.save(() => validateSolids(draft), () => solidsToFields(draft))} />
    </>
  );
}

const mins = (ms: unknown) => (typeof ms === 'number' && ms > 0 ? String(round1(ms / 60000)) : '');

/** Breastfeeding: edit start, per-side minutes and note. Edited sessions drop second-by-second segments and are flagged. */
function BreastEditor({ event, onDone, onCancel }: EditorProps) {
  const p = (event.payload ?? {}) as any;
  const [start, setStart] = useState(() => new Date(event.started_at));
  const [left, setLeft] = useState(mins(p.left_ms));
  const [right, setRight] = useState(mins(p.right_ms));
  const [note, setNote] = useState(event.note ?? '');
  const initial = useRef({ start: start.getTime(), left, right }).current;
  const ed = useEditor(event, JSON.stringify([start.getTime(), left, right, note]), onDone, onCancel);

  const parse = (s: string) => (s.trim() === '' ? 0 : parseAmount(s));
  return (
    <>
      <DateTimeField label="Started" value={start} onChange={setStart} maximumDate={new Date()} />
      <TextField label="Left breast" suffix="min" keyboardType="decimal-pad" value={left} onChangeText={setLeft} maxLength={5} />
      <TextField label="Right breast" suffix="min" keyboardType="decimal-pad" value={right} onChangeText={setRight} maxLength={5} />
      <Body muted style={{ marginBottom: 16 }}>Changing the times marks this session as edited manually.</Body>
      <TextField label="Note (optional)" value={note} onChangeText={setNote} multiline maxLength={500} />
      <Footer ed={ed} onSave={() => ed.save(
        () => {
          const l = parse(left), r = parse(right);
          if (l === null || r === null) return 'Enter the minutes as numbers.';
          if (l > 300 || r > 300) return 'Each side can be at most 300 minutes.';
          if (l + r <= 0) return 'Enter minutes for at least one side.';
          return futureCheck(start);
        },
        () => {
          const unchanged = start.getTime() === initial.start && left === initial.left && right === initial.right;
          if (unchanged) return { subtype: null, started_at: event.started_at, ended_at: event.ended_at ?? null, payload: event.payload ?? {}, note };
          const lms = Math.round(parse(left)! * 60000), rms = Math.round(parse(right)! * 60000);
          const first = p.first_side && (p.first_side === 'left' ? lms : rms) > 0 ? p.first_side : lms > 0 ? 'left' : 'right';
          const last = p.last_side && (p.last_side === 'left' ? lms : rms) > 0 ? p.last_side : lms > 0 && rms === 0 ? 'left' : rms > 0 ? 'right' : 'left';
          return {
            subtype: null, started_at: start.toISOString(), ended_at: new Date(start.getTime() + lms + rms).toISOString(),
            payload: { left_ms: lms, right_ms: rms, total_ms: lms + rms, first_side: first, last_side: last, segments: { left: [], right: [] }, manual_edit: true },
            note,
          };
        },
      )} />
    </>
  );
}

/** Any category without a dedicated form yet: time + note only. */
function GenericEditor({ event, onDone, onCancel }: EditorProps) {
  const [when, setWhen] = useState(() => new Date(event.started_at));
  const [note, setNote] = useState(event.note ?? '');
  const ed = useEditor(event, JSON.stringify([when.getTime(), note]), onDone, onCancel);
  return (
    <>
      <Body muted style={{ marginBottom: 12 }}>{categoryMeta(event.category).label}: you can change the time and note.</Body>
      <DateTimeField label="When" value={when} onChange={setWhen} maximumDate={new Date()} />
      <TextField label="Note" value={note} onChangeText={setNote} multiline maxLength={500} />
      <Footer ed={ed} onSave={() => ed.save(
        () => futureCheck(when),
        () => {
          const span = event.ended_at ? new Date(event.ended_at).getTime() - new Date(event.started_at).getTime() : null;
          return { subtype: event.subtype ?? null, started_at: when.toISOString(), ended_at: span && span > 0 ? new Date(when.getTime() + span).toISOString() : null, payload: event.payload ?? {}, note };
        },
      )} />
    </>
  );
}

const EDITORS: Record<string, React.ComponentType<EditorProps>> = {
  diaper: DiaperEditor, sleep: SleepEditor, bottle: BottleEditor, solids: SolidsEditor, breastfeeding: BreastEditor,
};

export function EventEditor(props: EditorProps) {
  const Editor = EDITORS[props.event.category] ?? GenericEditor;
  return <Editor {...props} />;
}
