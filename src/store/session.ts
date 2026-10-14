import { Appearance } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Child, ShortcutKey, DEFAULT_SHORTCUTS } from '@/types';
import type { TimeFormat } from '@/lib/format';

export type ThemePref = 'system' | 'light' | 'dark';
export interface Prefs { timeFormat: TimeFormat; theme: ThemePref }
const CHILD_COLS = 'id,name,birth_date,photo_path,unit_system,gender';

interface State {
  ready: boolean;
  session: Session | null;
  children: Child[];
  roles: Record<string, string>;            // childId -> admin | caregiver | viewer
  selectedChildId: string | null;
  shortcuts: ShortcutKey[];
  prefs: Prefs;
  /** True between creating the first baby and finishing the Shortcuts step (stops the route guard skipping it). */
  onboardingPending: boolean;
  init: () => Promise<void>;
  loadChildren: () => Promise<void>;
  selectChild: (id: string) => Promise<void>;
  saveShortcuts: (items: ShortcutKey[]) => Promise<void>;
  setPrefs: (p: Partial<Prefs>) => Promise<void>;
  setOnboardingPending: (v: boolean) => void;
  updateChild: (id: string, patch: Partial<Omit<Child, 'id'>>) => Promise<string | null>;
  deleteChild: (id: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const lastChildKey = (uid: string) => `mimo.lastChild.${uid}`;
const applyTheme = (t: ThemePref) => Appearance.setColorScheme(t === 'system' ? null : t);

export const useSession = create<State>((set, get) => ({
  ready: false,
  session: null,
  children: [],
  roles: {},
  selectedChildId: null,
  shortcuts: DEFAULT_SHORTCUTS,
  prefs: { timeFormat: '12h', theme: 'system' },
  onboardingPending: false,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session });
    if (data.session) await get().loadChildren();
    set({ ready: true });
    supabase.auth.onAuthStateChange(async (_e, session) => {
      set({ session });
      if (session) await get().loadChildren();
      else { set({ children: [], roles: {}, selectedChildId: null, onboardingPending: false }); applyTheme('system'); }
    });
  },

  // RLS guarantees we only receive children the user has an active membership for.
  loadChildren: async () => {
    const uid = get().session?.user.id;
    if (!uid) return;

    const { data: prof } = await supabase.from('profiles').select('theme,time_format').eq('id', uid).maybeSingle();
    if (prof) {
      const prefs: Prefs = { theme: (prof.theme as ThemePref) ?? 'system', timeFormat: (prof.time_format as TimeFormat) ?? '12h' };
      set({ prefs }); applyTheme(prefs.theme);
    }

    const { data, error } = await supabase.from('children').select(CHILD_COLS).is('deleted_at', null).order('created_at');
    if (error) return;
    const kids = (data ?? []) as Child[];

    const { data: mem } = await supabase.from('memberships').select('child_id,role').eq('account_id', uid).is('revoked_at', null);
    const roles: Record<string, string> = {};
    (mem ?? []).forEach((m: any) => { roles[m.child_id] = m.role; });

    const saved = await AsyncStorage.getItem(lastChildKey(uid));
    const current = get().selectedChildId;
    const selected = kids.find((k) => k.id === current)?.id ?? kids.find((k) => k.id === saved)?.id ?? kids[0]?.id ?? null;
    set({ children: kids, roles, selectedChildId: selected });
    if (selected) await loadShortcuts(selected);
  },

  selectChild: async (id) => {
    const uid = get().session?.user.id;
    set({ selectedChildId: id });
    if (uid) await AsyncStorage.setItem(lastChildKey(uid), id); // persist per account/device
    await loadShortcuts(id);
  },

  saveShortcuts: async (items) => {
    const { session, selectedChildId } = get();
    if (!session || !selectedChildId) return;
    set({ shortcuts: items });
    await supabase.from('shortcuts').upsert(
      { account_id: session.user.id, child_id: selectedChildId, items },
      { onConflict: 'account_id,child_id' }
    );
  },

  setPrefs: async (p) => {
    const uid = get().session?.user.id;
    const prefs = { ...get().prefs, ...p };
    set({ prefs });
    if (p.theme) applyTheme(p.theme);
    if (uid) await supabase.from('profiles').update({ theme: prefs.theme, time_format: prefs.timeFormat }).eq('id', uid);
  },

  setOnboardingPending: (v) => set({ onboardingPending: v }),

  updateChild: async (id, patch) => {
    const { error } = await supabase.from('children').update(patch).eq('id', id);
    if (error) return 'Could not save changes. Check your connection and try again.';
    await get().loadChildren();
    return null;
  },

  deleteChild: async (id) => {
    const child = get().children.find((k) => k.id === id);
    if (child?.photo_path) await supabase.storage.from('child-media').remove([child.photo_path]); // best effort
    const { error } = await supabase.rpc('delete_child', { cid: id });
    if (error) return error.message.includes('admin') ? 'Only an admin can delete this baby.' : 'Could not delete. Please try again.';
    await get().loadChildren();
    return null;
  },

  deleteAccount: async () => {
    const { error } = await supabase.rpc('delete_account');
    if (error) return 'Could not delete your account. Please try again.';
    await supabase.auth.signOut({ scope: 'local' });
    return null;
  },

  signOut: async () => { await supabase.auth.signOut(); },
}));

async function loadShortcuts(childId: string) {
  const { data } = await supabase.from('shortcuts').select('items').eq('child_id', childId).maybeSingle();
  useSession.setState({ shortcuts: (data?.items as ShortcutKey[]) ?? DEFAULT_SHORTCUTS });
}
