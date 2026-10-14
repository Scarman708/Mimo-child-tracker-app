import React, { useState } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Screen, Card, Body, Button } from '@/components/ui';
import { AppBar } from '@/components/AppBar';
import { fmtTime as fmt } from '@/lib/format';
import { ActiveTimers } from '@/components/ActiveTimers';
import { useLastEvents } from '@/features/log/useLastEvents';
import { describeEvent, EventRow } from '@/lib/eventText';
import { briefEvent } from '@/lib/eventBrief';
import { useSession } from '@/store/session';
import { ALL_SHORTCUTS } from '@/types';
import { useColors, font, radius } from '@/theme';

/** "Last feed / diaper / solids" card: icon + the key detail (amount, duration or diaper type) + time. */
function LastCard({ label, tint, event, fmtTime, style }: {
  label: string; tint: 'mint' | 'peach' | 'sky'; event: EventRow | null | undefined; fmtTime: (iso: string) => string; style?: any;
}) {
  const c = useColors();
  const b = event ? briefEvent(event) : null;
  const time = event ? fmtTime(event.started_at) : null;
  const main = b ? (b.detail ?? b.title) : '—';
  const sub = b ? (b.detail ? `${b.title} · ${time}` : time) : null;
  return (
    <Card tint={tint} style={style}>
      <View accessible accessibilityLabel={b ? `${label}: ${b.title}${b.detail ? `, ${b.detail}` : ''}, at ${time}` : `${label}: none yet`}>
        <Body muted>{label}</Body>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {b ? <Text importantForAccessibility="no" style={{ fontSize: 20 }}>{b.emoji}</Text> : null}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={{ fontFamily: font.bold, fontSize: 17, color: c.text }}>{main}</Text>
            {sub ? <Text style={{ fontFamily: font.regular, fontSize: 13, color: c.textMuted }}>{sub}</Text> : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function Today() {
  const c = useColors();
  const router = useRouter();
  const { children, selectedChildId, shortcuts, prefs } = useSession();
  const fmtTime = (iso: string) => fmt(iso, prefs.timeFormat);
  const child = children.find((k) => k.id === selectedChildId);
  const [day, setDay] = useState(startOfDay(new Date()));

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', selectedChildId, day.toDateString()],
    enabled: !!selectedChildId,
    queryFn: async () => {
      const end = new Date(day); end.setDate(end.getDate() + 1);
      const { data, error } = await supabase.from('events')
        .select('id,category,subtype,started_at,ended_at,payload,note')
        .eq('child_id', selectedChildId!).is('deleted_at', null)
        .gte('started_at', day.toISOString()).lt('started_at', end.toISOString())
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const { data: last } = useLastEvents(selectedChildId);
  const lastFeed = last?.lastFeed;
  const lastDiaper = last?.lastDiaper;
  const lastSolids = last?.lastSolids;
  const isToday = day.getTime() === startOfDay(new Date()).getTime();
  const shift = (n: number) => setDay((d) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; });
  if (!child) return null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppBar />
      <Screen headerShown style={{ paddingBottom: 100 }}>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 }}>
          <Pressable accessibilityLabel="Previous day" accessibilityRole="button" onPress={() => shift(-1)} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </Pressable>
          <Text style={{ fontFamily: font.bold, fontSize: 18, color: c.text }}>
            {isToday ? 'Today' : day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
          <Pressable accessibilityLabel="Next day" accessibilityRole="button" disabled={isToday} onPress={() => shift(1)} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', opacity: isToday ? 0.3 : 1 }}>
            <Ionicons name="chevron-forward" size={24} color={c.text} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {shortcuts.map((key) => {
            const s = ALL_SHORTCUTS.find((a) => a.key === key)!;
            return (
              <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Log ${s.label}`}
                onPress={() => router.push(`/log/${key}`)}
                style={{ width: '22%', flexGrow: 1, minHeight: 80, borderRadius: radius.lg, backgroundColor: c.sky, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Ionicons name={s.icon as any} size={26} color={c.primary} />
                <Text style={{ fontFamily: font.semibold, fontSize: 13, color: c.text }}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <LastCard label="Last feed" tint="mint" event={lastFeed} fmtTime={fmtTime} style={{ flex: 1 }} />
          <LastCard label="Last diaper" tint="peach" event={lastDiaper} fmtTime={fmtTime} style={{ flex: 1 }} />
        </View>
        <LastCard label="Last solids" tint="sky" event={lastSolids} fmtTime={fmtTime} style={{ marginBottom: 16 }} />

        <ActiveTimers childId={child.id} />
        {/* TODO(later): next reminder card */}

        <Text style={{ fontFamily: font.bold, fontSize: 18, color: c.text, marginBottom: 8 }}>Recent activity</Text>
        {isLoading ? <ActivityIndicator color={c.primary} />
          : isError ? (
            <Card><Body>Couldn’t load activity.</Body><View style={{ height: 8 }} /><Button label="Retry" variant="secondary" onPress={() => refetch()} /></Card>
          ) : !events?.length ? (
            <Card tint="sky"><Body>No activity {isToday ? 'yet today' : 'on this day'}. Tap a shortcut or + to log your first moment.</Body></Card>
          ) : events.slice(0, 10).map((e) => (
            <Pressable key={e.id} onPress={() => router.push(`/event/${e.id}`)} accessibilityRole="button" accessibilityLabel={`${describeEvent(e)} at ${fmtTime(e.started_at)}. Open details`}>
              <Card style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text importantForAccessibility="no" style={{ fontSize: 24 }}>{briefEvent(e).emoji}</Text>
                <Text style={{ fontFamily: font.semibold, color: c.text, flex: 1 }}>{describeEvent(e)}</Text>
                <Text style={{ fontFamily: font.regular, color: c.textMuted }}>{fmtTime(e.started_at)}</Text>
              </Card>
            </Pressable>
          ))}
      </Screen>

      <Pressable accessibilityRole="button" accessibilityLabel="Quick log" onPress={() => router.push('/quick-log')}
        style={{ position: 'absolute', right: 20, bottom: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 }}>
        <Ionicons name="add" size={34} color={c.onPrimary} />
      </Pressable>
    </View>
  );
}
