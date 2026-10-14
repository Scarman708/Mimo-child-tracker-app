import { supabase } from '@/lib/supabase';

export interface NewEvent {
  id: string;                      // client-generated UUID = idempotency key
  child_id: string;
  category: string;
  subtype?: string | null;
  started_at: string;              // ISO
  ended_at?: string | null;
  payload?: Record<string, unknown>;
  note?: string | null;
}

/** Inserts an event. Returns an error message for the UI, or null on success.
 *  A duplicate-key error means this exact event was already saved (retry) -> treated as success. */
export async function insertEvent(e: NewEvent, creatorId: string): Promise<string | null> {
  const { error } = await supabase.from('events').insert({
    ...e,
    note: e.note?.trim() ? e.note.trim() : null,
    payload: e.payload ?? {},
    creator_id: creatorId,
    local_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  if (!error || error.code === '23505') return null;
  if (error.code === '42501') return 'You have view-only access to this baby, so you can’t add logs.';
  if (/fetch|network/i.test(error.message)) return 'You’re offline. Nothing was lost — try again when you’re connected.';
  return 'Could not save. Please try again.';
}
