import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EventRow } from '@/lib/eventText';

const COLS = 'id,category,subtype,started_at,ended_at,payload,note';

/**
 * Most recent feed (breast OR bottle), solids meal and diaper for a baby, independent of the day being browsed.
 * Solids are deliberately NOT part of "lastFeed": milk feeds and food stay distinct (feeding reminders use lastFeed).
 */
export function useLastEvents(childId: string | null) {
  return useQuery({
    queryKey: ['last-events', childId],
    enabled: !!childId,
    queryFn: async () => {
      const latest = (cats: string[]) =>
        supabase.from('events').select(COLS).eq('child_id', childId!).is('deleted_at', null)
          .in('category', cats).order('started_at', { ascending: false }).limit(1).maybeSingle();
      const [feed, solids, diaper] = await Promise.all([latest(['breastfeeding', 'bottle']), latest(['solids']), latest(['diaper'])]);
      const err = feed.error ?? solids.error ?? diaper.error;
      if (err) throw err;
      return {
        lastFeed: feed.data as EventRow | null,
        lastSolids: solids.data as EventRow | null,
        lastDiaper: diaper.data as EventRow | null,
      };
    },
  });
}
