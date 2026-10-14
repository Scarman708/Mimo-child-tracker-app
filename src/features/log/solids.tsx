import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, SectionLabel, TextField } from '@/components/ui';
import { Chip } from '@/components/Chip';
import { DateTimeField } from '@/components/DateTimeField';
import { EventFields, EventRow, FOOD_GROUP_LABEL, FOOD_UNIT_LABEL } from '@/lib/eventText';
import { normAmount, parseAmount } from '@/lib/volume';
import { useRecentFoods } from '@/features/log/useRecentFoods';
import { useColors, font, radius } from '@/theme';

export type FoodGroup = 'fruit' | 'vegetable' | 'grain' | 'protein' | 'dairy' | 'other';
export type FoodUnit = 'tsp' | 'tbsp' | 'cup' | 'g' | 'ml' | 'pieces';

const GROUPS: { value: FoodGroup; emoji: string }[] = [
  { value: 'fruit', emoji: '🍎' }, { value: 'vegetable', emoji: '🥕' }, { value: 'grain', emoji: '🌾' },
  { value: 'protein', emoji: '🍗' }, { value: 'dairy', emoji: '🧀' }, { value: 'other', emoji: '🥣' },
];
const UNITS: FoodUnit[] = ['tsp', 'tbsp', 'cup', 'g', 'ml', 'pieces'];

export interface SolidsDraft {
  group: FoodGroup | null;
  foods: string[];
  foodInput: string;
  amount: string;
  unit: FoodUnit;
  when: Date;
  note: string;
}
export const emptySolids = (): SolidsDraft => ({ group: null, foods: [], foodInput: '', amount: '', unit: 'tbsp', when: new Date(), note: '' });

export function solidsFromEvent(e: EventRow): SolidsDraft {
  const p = (e.payload ?? {}) as any;
  return {
    group: (e.subtype as FoodGroup) ?? null,
    foods: Array.isArray(p.foods) ? p.foods.filter((f: unknown) => typeof f === 'string') : [],
    foodInput: '',
    amount: p.amount?.value != null ? String(p.amount.value) : '',
    unit: (UNITS as string[]).includes(p.amount?.unit) ? p.amount.unit : 'tbsp',
    when: new Date(e.started_at),
    note: e.note ?? '',
  };
}

const clean = (s: string) => s.trim().replace(/\s+/g, ' ').slice(0, 40);

/** Foods already added plus anything typed but not yet added ("banana, oats" -> two foods). */
export function allFoods(d: SolidsDraft): string[] {
  const out: string[] = [];
  const add = (s: string) => {
    const f = clean(s);
    if (f && !out.some((x) => x.toLowerCase() === f.toLowerCase())) out.push(f);
  };
  d.foods.forEach(add);
  d.foodInput.split(',').forEach(add);
  return out.slice(0, 12);
}

export function validateSolids(d: SolidsDraft): string | null {
  if (!d.group) return 'Choose a food group.';
  if (d.amount.trim()) {
    const a = parseAmount(d.amount);
    if (a === null || a <= 0) return 'Amount should be a number greater than 0, or leave it blank.';
    if (a > 5000) return 'That amount looks too large. Please check it.';
  }
  if (d.when.getTime() > Date.now() + 60000) return 'The time can’t be in the future.';
  return null;
}

export function solidsToFields(d: SolidsDraft): EventFields {
  return {
    subtype: d.group,
    started_at: d.when.toISOString(),
    ended_at: null,
    payload: {
      foods: allFoods(d),
      amount: d.amount.trim() ? { value: normAmount(d.amount), unit: d.unit } : null,
    },
    note: d.note,
  };
}

export function SolidsFields({ draft, onChange, childId }: { draft: SolidsDraft; onChange: (p: Partial<SolidsDraft>) => void; childId: string }) {
  const c = useColors();
  const { data: recent } = useRecentFoods(childId);
  const current = allFoods(draft);
  const suggestions = (recent ?? []).filter((r) => !current.some((f) => f.toLowerCase() === r.toLowerCase())).slice(0, 8);

  const addTyped = () => onChange({ foods: allFoods(draft), foodInput: '' });
  const addFood = (f: string) => onChange({ foods: allFoods({ ...draft, foods: [...draft.foods, f], foodInput: '' }) });
  const removeFood = (f: string) => onChange({ foods: draft.foods.filter((x) => x !== f) });

  return (
    <>
      <SectionLabel>Food group</SectionLabel>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {GROUPS.map((g) => {
          const on = draft.group === g.value;
          const label = FOOD_GROUP_LABEL[g.value];
          return (
            <Pressable key={g.value} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected: on }} onPress={() => onChange({ group: g.value })}
              style={{ width: '30%', flexGrow: 1, minHeight: 84, borderRadius: radius.lg, borderWidth: 2, borderColor: on ? c.primary : c.border, backgroundColor: on ? c.sky : c.card, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 26 }}>{g.emoji}</Text>
              <Text style={{ fontFamily: font.bold, fontSize: 13, color: c.text, textAlign: 'center' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel>Foods (optional)</SectionLabel>
      {draft.foods.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {draft.foods.map((f) => (
            <Chip key={f} selected label={`${f}  ✕`} accessibilityLabel={`Remove ${f}`} onPress={() => removeFood(f)} />
          ))}
        </View>
      ) : null}
      <TextField label="Food name" value={draft.foodInput} onChangeText={(foodInput) => onChange({ foodInput })} placeholder="e.g. mashed banana, oat porridge" maxLength={80}
        returnKeyType="done" onSubmitEditing={addTyped} containerStyle={{ marginBottom: 8 }} />
      {draft.foodInput.trim() ? <View style={{ marginBottom: 12 }}><Button label="Add food" variant="secondary" onPress={addTyped} /></View> : null}
      {suggestions.length ? (
        <>
          <Text style={{ fontFamily: font.semibold, fontSize: 14, color: c.textMuted, marginBottom: 8 }}>Recently used</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {suggestions.map((f) => <Chip key={f} label={f} accessibilityLabel={`Add ${f}`} onPress={() => addFood(f)} />)}
          </View>
        </>
      ) : null}

      <SectionLabel>Amount (optional)</SectionLabel>
      <TextField label="How much" keyboardType="decimal-pad" value={draft.amount} onChangeText={(amount) => onChange({ amount })} placeholder="Leave blank if unknown" maxLength={7} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {UNITS.map((u) => <Chip key={u} label={FOOD_UNIT_LABEL[u]} selected={draft.unit === u} onPress={() => onChange({ unit: u })} />)}
      </View>

      <DateTimeField label="When" value={draft.when} onChange={(when) => onChange({ when })} maximumDate={new Date()} />
      <TextField label="Note (optional)" value={draft.note} onChangeText={(note) => onChange({ note })} multiline maxLength={500} placeholder="e.g. first time trying it" />
    </>
  );
}
