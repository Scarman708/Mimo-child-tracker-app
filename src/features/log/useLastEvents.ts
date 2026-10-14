import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EventRow } from '@/lib/eventText';

const COLS = 'id,category,subtype,started_at,ended_at,payload,note';

/** Most recent feed (breast OR bottle) and diaper for a baby, independent of the day being browsed. */
export function useLastEvents(childId: string | null) {
  return useQuery({
    queryKey: ['last-events', childId],
    enabled: !!childId,
    queryFn: async () => {
      const latest = (cats: string[]) =>
        supabase.from('events').select(COLS).eq('child_id', childId!).is('deleted_at', null)
          .in('category', cats).order('started_at', { ascending: false }).limit(1).maybeSingle();
      const [feed, diaper] = await Promise.all([latest(['breastfeeding', 'bottle']), latest(['diaper'])]);
      if (feed.error || diaper.error) throw feed.error ?? diaper.error;
      return { lastFeed: (feed.data as EventRow | null), lastDiaper: (diaper.data as EventRow | null) };
    },
  });
}
