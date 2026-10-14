import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Body, Button, Card, Screen } from '@/components/ui';
import { fromYmd, presetEmoji, useMilestones } from '@/features/milestones/api';
import { useSession } from '@/store/session';
import { useColors, font } from '@/theme';

export default function MilestonesScreen() {
  const c = useColors();
  const router = useRouter();
  const childId = useSession((s) => s.selectedChildId);
  const { data, isLoading, isError, refetch } = useMilestones(childId);
  return (
    <Screen headerShown>
      <Stack.Screen options={{ title: 'Milestones' }} />
      <Button label="Add milestone" onPress={() => router.push('/milestone/new')} />
      <View style={{ height: 16 }} />
      {isLoading ? <ActivityIndicator color={c.primary} />
        : isError ? <Card><Body>Couldn’t load milestones.</Body><View style={{ height: 8 }} /><Button label="Retry" variant="secondary" onPress={() => refetch()} /></Card>
        : !data?.length ? <Card tint="sky"><Body>No milestones yet. Add the first one — a first smile, rolling over, anything worth remembering.</Body></Card>
        : data.map((m) => (
          <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={`${m.title}, ${fromYmd(m.occurred_on).toLocaleDateString()}. Open`} onPress={() => router.push(`/milestone/${m.id}`)}>
            <Card style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text importantForAccessibility="no" style={{ fontSize: 26 }}>{presetEmoji(m.preset_key)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.semibold, fontSize: 16, color: c.text }}>{m.title}</Text>
                <Text style={{ fontFamily: font.regular, fontSize: 13, color: c.textMuted }}>
                  {fromYmd(m.occurred_on).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                {m.note ? <Text numberOfLines={1} style={{ fontFamily: font.regular, fontSize: 13, color: c.textMuted, marginTop: 2 }}>{m.note}</Text> : null}
              </View>
            </Card>
          </Pressable>
        ))}
    </Screen>
  );
}
