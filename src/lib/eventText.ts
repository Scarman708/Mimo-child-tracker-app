import { formatDuration } from '@/lib/timer';

export interface EventRow {
  id: string; category: string; subtype: string | null;
  started_at: string; ended_at: string | null; payload: any; note: string | null;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

/** One-line human description of an event, used by Today and (later) History. Never invents values. */
export function describeEvent(e: EventRow): string {
  const p = e.payload ?? {};
  switch (e.category) {
    case 'breastfeeding':
      return typeof p.total_ms === 'number' ? `Breastfeeding · ${formatDuration(p.total_ms)}` : 'Breastfeeding';
    case 'sleep': {
      const label = e.subtype === 'night' ? 'Night sleep' : e.subtype === 'nap' ? 'Nap' : 'Sleep';
      return typeof p.duration_ms === 'number' ? `${label} · ${formatDuration(p.duration_ms)}` : label;
    }
    case 'diaper':
      return e.subtype ? `Diaper · ${cap(e.subtype)}` : 'Diaper';
    default:
      return e.subtype ? `${cap(e.category)} · ${cap(e.subtype)}` : cap(e.category);
  }
}
