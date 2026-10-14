import { fmtTime } from '@/lib/format';
import { fmtAmount, VolumeUnit } from '@/lib/volume';
import { DOSE_UNIT_LABEL, TEMP_METHOD_LABEL, tempLabel } from '@/lib/health';

export interface EventRow {
  id: string;
  category: string;
  subtype?: string | null;
  started_at: string;
  ended_at?: string | null;
  payload?: any;
  note?: string | null;
  creator_id?: string | null;
}
export type ChildEventRow = EventRow & { child_id: string };
export interface EventDetail extends ChildEventRow {
  creator_id: string | null;
  version: number;
  created_at: string;
  updated_at: string | null;
  local_timezone: string | null;
}
/** The editable part of an event (what an edit form produces). */
export interface EventFields {
  subtype: string | null;
  started_at: string;
  ended_at: string | null;
  payload: Record<string, unknown>;
  note: string;
}

export const MILK_TYPE_LABEL: Record<string, string> = { formula: 'Formula', expressed: 'Expressed milk', mixed: 'Mixed' };
export const FOOD_GROUP_LABEL: Record<string, string> = {
  fruit: 'Fruit', vegetable: 'Vegetable', grain: 'Grains / cereal', protein: 'Protein', dairy: 'Dairy', other: 'Puree / other',
};
export const FOOD_UNIT_LABEL: Record<string, string> = { tsp: 'tsp', tbsp: 'tbsp', cup: 'cup', g: 'g', ml: 'mL', pieces: 'pieces' };

const CATEGORY_META: Record<string, { label: string; icon: string; emoji: string }> = {
  breastfeeding: { label: 'Breastfeeding', icon: 'heart', emoji: '🤱' },
  bottle: { label: 'Bottle', icon: 'flask', emoji: '🍼' },
  solids: { label: 'Solids', icon: 'nutrition', emoji: '🥣' },
  sleep: { label: 'Sleep', icon: 'moon', emoji: '😴' },
  diaper: { label: 'Diaper', icon: 'water', emoji: '💧' },
  medicine: { label: 'Medicine', icon: 'medkit', emoji: '💊' },
  temperature: { label: 'Temperature', icon: 'thermometer', emoji: '🌡️' },
  bath: { label: 'Bath', icon: 'sparkles', emoji: '🛁' },
  tummy_time: { label: 'Tummy time', icon: 'happy', emoji: '🧸' },
};
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, ' ') : s);
export function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? { label: cap(category), icon: 'document-text', emoji: '📝' };
}

