import { EventRow, FOOD_UNIT_LABEL, MILK_TYPE_LABEL, categoryMeta, fmtDur } from '@/lib/eventText';
import { fmtAmount } from '@/lib/volume';

const DIAPER_EMOJI: Record<string, string> = { wet: '💧', dirty: '💩', mixed: '💧💩', dry: '☁️' };
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, ' ') : s);

/** Icon + short title + key detail for an event (used by Today's cards and rows). Only recorded values, never invented. */
export function briefEvent(e: EventRow): { emoji: string; title: string; detail: string | null } {
  const p = (e.payload ?? {}) as any;
  const meta = categoryMeta(e.category);
  switch (e.category) {
    case 'breastfeeding':
      return { emoji: meta.emoji, title: 'Breastfeeding', detail: typeof p.total_ms === 'number' && p.total_ms > 0 ? fmtDur(p.total_ms) : null };
    case 'bottle': {
      const amount = p.consumed?.value != null && p.consumed.value !== '' ? fmtAmount(p.consumed.value, p.consumed.unit === 'oz' ? 'oz' : 'ml') : null;
      const type = e.subtype ? MILK_TYPE_LABEL[e.subtype] : null;
      return { emoji: meta.emoji, title: 'Bottle', detail: [amount, type].filter(Boolean).join(' · ') || null };
    }
    case 'diaper':
      return { emoji: (e.subtype && DIAPER_EMOJI[e.subtype]) || meta.emoji, title: 'Diaper', detail: e.subtype ? cap(e.subtype) : null };
    case 'solids': {
      const foods: string[] = Array.isArray(p.foods) ? p.foods : [];
      const names = foods.length ? `${foods.slice(0, 3).join(', ')}${foods.length > 3 ? ` +${foods.length - 3}` : ''}` : null;
      const amount = p.amount?.value ? `${p.amount.value} ${FOOD_UNIT_LABEL[p.amount.unit] ?? p.amount.unit ?? ''}`.trim() : null;
      return { emoji: meta.emoji, title: 'Solids', detail: [names, amount].filter(Boolean).join(' · ') || null };
    }
    default:
      return { emoji: meta.emoji, title: meta.label, detail: e.subtype ? cap(e.subtype) : null };
  }
}