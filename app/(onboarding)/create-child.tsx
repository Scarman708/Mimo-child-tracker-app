import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { toDateOnly } from '@/lib/age';
import { uploadChildPhoto } from '@/lib/media';
import { ChildForm, ChildFormValues } from '@/components/ChildForm';
import { Screen, Title, Body } from '@/components/ui';
import { useSession } from '@/store/session';

export default function CreateChild() {
  const router = useRouter();
  const { loadChildren, setOnboardingPending } = useSession();

  async function submit(v: ChildFormValues) {
    const { data: childId, error } = await supabase.rpc('create_child', {
      p_name: v.name, p_birth_date: toDateOnly(v.birth), p_unit: v.unit,
      p_gender: v.gender, p_measurements: v.measurements,
    });
    if (error || !childId) return 'Could not save. Check your connection and try again — what you entered is kept.';
    // Keep the route guard from skipping the Shortcuts step once the child exists.
    setOnboardingPending(true);
    if (v.photoUri && !(await uploadChildPhoto(childId as string, v.photoUri)))
      Alert.alert('Photo not saved', 'Your baby’s profile was saved, but the photo could not be uploaded. You can add it later from Edit profile.');
    await loadChildren();
    router.replace('/(onboarding)/shortcuts');
  }

  return (
    <Screen>
      <Title>Meet your little one</Title>
      <Body muted style={{ marginBottom: 20 }}>We’ll use this to personalise logs and growth.</Body>
      <ChildForm mode="create" submitLabel="Save and Continue" onSubmit={submit} />
    </Screen>
  );
}
