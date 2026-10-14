import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Screen, Body } from '@/components/ui';
import { useSession } from '@/store/session';
import { BreastfeedingScreen } from '@/features/log/BreastfeedingScreen';
import { SleepScreen } from '@/features/log/SleepScreen';
import { DiaperScreen } from '@/features/log/DiaperScreen';
import { FeedChooser } from '@/features/log/FeedChooser';

const TITLES: Record<string, string> = { breastfeeding: 'Breastfeeding', sleep: 'Sleep', diaper: 'Diaper', feed: 'Feed' };

/** Dispatcher: one route, one form per category. Categories not built yet show a placeholder. */
export default function LogRoute() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const hasChild = useSession((s) => !!s.selectedChildId);
  const title = TITLES[type] ?? String(type).replace(/_/g, ' ').replace(/^./, (m) => m.toUpperCase());
  let body: React.ReactNode;
  if (!hasChild) body = <Screen headerShown><Body muted>Choose a baby first.</Body></Screen>;
  else if (type === 'breastfeeding') body = <BreastfeedingScreen />;
  else if (type === 'sleep') body = <SleepScreen />;
  else if (type === 'diaper') body = <DiaperScreen />;
  else if (type === 'feed') body = <FeedChooser />;
  else body = <Screen headerShown><Body muted>This log form is coming in an upcoming step.</Body></Screen>;
  return <><Stack.Screen options={{ title }} />{body}</>;
}
