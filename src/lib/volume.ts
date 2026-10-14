export type VolumeUnit = 'ml' | 'oz';
export const ML_PER_OZ = 29.5735;
export const unitLabel = (u: VolumeUnit) => (u === 'ml' ? 'mL' : 'oz');
export const round1 = (n: number) => Math.round(n * 10) / 10;

/** Parses what a person typed ("4", "4.5", "4,5", ".5"). Returns null when blank or invalid. */
export function parseAmount(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Canonical text of a typed amount. Keeps the digits the person typed ("4,50" -> "4.50"). */
export const normAmount = (s: string) => s.trim().replace(',', '.').replace(/\.$/, '');

export const toMl = (v: number, u: VolumeUnit) => (u === 'ml' ? v : v * ML_PER_OZ);
export const fmtAmount = (value: string | number, u: VolumeUnit) => `${value} ${unitLabel(u)}`;

/**
 * Default volume unit for a child. The field name for the child's unit preference isn't known to this
 * file, so a few likely names are checked. If your `children` row uses another name, change it HERE only.
 */
export function volumeUnitFor(child: unknown): VolumeUnit {
  const k = (child ?? {}) as Record<string, unknown>;
  const v = k.unit_system ?? k.units ?? k.unit_preference ?? k.unit_pref;
  return v === 'imperial' ? 'oz' : 'ml';
}
