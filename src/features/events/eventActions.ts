import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { ChildEventRow, EventFields, describeEvent } from '@/lib/eventText';
import { useSaveEvent } from '@/features/log/useSaveEvent';

const friendly = (error: { code?: string; message: string }): string => {
  if (error.code === '42501') return 'You have view-only access to this baby, so you can’t change entries.';
  if (/fetch|network/i.test(error.message)) return 'You’re offline. Nothing was changed — try again when you’re connected.';
  return 'Could not save. Please try again.';
};

/** Breastfeeding timing and sleep can't be meaningfully copied to "now". */
export const canDuplicate = (e: { category: string }) => e.category !== 'breastfeeding' && e.category !== 'sleep';

export function useEventActions() {
  const qc = useQueryClient();
  const saveNew = useSaveEvent();
  const refresh = () => ['events', 'last-events', 'event'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  return {
    /** Soft delete: the row stays (tombstone) so it stays deleted after sync. Resolves to an error message or null. */
    async remove(id: string): Promise<string | null> {
      const { error, count } = await supabase.from('events')
        .update({ deleted_at: new Date().toISOString() }, { count: 'exact' }).eq('id', id);
      if (error) return friendly(error);
      if (count === 0) return 'Could not delete this entry. You may have view-only access.';
      refresh();
      return null;
    },

    /** Edit with optimistic concurrency: only applies if nobody else changed the entry since it was opened. */
    async update(id: string, baseVersion: number, f: EventFields): Promise<string | null> {
      const { error, count } = await supabase.from('events')
        .update({ subtype: f.subtype, started_at: f.started_at, ended_at: f.ended_at, payload: f.payload, note: f.note.trim() ? f.note.trim() : null }, { count: 'exact' })
        .eq('id', id).eq('version', baseVersion);
      if (error) return friendly(error);
      if (count === 0) {
        const { data } = await supabase.from('events').select('version').eq('id', id).maybeSingle();
        refresh();
        if (data && data.version !== baseVersion) {
          return 'This entry was changed (or deleted) on another device while you were editing. Your edits were not saved — go back and reopen the entry to see the latest version.';
        }
        return 'Could not save changes. You may have view-only access.';
      }
      refresh();
      return null;
    },

    /** Copies an entry as a new one at the current time (keeps its duration, if any). */
    async duplicate(e: ChildEventRow): Promise<string | null> {
      const now = Date.now();
      const span = e.ended_at ? new Date(e.ended_at).getTime() - new Date(e.started_at).getTime() : null;
      return saveNew({
        id: randomUUID(), child_id: e.child_id, category: e.category, subtype: e.subtype ?? null,
        started_at: new Date(now).toISOString(),
        ended_at: span && span > 0 ? new Date(now + span).toISOString() : null,
        payload: (e.payload ?? {}) as Record<string, unknown>, note: e.note ?? null,
      });
    },
  };
}

export function confirmDelete(e: ChildEventRow, remove: (id: string) => Promise<string | null>, onDeleted?: () => void) {
  Alert.alert('Delete this entry?', `“${describeEvent(e)}” will be removed from History and Reports.`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete', style: 'destructive',
      onPress: async () => {
        const err = await remove(e.id);
        if (err) Alert.alert('Couldn’t delete', err);
        else onDeleted?.();
      },
    },
  ]);
}
