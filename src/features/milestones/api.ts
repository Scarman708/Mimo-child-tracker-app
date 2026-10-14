import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/session';

export interface Milestone {
  id: string; child_id: string; kind: 'milestone' | 'tooth'; title: string; preset_key: string | null;
  occurred_on: string; note: string | null; creator_id: string | null; version: number; updated_at: string;
}
const COLS = 'id,child_id,kind,title,preset_key,occurred_on,note,creator_id,version,updated_at';

export const PRESETS = [
  { key: 'first_smile', label: 'First smile', emoji: '😊' },
  { key: 'rolling_over', label: 'Rolling over', emoji: '🔄' },
  { key: 'sitting', label: 'Sitting', emoji: '🪑' },
  { key: 'crawling', label: 'Crawling', emoji: '🐾' },
  { key: 'first_steps', label: 'First steps', emoji: '👣' },
  { key: 'first_words', label: 'First words', emoji: '💬' },
];
export const presetEmoji = (key: string | null) => PRESETS.find((p) => p.key === key)?.emoji ?? '⭐';

/** Date-only values are stored as 'YYYY-MM-DD' in the baby's local calendar (never via toISOString, which shifts days). */
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fromYmd = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

const friendly = (e: { code?: string; message: string }) =>
  e.code === '42501' ? 'You have view-only access to this baby, so you can’t change milestones.'
  : /fetch|network/i.test(e.message) ? 'You’re offline. Nothing was changed — try again when you’re connected.'
  : 'Could not save. Please try again.';

export function useMilestones(childId: string | null | undefined) {
  return useQuery({
    queryKey: ['milestones', childId], enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase.from('milestones').select(COLS)
        .eq('child_id', childId!).eq('kind', 'milestone').is('deleted_at', null)
        .order('occurred_on', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Milestone[];
    },
  });
}

export function useMilestone(id: string | undefined) {
  return useQuery({
    queryKey: ['milestone', id], enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('milestones').select(`${COLS},deleted_at`).eq('id', id!).maybeSingle();
      if (error) throw error;
      if (!data || (data as any).deleted_at) return null;
      return data as unknown as Milestone;
    },
  });
}

export function useMilestoneActions() {
  const qc = useQueryClient();
  const userId = useSession((s) => s.session?.user.id);
  const refresh = () => ['milestones', 'milestone'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  return {
    async create(m: { id: string; child_id: string; title: string; preset_key: string | null; occurred_on: string; note: string }): Promise<string | null> {
      if (!userId) return 'You are signed out. Please sign in again.';
      const { error } = await supabase.from('milestones').insert({ ...m, note: m.note.trim() ? m.note.trim() : null, creator_id: userId });
      if (error && error.code !== '23505') return friendly(error);
      refresh();
      return null;
    },
    async update(id: string, baseVersion: number, f: { title: string; preset_key: string | null; occurred_on: string; note: string }): Promise<string | null> {
      const { error, count } = await supabase.from('milestones')
        .update({ ...f, note: f.note.trim() ? f.note.trim() : null }, { count: 'exact' }).eq('id', id).eq('version', baseVersion);
      if (error) return friendly(error);
      if (count === 0) {
        refresh();
        return 'This milestone was changed (or deleted) on another device. Your edits were not saved — go back and reopen it to see the latest version.';
      }
      refresh();
      return null;
    },
    async remove(id: string): Promise<string | null> {
      const { error, count } = await supabase.from('milestones').update({ deleted_at: new Date().toISOString() }, { count: 'exact' }).eq('id', id);
      if (error) return friendly(error);
      if (count === 0) return 'Could not delete this milestone. You may have view-only access.';
      refresh();
      return null;
    },
  };
}
