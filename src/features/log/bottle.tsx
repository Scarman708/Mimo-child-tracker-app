import React from 'react';
import { View } from 'react-native';
import { Segmented, SectionLabel, TextField } from '@/components/ui';
import { DateTimeField } from '@/components/DateTimeField';
import { EventFields, EventRow, MILK_TYPE_LABEL } from '@/lib/eventText';
import { VolumeUnit, normAmount, parseAmount, round1, toMl, unitLabel } from '@/lib/volume';

export type MilkType = 'formula' | 'expressed' | 'mixed';
export interface BottleDraft {
  milkType: MilkType | null;
  consumed: string;   // exactly as typed
  offered: string;
  unit: VolumeUnit;
  minutes: string;
  when: Date;
  note: string;
}

export const emptyBottle = (unit: VolumeUnit): BottleDraft => ({
  milkType: null, consumed: '', offered: '', unit, minutes: '', when: new Date(), note: '',
});

export function bottleFromEvent(e: EventRow, fallbackUnit: VolumeUnit): BottleDraft {
  const p = (e.payload ?? {}) as any;
  const unit: VolumeUnit = p.consumed?.unit === 'oz' ? 'oz' : p.consumed?.unit === 'ml' ? 'ml' : fallbackUnit;
  return {
    milkType: (e.subtype as MilkType) ?? null,
    consumed: p.consumed?.value != null ? String(p.consumed.value) : '',
    offered: p.offered?.value != null ? String(p.offered.value) : '',
    unit,
    minutes: p.duration_ms ? String(round1(p.duration_ms / 60000)) : '',
    when: new Date(e.started_at),
    note: e.note ?? '',
  };
}

export function validateBottle(d: BottleDraft): string | null {
  if (!d.milkType) return 'Choose what was in the bottle.';
  const cons = parseAmount(d.consumed);
  if (cons === null) return 'Enter how much was consumed (0 if the bottle was refused).';
  if (toMl(cons, d.unit) > 1000) return 'That consumed amount looks too large. Please check it.';
  if (d.offered.trim()) {
    const off = parseAmount(d.offered);
    if (off === null) return 'The amount offered isn’t a valid number.';
    if (toMl(off, d.unit) > 1000) return 'That offered amount looks too large. Please check it.';
    if (off < cons) return 'The amount offered can’t be less than the amount consumed.';
  }
  if (d.minutes.trim()) {
    const m = parseAmount(d.minutes);
    if (m === null || m > 240) return 'Duration should be a number of minutes (up to 240).';
  }
  if (d.when.getTime() > Date.now() + 60000) return 'The time can’t be in the future.';
  return null;
}

/** Call only after validateBottle() returned null. Keeps the typed value + unit; adds a normalised mL value. */
export function bottleToFields(d: BottleDraft): EventFields {
  const cons = parseAmount(d.consumed)!;
  const off = d.offered.trim() ? parseAmount(d.offered) : null;
  const mins = d.minutes.trim() ? parseAmount(d.minutes) : null;
  const start = d.when.getTime();
  return {
    subtype: d.milkType,
    started_at: d.when.toISOString(),
    ended_at: mins ? new Date(start + mins * 60000).toISOString() : null,
    payload: {
      consumed: { value: normAmount(d.consumed), unit: d.unit },
      consumed_ml: round1(toMl(cons, d.unit)),
      offered: off !== null ? { value: normAmount(d.offered), unit: d.unit } : null,
      offered_ml: off !== null ? round1(toMl(off, d.unit)) : null,
      duration_ms: mins ? Math.round(mins * 60000) : null,
    },
    note: d.note,
  };
}

export function BottleFields({ draft, onChange }: { draft: BottleDraft; onChange: (p: Partial<BottleDraft>) => void }) {
  const u = unitLabel(draft.unit);
  return (
    <>
      <SectionLabel>What was in the bottle?</SectionLabel>
      <Segmented<MilkType>
        label="Bottle contents"
        value={draft.milkType}
        onChange={(milkType) => onChange({ milkType })}
        options={(['formula', 'expressed', 'mixed'] as MilkType[]).map((v) => ({ value: v, label: MILK_TYPE_LABEL[v] }))}
      />
      <SectionLabel>Amount</SectionLabel>
      <Segmented<VolumeUnit>
        label="Unit"
        value={draft.unit}
        onChange={(unit) => onChange({ unit })}
        options={[{ value: 'ml', label: 'mL' }, { value: 'oz', label: 'oz' }]}
      />
      <View style={{ height: 16 }} />
      <TextField label="Consumed" suffix={u} keyboardType="decimal-pad" value={draft.consumed} onChangeText={(consumed) => onChange({ consumed })} placeholder="0" maxLength={7} />
      <TextField label="Offered (optional)" suffix={u} keyboardType="decimal-pad" value={draft.offered} onChangeText={(offered) => onChange({ offered })} placeholder="How much was in the bottle" maxLength={7} />
      <DateTimeField label="When" value={draft.when} onChange={(when) => onChange({ when })} maximumDate={new Date()} />
      <TextField label="Duration (optional)" suffix="min" keyboardType="number-pad" value={draft.minutes} onChangeText={(minutes) => onChange({ minutes })} maxLength={3} />
      <TextField label="Note (optional)" value={draft.note} onChangeText={(note) => onChange({ note })} multiline maxLength={500} placeholder="e.g. took it slowly" />
    </>
  );
}
