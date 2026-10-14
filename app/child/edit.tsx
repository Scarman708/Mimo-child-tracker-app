import React from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { toDateOnly } from '@/lib/age';
import { uploadChildPhoto } from '@/lib/media';
import { ChildForm, ChildFormValues } from '@/components/ChildForm';
import { Screen, Body } from '@/components/ui';
import { useSession } from '@/store/session';

export default function EditChild() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { children, updateChild, loadChildren } = useSession();
  const child = children.find((k) => k.id === id);
  if (!child) return <Screen headerShown><Body>This baby is no longer available.</Body></Screen>;

  async function submit(v: ChildFormValues) {
    const err = await updateChild(child!.id, { name: v.name, birth_date: toDateOnly(v.birth), gender: v.gender, unit_system: v.unit });
    if (err) return err;
    if (v.photoUri) {
      if (await uploadChildPhoto(child!.id, v.photoUri)) await loadChildren();
      else Alert.alert('Photo not saved', 'Your changes were saved, but the new photo could not be uploaded.');
    }
    router.back();
  }
  return <Screen headerShown><ChildForm mode="edit" initial={child} submitLabel="Save Changes" onSubmit={submit} /></Screen>;
}
