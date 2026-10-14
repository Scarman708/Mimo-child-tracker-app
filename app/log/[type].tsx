import React from 'react';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { Screen, Body } from '@/components/ui';
import { useSession } from '@/store/session';
import { BreastfeedingScreen } from '@/features/log/BreastfeedingScreen';
import { SleepScreen } from '@/features/log/SleepScreen';
import { DiaperScreen } from '@/features/log/DiaperScreen';
import { BottleScreen } from '@/features/log/BottleScreen';
import { SolidsScreen } from '@/features/log/SolidsScreen';
import { FeedChooser } from '@/features/log/FeedChooser';
import { MedicineScreen } from '@/features/log/MedicineScreen';
import { TemperatureScreen } from '@/features/log/TemperatureScreen';
import { CareScreen } from '@/features/log/CareScreen';

const TITLES: Record<string, string> = {
  breastfeeding: 'Breastfeeding', bottle: 'Bottle / Formula', solids: 'Solids', sleep: 'Sleep', diaper: 'Diaper', feed: 'Feed',
  medicine: 'Medicine', temperature: 'Temperature', bath: 'Bath', tummy_time: 'Tummy time',
};
/** Shortcut keys may be spelled differently in ALL_SHORTCUTS; map them to the canonical category. */
const ALIASES: Record<string, string> = {
  tummy: 'tummy_time', tummytime: 'tummy_time', 'tummy-time': 'tummy_time',
  meds: 'medicine', medication: 'medicine', temp: 'temperature', milestones: 'milestone',
};

/** Dispatcher: one route, one form per category. Categories not built yet show a placeholder. */
export default function LogRoute() {
  const { type: raw } = useLocalSearchParams<{ type: string }>();
  const type = ALIASES[raw] ?? raw;
  const hasChild = useSession((s) => !!s.selectedChildId);
  const title = TITLES[type] ?? String(type).replace(/_/g, ' ').replace(/^./, (m) => m.toUpperCase());
  let body: React.ReactNode;
  if (!hasChild) body = <Screen headerShown><Body muted>Choose a baby first.</Body></Screen>;
  else if (type === 'breastfeeding') body = <BreastfeedingScreen />;
  else if (type === 'sleep') body = <SleepScreen />;
  else if (type === 'diaper') body = <DiaperScreen />;
  else if (type === 'bottle') body = <BottleScreen />;
  else if (type === 'solids') body = <SolidsScreen />;
  else if (type === 'feed') body = <FeedChooser />;
  else if (type === 'medicine') body = <MedicineScreen />;
  else if (type === 'temperature') body = <TemperatureScreen />;
  else if (type === 'bath') body = <CareScreen kind="bath" />;
  else if (type === 'tummy_time') body = <CareScreen kind="tummy_time" />;
  else if (type === 'milestone') return <Redirect href="/milestone/new" />;
  else body = <Screen headerShown><Body muted>This log form is coming in an upcoming step.</Body></Screen>;
  return <><Stack.Screen options={{ title }} />{body}</>;
}
