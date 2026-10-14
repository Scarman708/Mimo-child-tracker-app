import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Body, Button, Screen } from '@/components/ui';
import { useSession } from '@/store/session';
import { sessionKey, useTimers } from '@/store/timers';

/** The "Feed" shortcut: pick Breastfeeding or Bottle. Jumps straight back into a running feeding. */
export function FeedChooser() {
  const router = useRouter();
  const childId = useSession((s) => s.selectedChildId)!;
  const hasActive = useTimers((s) => !!s.sessions[sessionKey(childId, 'breastfeeding')]);
  useEffect(() => { if (hasActive) router.replace('/log/breastfeeding'); }, [hasActive]);
  return (
    <Screen headerShown>
      <Body muted style={{ marginBottom: 16 }}>What kind of feed?</Body>
      <Button label="Breastfeeding" onPress={() => router.replace('/log/breastfeeding')} />
      <Body muted style={{ marginVertical: 12, textAlign: 'center' }}>or</Body>
      <Button label="Bottle / Formula" variant="secondary" onPress={() => router.replace('/log/bottle')} />
    </Screen>
  );
}
