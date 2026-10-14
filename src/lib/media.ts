import { supabase } from '@/lib/supabase';

/** Uploads a new versioned avatar, points the child at it, then removes the old file. Returns true on success. */
export async function uploadChildPhoto(childId: string, uri: string): Promise<boolean> {
  try {
    const buf = await (await fetch(uri)).arrayBuffer();
    const path = `${childId}/avatar-${Date.now()}.jpg`; // versioned path = no stale signed-URL cache
    const up = await supabase.storage.from('child-media').upload(path, buf, { contentType: 'image/jpeg' });
    if (up.error) return false;
    const { data: old } = await supabase.from('children').select('photo_path').eq('id', childId).maybeSingle();
    const { error } = await supabase.from('children').update({ photo_path: path }).eq('id', childId);
    if (error) return false;
    if (old?.photo_path) await supabase.storage.from('child-media').remove([old.photo_path]); // best effort
    return true;
  } catch { return false; }
}
