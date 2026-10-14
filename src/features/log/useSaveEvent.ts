import { useQueryClient } from '@tanstack/react-query';
import { insertEvent, NewEvent } from '@/lib/events';
import { useSession } from '@/store/session';

/** Saves an event, then refreshes Today / last-event queries. Resolves to an error message or null. */
export function useSaveEvent() {
  const qc = useQueryClient();
  const userId = useSession((s) => s.session?.user.id);
  return async (e: NewEvent): Promise<string | null> => {
    if (!userId) return 'You are signed out. Please sign in again.';
    const err = await insertEvent(e, userId);
    if (!err) {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['last-events'] });
    }
    return err;
  };
}
