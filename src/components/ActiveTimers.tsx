import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui';
import { useTimers } from '@/store/timers';
import { useNow } from '@/lib/useNow';
import { durationMs, formatClock, isRunning } from '@/lib/timer';
import { useColors, font } from '@/theme';

/** Today's "active timer" cards. Reads persisted sessions, so they reappear after the app is killed. */
export function ActiveTimers({ childId }: { childId: string }) {
  const c = useColors();
  const router = useRouter();
  const sessions = useTimers((s) => s.sessions);
  const mine = Object.values(sessions).filter((s) => s.childId === childId);
  const anyRunning = mine.some((s) => Object.values(s.timers).some(isRunning));
  const now = useNow(anyRunning);
  if (!mine.length) return null;

  return (
    <View style={{ gap: 8, marginBottom: 16 }}>
      {mine.map((s) => {
        const total = Object.values(s.timers).reduce((t, segs) => t + durationMs(segs, now), 0);
        const running = Object.values(s.timers).some(isRunning);
        const sleep = s.category === 'sleep';
        const title = sleep ? (s.subtype === 'night' ? 'Night sleep' : 'Nap') : 'Breastfeeding';
        const status = sleep ? 'In progress' : running ? (isRunning(s.timers.left ?? []) ? 'Left side running' : 'Right side running') : 'Paused';
        return (
          <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={`${title} timer, ${formatClock(total)}, ${status}. Open`}
            onPress={() => router.push(`/log/${s.category}`)}>
            <Card tint={sleep ? 'sky' : 'mint'} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name={sleep ? 'moon' : 'heart'} size={26} color={c.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.bold, fontSize: 16, color: c.text }}>{title}</Text>
                <Text style={{ fontFamily: font.regular, fontSize: 13, color: c.textMuted }}>{status} · tap to open</Text>
              </View>
              <Text style={{ fontFamily: font.bold, fontSize: 22, color: c.text }}>{formatClock(total)}</Text>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}
