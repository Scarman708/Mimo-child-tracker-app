import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, Title, Body } from '@/components/ui';
import { ShortcutPicker } from '@/components/ShortcutPicker';
import { useSession } from '@/store/session';

export default function ChooseShortcuts() {
  const router = useRouter();
  const setOnboardingPending = useSession((s) => s.setOnboardingPending);
  return (
    <Screen>
      <Title>Choose your shortcuts</Title>
      <Body muted style={{ marginBottom: 20 }}>Tap what you log most — the order you tap is the order on Today. Everything else stays in Quick Log, and you can change this later in Settings.</Body>
      <ShortcutPicker onDone={() => { setOnboardingPending(false); router.replace('/(tabs)/today'); }} />
    </Screen>
  );
}
