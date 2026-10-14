import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useTimers } from '@/store/timers';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from '@/store/session';
import { useColors, font } from '@/theme';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold });
  const { ready, session, children, onboardingPending, init } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const c = useColors();

     useEffect(() => { init(); useTimers.getState().hydrate(); }, []);

  // Route guard: Welcome -> Create Child -> Shortcuts -> Today. Returning users skip onboarding.
  useEffect(() => {
    if (!ready || !fontsLoaded) return;
    const group = segments[0] as string | undefined;
    if (!session) {
      if (group !== '(auth)') router.replace('/(auth)/welcome');
    } else if (children.length === 0) {
      if (group !== '(onboarding)') router.replace('/(onboarding)/create-child');
    } else if (!onboardingPending && (group === '(auth)' || group === '(onboarding)' || !group)) {
      router.replace('/(tabs)/today');
    }
  }, [ready, fontsLoaded, session, children.length, onboardingPending, segments]);

  if (!ready || !fontsLoaded) {
    return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: c.bg }}><ActivityIndicator color={c.primary} /></View>;
  }
  const header = (title: string) => ({
    headerShown: true, title, headerTintColor: c.primary, headerShadowVisible: false,
    headerStyle: { backgroundColor: c.bg }, headerTitleStyle: { fontFamily: font.bold, color: c.text },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="quick-log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="log/[type]" options={header('Log')} />
        <Stack.Screen name="event/[id]" options={header('Event')} />
        <Stack.Screen name="child/new" options={header('Add baby')} />
        <Stack.Screen name="child/edit" options={header('Edit profile')} />
        <Stack.Screen name="settings/shortcuts" options={header('Shortcuts')} />
      </Stack>
    </QueryClientProvider>
  );
}
