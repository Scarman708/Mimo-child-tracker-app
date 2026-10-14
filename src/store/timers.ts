import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { Seg, isRunning, pauseSegs, resumeSegs, lastStart } from '@/lib/timer';

export type Side = 'left' | 'right';
export type SessionCategory = 'breastfeeding' | 'sleep';
export type SleepKind = 'nap' | 'night';

export interface ActiveSession {
  id: string;                         // becomes the event id on save (idempotent retries)
  childId: string;
  category: SessionCategory;
  startedAt: number;                  // epoch ms
  subtype?: SleepKind;
  timers: Record<string, Seg[]>;      // sleep: { main }, breastfeeding: { left, right }
  note: string;
}

export const sessionKey = (childId: string, category: SessionCategory) => `${childId}:${category}`;
const STORAGE_KEY = 'mimo.timers.v1';

interface State {
  sessions: Record<string, ActiveSession>;
  hydrate: () => Promise<void>;
  startSleep: (childId: string, subtype: SleepKind) => void;
  setSleepSubtype: (childId: string, subtype: SleepKind) => void;
  setSleepStart: (childId: string, startMs: number) => void;
  toggleSide: (childId: string, side: Side) => void;
  switchSide: (childId: string) => void;
  setNote: (childId: string, category: SessionCategory, note: string) => void;
  /** Pauses every running timer at "now" and PERSISTS that, so retrying a failed save can't add time. */
  finish: (childId: string, category: SessionCategory) => ActiveSession | null;
  discard: (childId: string, category: SessionCategory) => void;
}

export const useTimers = create<State>((set, get) => {
  // Every change is written to disk immediately so a killed process loses nothing.
  const commit = (sessions: Record<string, ActiveSession>) => {
    set({ sessions });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)).catch(() => {});
  };
  const patch = (key: string, fn: (s: ActiveSession) => ActiveSession) => {
    const cur = get().sessions[key];
    if (cur) commit({ ...get().sessions, [key]: fn(cur) });
  };

  return {
    sessions: {},

    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') set((st) => ({ sessions: { ...parsed, ...st.sessions } }));
      } catch { /* corrupted storage: start clean rather than crash */ }
    },

    startSleep: (childId, subtype) => {
      const key = sessionKey(childId, 'sleep');
      if (get().sessions[key]) return; // only one active sleep per baby
      const now = Date.now();
      commit({ ...get().sessions, [key]: { id: randomUUID(), childId, category: 'sleep', startedAt: now, subtype, timers: { main: [{ start: now, end: null }] }, note: '' } });
    },
    setSleepSubtype: (childId, subtype) => patch(sessionKey(childId, 'sleep'), (s) => ({ ...s, subtype })),
    setSleepStart: (childId, startMs) => patch(sessionKey(childId, 'sleep'), (s) => {
      const main = s.timers.main ?? [];
      const first = main[0];
      if (!first) return s;
      return { ...s, startedAt: startMs, timers: { ...s.timers, main: [{ ...first, start: startMs }, ...main.slice(1)] } };
    }),

    toggleSide: (childId, side) => {
      const key = sessionKey(childId, 'breastfeeding');
      const now = Date.now();
      const s: ActiveSession = get().sessions[key] ?? { id: randomUUID(), childId, category: 'breastfeeding', startedAt: now, timers: { left: [], right: [] }, note: '' };
      const other: Side = side === 'left' ? 'right' : 'left';
      const mine = s.timers[side] ?? [];
      const timers = { ...s.timers };
      if (isRunning(mine)) {
        timers[side] = pauseSegs(mine, now);
      } else {
        // Starting one side always pauses the other, so the same minutes are never counted twice.
        timers[other] = pauseSegs(timers[other] ?? [], now);
        timers[side] = resumeSegs(mine, now);
      }
      commit({ ...get().sessions, [key]: { ...s, timers } });
    },

    switchSide: (childId) => {
      const s = get().sessions[sessionKey(childId, 'breastfeeding')];
      if (!s) return;
      const l = s.timers.left ?? [], r = s.timers.right ?? [];
      if (isRunning(l)) return get().toggleSide(childId, 'right');
      if (isRunning(r)) return get().toggleSide(childId, 'left');
      // Nothing running: start the side that was NOT used most recently.
      const next: Side = (lastStart(l) ?? 0) > (lastStart(r) ?? 0) ? 'right' : 'left';
      get().toggleSide(childId, next);
    },

    setNote: (childId, category, note) => patch(sessionKey(childId, category), (s) => ({ ...s, note })),

    finish: (childId, category) => {
      const key = sessionKey(childId, category);
      const s = get().sessions[key];
      if (!s) return null;
      const now = Date.now();
      const timers = Object.fromEntries(Object.entries(s.timers).map(([k, v]) => [k, pauseSegs(v, now)]));
      const closed = { ...s, timers };
      commit({ ...get().sessions, [key]: closed });
      return closed;
    },

    discard: (childId, category) => {
      const { [sessionKey(childId, category)]: _gone, ...rest } = get().sessions;
      commit(rest);
    },
  };
});
