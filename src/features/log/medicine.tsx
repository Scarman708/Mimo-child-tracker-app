import React from 'react';
import { Text, View } from 'react-native';
import { Card, SectionLabel, TextField } from '@/components/ui';
import { Chip } from '@/components/Chip';
import { DateTimeField } from '@/components/DateTimeField';
import { EventFields, EventRow } from '@/lib/eventText';
import { DOSE_UNITS, DOSE_UNIT_LABEL, DoseUnit } from '@/lib/health';
import { normAmount, parseAmount } from '@/lib/volume';
import { useRecentMedicines } from '@/features/log/useRecentMedicines';
import { useColors, font } from '@/theme';

export interface MedicineDraft { name: string; dose: string; unit: DoseUnit; reason: string; when: Date; note: string }

export const emptyMedicine = (): MedicineDraft => ({ name: '', dose: '', unit: 'ml', reason: '', when: new Date(), note: '' });

export function medicineFromEvent(e: EventRow): MedicineDraft {
  const p = (e.payload ?? {}) as any;
  return {
    name: typeof p.name === 'string' ? p.name : '', dose: p.dose?.value != null ? String(p.dose.value) : '',
    unit: (DOSE_UNITS as readonly string[]).includes(p.dose?.unit) ? p.dose.unit : 'ml',
    reason: typeof p.reason === 'string' ? p.reason : '', when: new Date(e.started_at), note: e.note ?? '',
  };
}

export function validateMedicine(d: MedicineDraft): string | null {
  if (!d.name.trim()) return 'Enter the medicine name.';
  if (d.dose.trim()) {
    const v = parseAmount(d.dose);
    if (v === null || v <= 0) return 'The dose should be a number greater than 0, or leave it blank.';
    if (v > 100000) return 'That dose looks too large. Please check it.';
  }
  if (d.when.getTime() > Date.now() + 60000) return 'The time can’t be in the future.';
  return null;
}

/** Stores exactly what the caregiver typed. Mimo never suggests or calculates a dose. */
export function medicineToFields(d: MedicineDraft): EventFields {
  return {
    subtype: null, started_at: d.when.toISOString(), ended_at: null,
    payload: {
      name: d.name.trim().replace(/\s+/g, ' '),
      dose: d.dose.trim() ? { value: normAmount(d.dose), unit: d.unit } : null,
      reason: d.reason.trim() ? d.reason.trim() : null,
    },
    note: d.note,
  };
}

export function MedicineFields({ draft, onChange, childId }: { draft: MedicineDraft; onChange: (p: Partial<MedicineDraft>) => void; childId: string }) {
  const c = useColors();
  const { data: recent } = useRecentMedicines(childId);
  const suggestions = (recent ?? []).filter((r) => r.toLowerCase() !== draft.name.trim().toLowerCase());
  return (
    <>
      <Card tint="peach" style={{ marginBottom: 8 }}>
        <Text style={{ fontFamily: font.regular, fontSize: 14, color: c.text }}>
          Mimo records what you give. It doesn’t suggest, check or calculate doses — follow your doctor’s or pharmacist’s instructions.
        </Text>
      </Card>
      <SectionLabel>Medicine</SectionLabel>
      <TextField label="Name" value={draft.name} onChangeText={(name) => onChange({ name })} maxLength={60} placeholder="e.g. vitamin D drops" containerStyle={{ marginBottom: 8 }} />
      {suggestions.length ? (
        <>
          <Text style={{ fontFamily: font.semibold, fontSize: 14, color: c.textMuted, marginBottom: 8 }}>Recently used</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {suggestions.map((m) => <Chip key={m} label={m} accessibilityLabel={`Use ${m}`} onPress={() => onChange({ name: m })} />)}
          </View>
        </>
      ) : null}
      <SectionLabel>Dose you gave (optional)</SectionLabel>
      <TextField label="Amount" keyboardType="decimal-pad" value={draft.dose} onChangeText={(dose) => onChange({ dose })} placeholder="Leave blank if unknown" maxLength={8} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {DOSE_UNITS.map((u) => <Chip key={u} label={DOSE_UNIT_LABEL[u]} selected={draft.unit === u} onPress={() => onChange({ unit: u })} />)}
      </View>
      <TextField label="Reason (optional)" value={draft.reason} onChangeText={(reason) => onChange({ reason })} maxLength={80} placeholder="e.g. teething, fever" />
      <DateTimeField label="When" value={draft.when} onChange={(when) => onChange({ when })} maximumDate={new Date()} />
      <TextField label="Note (optional)" value={draft.note} onChangeText={(note) => onChange({ note })} multiline maxLength={500} />
    </>
  );
}
