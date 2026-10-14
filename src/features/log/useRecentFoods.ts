import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/** Food names this baby has eaten before, most recent first (for one-tap re-entry). */
export function useRecentFoods(childId: string | null | undefined) {
  return useQuery({
    queryKey: ['events', 'recent-foods', childId],   // starts with 'events' -> refreshed after every save
    enabled: !!childId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('payload')
        .eq('child_id', childId!).eq('category', 'solids').is('deleted_at', null)
        .order('started_at', { ascending: false }).limit(40);
      if (error) throw error;
      const seen = new Set<string>();
      const out: string[] = [];
      for (const row of data ?? []) {
        const foods: unknown = (row.payload as any)?.foods;
        if (!Array.isArray(foods)) continue;
        for (const f of foods) {
          if (typeof f !== 'string') continue;
          const k = f.toLowerCase();
          if (!seen.has(k)) { seen.add(k); out.push(f); }
        }
      }
      return out.slice(0, 12);
    },
  });
}
