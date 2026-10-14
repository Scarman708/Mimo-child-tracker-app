import React from 'react';
import { View } from 'react-native';
import { SectionLabel, TextField } from '@/components/ui';
import { Chip } from '@/components/Chip';
import { DateTimeField } from '@/components/DateTimeField';
import { EventFields, EventRow } from '@/lib/eventText';
import { parseAmount, round1 } from '@/lib/volume';

export type CareKind = 'bath' | 'tummy_time';
export const CARE_LABEL: Record<CareKind, string> = { bath: 'Bath', tummy_time: 'Tummy time' };
export interface CareDraft { minutes: string; when: Date; note: string }

export const emptyCare = (): CareDraft => ({ minutes: '', when: new Date(), note: '' });

export function careFromEvent(e: EventRow): CareDraft {
  const ms = (e.payload as any)?.duration_ms;
  return { minutes: typeof ms === 'number' && ms > 0 ? String(round1(ms / 60000)) : '', when: new Date(e.started_at), note: e.note ?? '' };
}

export function validateCare(d: CareDraft): string | null {
  if (d.minutes.trim()) {
    const m = parseAmount(d.minutes);
    if (m === null || m <= 0 || m > 240) return 'Duration should be a number of minutes between 1 and 240, or leave it blank.';
  }
  if (d.when.getTime() > Date.now() + 60000) return 'The time can’t be in the future.';
  return null;
}

export function careToFields(d: CareDraft): EventFields {
  const mins = d.minutes.trim() ? parseAmount(d.minutes) : null;
  return {
    subtype: null, started_at: d.when.toISOString(),
    ended_at: mins ? new Date(d.when.getTime() + mins * 60000).toISOString() : null,
    payload: { duration_ms: mins ? Math.round(mins * 60000) : null },
    note: d.note,
  };
}

const QUICK = [5, 10, 15, 20, 30];

export function CareFields({ draft, onChange }: { draft: CareDraft; onChange: (p: Partial<CareDraft>) => void }) {
  return (
    <>
      <DateTimeField label="When" value={draft.when} onChange={(when) => onChange({ when })} maximumDate={new Date()} />
      <SectionLabel>How long? (optional)</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {QUICK.map((m) => <Chip key={m} label={`${m} min`} selected={draft.minutes === String(m)} onPress={() => onChange({ minutes: draft.minutes === String(m) ? '' : String(m) })} />)}
      </View>
      <TextField label="Minutes" suffix="min" keyboardType="decimal-pad" value={draft.minutes} onChangeText={(minutes) => onChange({ minutes })} maxLength={5} placeholder="Or type a number" />
      <TextField label="Note (optional)" value={draft.note} onChangeText={(note) => onChange({ note })} multiline maxLength={500} />
    </>
  );
}
