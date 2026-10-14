import React from 'react';
import { View } from 'react-native';
import { Body, Segmented, SectionLabel, TextField } from '@/components/ui';
import { Chip } from '@/components/Chip';
import { DateTimeField } from '@/components/DateTimeField';
import { EventFields, EventRow } from '@/lib/eventText';
import { TEMP_METHOD_LABEL, TEMP_RANGE, TempUnit, tempLabel, toC } from '@/lib/health';
import { normAmount, parseAmount, round1 } from '@/lib/volume';

export interface TempDraft { value: string; unit: TempUnit; method: string | null; when: Date; note: string }

export const emptyTemp = (unit: TempUnit): TempDraft => ({ value: '', unit, method: null, when: new Date(), note: '' });

export function tempFromEvent(e: EventRow, fallback: TempUnit): TempDraft {
  const p = (e.payload ?? {}) as any;
  return {
    value: p.value != null ? String(p.value) : '', unit: p.unit === 'f' ? 'f' : p.unit === 'c' ? 'c' : fallback,
    method: e.subtype ?? null, when: new Date(e.started_at), note: e.note ?? '',
  };
}

export function validateTemp(d: TempDraft): string | null {
  const v = parseAmount(d.value);
  if (v === null) return 'Enter the temperature you measured.';
  const [lo, hi] = TEMP_RANGE[d.unit];
  if (v < lo || v > hi) return `That doesn’t look like a body temperature in ${tempLabel(d.unit)}. Please check the number and the unit.`;
  if (d.when.getTime() > Date.now() + 60000) return 'The time can’t be in the future.';
  return null;
}

/** Keeps the typed value + unit; adds a normalised °C value for reports. */
export function tempToFields(d: TempDraft): EventFields {
  const v = parseAmount(d.value)!;
  return {
    subtype: d.method, started_at: d.when.toISOString(), ended_at: null,
    payload: { value: normAmount(d.value), unit: d.unit, value_c: round1(toC(v, d.unit)) },
    note: d.note,
  };
}

export function TemperatureFields({ draft, onChange }: { draft: TempDraft; onChange: (p: Partial<TempDraft>) => void }) {
  return (
    <>
      <SectionLabel>Temperature</SectionLabel>
      <Segmented<TempUnit> label="Unit" value={draft.unit} onChange={(unit) => onChange({ unit })} options={[{ value: 'c', label: '°C' }, { value: 'f', label: '°F' }]} />
      <View style={{ height: 16 }} />
      <TextField label="Reading" suffix={tempLabel(draft.unit)} keyboardType="decimal-pad" value={draft.value} onChangeText={(value) => onChange({ value })} placeholder={draft.unit === 'c' ? '36.8' : '98.2'} maxLength={6} />
      <SectionLabel>How was it taken? (optional)</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {Object.entries(TEMP_METHOD_LABEL).map(([k, label]) => (
          <Chip key={k} label={label} selected={draft.method === k} onPress={() => onChange({ method: draft.method === k ? null : k })} />
        ))}
      </View>
      <DateTimeField label="When" value={draft.when} onChange={(when) => onChange({ when })} maximumDate={new Date()} />
      <TextField label="Note (optional)" value={draft.note} onChangeText={(note) => onChange({ note })} multiline maxLength={500} placeholder="e.g. after waking up" />
      <Body muted style={{ marginBottom: 16 }}>Mimo records what you measure. It doesn’t interpret readings or give medical advice.</Body>
    </>
  );
}
