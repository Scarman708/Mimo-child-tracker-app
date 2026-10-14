import { volumeUnitFor } from '@/lib/volume';

export type TempUnit = 'c' | 'f';
/** Default temperature unit follows the child's unit preference (metric -> °C, imperial -> °F). */
export const tempUnitFor = (child: unknown): TempUnit => (volumeUnitFor(child) === 'oz' ? 'f' : 'c');
export const tempLabel = (u: TempUnit | string) => (u === 'f' ? '°F' : '°C');
export const toC = (v: number, u: TempUnit) => (u === 'c' ? v : ((v - 32) * 5) / 9);
/** Plausible human body-temperature entry range – only to catch typos / wrong unit. It does NOT interpret readings. */
export const TEMP_RANGE: Record<TempUnit, [number, number]> = { c: [30, 45], f: [86, 113] };
export const TEMP_METHOD_LABEL: Record<string, string> = {
  forehead: 'Forehead', ear: 'Ear', armpit: 'Armpit', mouth: 'Mouth', rectal: 'Rectal',
};

export const DOSE_UNITS = ['ml', 'mg', 'g', 'drops', 'tablet', 'tsp'] as const;
export type DoseUnit = (typeof DOSE_UNITS)[number];
export const DOSE_UNIT_LABEL: Record<string, string> = { ml: 'mL', mg: 'mg', g: 'g', drops: 'drops', tablet: 'tablet(s)', tsp: 'tsp' };
