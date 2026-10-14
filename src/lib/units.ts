import type { UnitSystem } from '@/types';

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export interface Measurement {
  measure_type: 'weight' | 'length' | 'head';
  value_metric: number;          // kg or cm
  original_value: string;        // exactly as typed
  original_unit: string;         // kg | lb_oz | cm | in
}

export const parseNum = (s: string) => parseFloat(s.trim().replace(',', '.'));
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

export interface BirthFields { w1: string; w2: string; len: string; head: string }

/** Validates optional birth measurements and converts them to normalized metric units. */
export function buildBirthMeasurements(unit: UnitSystem, f: BirthFields) {
  const errors: { weight?: string; length?: string; head?: string } = {};
  const out: Measurement[] = [];
  const metric = unit === 'metric';

  // Weight
  if (f.w1.trim() || f.w2.trim()) {
    if (metric) {
      const kg = parseNum(f.w1);
      if (!(kg >= 0.3 && kg <= 8)) errors.weight = 'Enter a weight between 0.3 and 8 kg.';
      else out.push({ measure_type: 'weight', value_metric: round(kg, 3), original_value: f.w1.trim(), original_unit: 'kg' });
    } else {
      const lb = f.w1.trim() ? parseNum(f.w1) : 0;
      const oz = f.w2.trim() ? parseNum(f.w2) : 0;
      const kg = (lb + oz / 16) * KG_PER_LB;
      if (Number.isNaN(lb) || Number.isNaN(oz) || lb < 0 || oz < 0 || oz >= 16 || !(kg >= 0.3 && kg <= 8))
        errors.weight = 'Enter pounds (up to 17) and ounces (0 to 15.9).';
      else out.push({ measure_type: 'weight', value_metric: round(kg, 3), original_value: `${lb} lb ${oz} oz`, original_unit: 'lb_oz' });
    }
  }
  // Length and head circumference
  const lin = (raw: string, min: number, max: number, key: 'length' | 'head', type: 'length' | 'head') => {
    if (!raw.trim()) return;
    const v = parseNum(raw);
    const cm = metric ? v : v * CM_PER_IN;
    if (!(cm >= min && cm <= max))
      errors[key] = metric ? `Enter a value between ${min} and ${max} cm.` : `Enter a value between ${round(min / CM_PER_IN, 1)} and ${round(max / CM_PER_IN, 1)} in.`;
    else out.push({ measure_type: type, value_metric: round(cm, 2), original_value: raw.trim(), original_unit: metric ? 'cm' : 'in' });
  };
  lin(f.len, 20, 70, 'length', 'length');
  lin(f.head, 20, 50, 'head', 'head');
  return { measurements: out, errors, ok: Object.keys(errors).length === 0 };
}

export function formatWeight(kg: number, unit: UnitSystem): string {
  if (unit === 'metric') return `${round(kg, 2)} kg`;
  const totalOz = round(kg / KG_PER_LB * 16, 1);
  const lb = Math.floor(totalOz / 16);
  return `${lb} lb ${round(totalOz - lb * 16, 1)} oz`;
}
export function formatLength(cm: number, unit: UnitSystem): string {
  return unit === 'metric' ? `${round(cm, 1)} cm` : `${round(cm / CM_PER_IN, 1)} in`;
}
