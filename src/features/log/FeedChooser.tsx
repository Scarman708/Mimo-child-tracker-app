import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Screen } from '@/components/ui';
import { useSession } from '@/store/session';
import { sessionKey, useTimers } from '@/store/timers';

/** The "Feed" shortcut: Breastfeeding, Bottle / Formula, or Solids / other food. Resumes a running breastfeed. */
export function FeedChooser() {
  const router = useRouter();
  const childId = useSession((s) => s.selectedChildId)!;
  const hasActive = useTimers((s) => !!s.sessions[sessionKey(childId, 'breastfeeding')]);
  useEffect(() => { if (hasActive) router.replace('/log/breastfeeding'); }, [hasActive]);
  return (
    <Screen headerShown>
      <Body muted style={{ marginBottom: 16 }}>What kind of feed?</Body>
      <View style={{ gap: 12 }}>
        <Button label="Breastfeeding" onPress={() => router.replace('/log/breastfeeding')} />
        <Button label="Bottle / Formula" variant="secondary" onPress={() => router.replace('/log/bottle')} />
        <Button label="Solids / other food" variant="secondary" onPress={() => router.replace('/log/solids')} />
      </View>
      <Body muted style={{ marginTop: 16 }}>Solids covers purees, cereals and any food other than milk.</Body>
    </Screen>
  );
}
