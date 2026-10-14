import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/** Medicine names already logged for this baby, most recent first (for one-tap re-entry). Names only – never doses. */
export function useRecentMedicines(childId: string | null | undefined) {
  return useQuery({
    queryKey: ['events', 'recent-medicines', childId],
    enabled: !!childId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('payload')
        .eq('child_id', childId!).eq('category', 'medicine').is('deleted_at', null)
        .order('started_at', { ascending: false }).limit(40);
      if (error) throw error;
      const seen = new Set<string>();
      const out: string[] = [];
      for (const row of data ?? []) {
        const n = (row.payload as any)?.name;
        if (typeof n !== 'string' || !n.trim()) continue;
        const k = n.trim().toLowerCase();
        if (!seen.has(k)) { seen.add(k); out.push(n.trim()); }
      }
      return out.slice(0, 8);
    },
  });
}