export function fmtDur(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

type TF = Parameters<typeof fmtTime>[1];
export function fmtDateTime(iso: string, tf: TF): string {
  const d = new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return `${d} · ${fmtTime(iso, tf)}`;
}

const amountText = (a: any, kind: 'vol' | 'food'): string | null => {
  if (!a || a.value == null || a.value === '') return null;
  if (kind === 'vol') return fmtAmount(a.value, (a.unit === 'oz' ? 'oz' : 'ml') as VolumeUnit);
  return `${a.value} ${FOOD_UNIT_LABEL[a.unit] ?? a.unit ?? ''}`.trim();
};

export const doseText = (d: any): string | null =>
  d && d.value != null && d.value !== '' ? `${d.value} ${DOSE_UNIT_LABEL[d.unit] ?? d.unit ?? ''}`.trim() : null;
export const tempText = (p: any): string | null =>
  p && p.value != null && p.value !== '' ? `${p.value} ${tempLabel(p.unit)}` : null;

/** One-line summary used in Today's recent activity and History rows. */
export function describeEvent(e: EventRow): string {
  const p = (e.payload ?? {}) as any;
  switch (e.category) {
    case 'breastfeeding':
      return p.total_ms > 0 ? `Breastfeeding · ${fmtDur(p.total_ms)}` : 'Breastfeeding';
    case 'sleep': {
      const base = e.subtype === 'night' ? 'Night sleep' : 'Nap';
      return p.duration_ms > 0 ? `${base} · ${fmtDur(p.duration_ms)}` : base;
    }
    case 'diaper':
      return e.subtype ? `Diaper · ${cap(e.subtype)}` : 'Diaper';
    case 'bottle': {
      const parts = ['Bottle'];
      if (e.subtype && MILK_TYPE_LABEL[e.subtype]) parts.push(MILK_TYPE_LABEL[e.subtype]);
      const a = amountText(p.consumed, 'vol');
      if (a) parts.push(a);
      return parts.join(' · ');
    }
    case 'solids': {
      const foods: string[] = Array.isArray(p.foods) ? p.foods : [];
      if (foods.length) return `Solids · ${foods.slice(0, 3).join(', ')}${foods.length > 3 ? ` +${foods.length - 3}` : ''}`;
      return `Solids · ${(e.subtype && FOOD_GROUP_LABEL[e.subtype]) || 'Food'}`;
    }
    case 'medicine':
      return ['Medicine', typeof p.name === 'string' ? p.name : null, doseText(p.dose)].filter(Boolean).join(' · ');
    case 'temperature': {
      const t = tempText(p);
      return t ? `Temperature · ${t}` : 'Temperature';
    }
    case 'bath':
    case 'tummy_time': {
      const label = categoryMeta(e.category).label;
      return p.duration_ms > 0 ? `${label} · ${fmtDur(p.duration_ms)}` : label;
    }
    default: {
      const label = categoryMeta(e.category).label;
      return e.subtype ? `${label} · ${cap(e.subtype)}` : label;
    }
  }
}

/** Label/value pairs for the event detail screen. Only fields that were actually recorded. */
export function eventDetails(e: EventRow): { label: string; value: string }[] {
  const p = (e.payload ?? {}) as any;
  const out: { label: string; value: string }[] = [];
  const add = (label: string, value: string | null | undefined) => { if (value) out.push({ label, value }); };
  switch (e.category) {
    case 'breastfeeding':
      add('Left', p.left_ms != null ? fmtDur(p.left_ms) : null);
      add('Right', p.right_ms != null ? fmtDur(p.right_ms) : null);
      add('Total', p.total_ms != null ? fmtDur(p.total_ms) : null);
      add('Started on', p.first_side ? cap(p.first_side) : null);
      add('Ended on', p.last_side ? cap(p.last_side) : null);
      if (p.manual_edit) add('Timing', 'Edited manually');
      break;
    case 'sleep':
      add('Type', e.subtype === 'night' ? 'Night sleep' : 'Nap');
      add('Duration', p.duration_ms != null ? fmtDur(p.duration_ms) : null);
      break;
    case 'diaper':
      add('Type', e.subtype ? cap(e.subtype) : null);
      break;
    case 'bottle': {
      add('Contents', e.subtype ? MILK_TYPE_LABEL[e.subtype] : null);
      const c = amountText(p.consumed, 'vol');
      add('Consumed', c && p.consumed_ml != null && p.consumed?.unit === 'oz' ? `${c} (${p.consumed_ml} mL)` : c);
      add('Offered', amountText(p.offered, 'vol'));
      add('Duration', p.duration_ms ? fmtDur(p.duration_ms) : null);
      break;
    }
    case 'solids':
      add('Food group', e.subtype ? FOOD_GROUP_LABEL[e.subtype] : null);
      add('Foods', Array.isArray(p.foods) && p.foods.length ? p.foods.join(', ') : null);
      add('Amount', amountText(p.amount, 'food'));
      break;
    case 'temperature': {
      const t = tempText(p);
      add('Temperature', t && p.unit === 'f' && p.value_c != null ? `${t} (${p.value_c} °C)` : t);
      add('Method', e.subtype ? TEMP_METHOD_LABEL[e.subtype] : null);
      break;
    }
    case 'medicine':
      add('Medicine', typeof p.name === 'string' ? p.name : null);
      add('Dose', doseText(p.dose));
      add('Reason', typeof p.reason === 'string' ? p.reason : null);
      break;
    case 'bath':
    case 'tummy_time':
      add('Duration', p.duration_ms ? fmtDur(p.duration_ms) : null);
      break;
  }
  return out;
}
