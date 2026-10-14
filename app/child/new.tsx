import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { toDateOnly } from '@/lib/age';
import { uploadChildPhoto } from '@/lib/media';
import { ChildForm, ChildFormValues } from '@/components/ChildForm';
import { Screen } from '@/components/ui';
import { useSession } from '@/store/session';

/** Add another baby (after onboarding). */
export default function NewChild() {
  const router = useRouter();
  const { loadChildren, selectChild } = useSession();
  async function submit(v: ChildFormValues) {
    const { data: childId, error } = await supabase.rpc('create_child', {
      p_name: v.name, p_birth_date: toDateOnly(v.birth), p_unit: v.unit, p_gender: v.gender, p_measurements: v.measurements,
    });
    if (error || !childId) return 'Could not save. Check your connection and try again.';
    if (v.photoUri && !(await uploadChildPhoto(childId as string, v.photoUri)))
      Alert.alert('Photo not saved', 'The profile was saved, but the photo could not be uploaded. Add it later from Edit profile.');
    await loadChildren();
    await selectChild(childId as string);
    router.back();
  }
  return <Screen headerShown><ChildForm mode="create" submitLabel="Add Baby" onSubmit={submit} /></Screen>;
}
