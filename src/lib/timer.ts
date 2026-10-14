/**
 * Pure timer math. A timer is a list of segments; duration is DERIVED from timestamps,
 * never from a screen counter, so it survives lock, background, process death and restart.
 * Pausing closes the open segment (paused time is excluded); resuming opens a new one.
 */
export interface Seg { start: number; end: number | null } // epoch milliseconds

export const isRunning = (segs: Seg[]) => segs.length > 0 && segs[segs.length - 1].end === null;

/** Sum of active time. Clamped at 0 per segment so a backwards clock change can't create negative time. */
export const durationMs = (segs: Seg[], now: number) =>
  segs.reduce((t, s) => t + Math.max(0, (s.end ?? now) - s.start), 0);

export const pauseSegs = (segs: Seg[], now: number): Seg[] => {
  if (!isRunning(segs)) return segs;
  const last = segs[segs.length - 1];
  return [...segs.slice(0, -1), { start: last.start, end: Math.max(now, last.start) }];
};

export const resumeSegs = (segs: Seg[], now: number): Seg[] =>
  isRunning(segs) ? segs : [...segs, { start: now, end: null }];

export const firstStart = (segs: Seg[]): number | null => (segs.length ? segs[0].start : null);
export const lastEnd = (segs: Seg[], now: number): number | null =>
  segs.length ? (segs[segs.length - 1].end ?? now) : null;
export const lastStart = (segs: Seg[]): number | null => (segs.length ? segs[segs.length - 1].start : null);

/** 83000 -> "01:23", 3725000 -> "1:02:05" */
export function formatClock(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

/** 4500000 -> "1 h 15 min", 19*60000 -> "19 min", 40000 -> "40 s" */
export function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.max(0, Math.floor(ms / 1000))} s`;
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
