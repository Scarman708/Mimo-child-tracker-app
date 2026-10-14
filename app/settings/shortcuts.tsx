import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, Body } from '@/components/ui';
import { ShortcutPicker } from '@/components/ShortcutPicker';

export default function SettingsShortcuts() {
  const router = useRouter();
  return (
    <Screen headerShown>
      <Body muted style={{ marginBottom: 16 }}>Choose which activities appear on Today and in what order. Everything is still available from Quick Log.</Body>
      <ShortcutPicker label="Save" onDone={() => router.back()} />
    </Screen>
  );
}
