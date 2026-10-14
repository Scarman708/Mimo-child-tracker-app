import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Body, Button, Card, Screen } from '@/components/ui';
import { AppBar } from '@/components/AppBar';
import { Chip } from '@/components/Chip';
import { EventActionSheet } from '@/components/EventActionSheet';
import { canDuplicate, confirmDelete, useEventActions } from '@/features/events/eventActions';
import { ChildEventRow, describeEvent } from '@/lib/eventText';
import { briefEvent } from '@/lib/eventBrief';
import { fmtTime } from '@/lib/format';
import { useSession } from '@/store/session';
import { useColors, font } from '@/theme';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const KNOWN = ['breastfeeding', 'bottle', 'solids', 'sleep', 'diaper', 'medicine', 'temperature', 'bath', 'tummy_time'];
const FILTERS: { key: string; label: string; match: (cat: string) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'feed', label: 'Feeds', match: (c) => c === 'breastfeeding' || c === 'bottle' },
  { key: 'solids', label: 'Solids', match: (c) => c === 'solids' },
  { key: 'sleep', label: 'Sleep', match: (c) => c === 'sleep' },
  { key: 'diaper', label: 'Diaper', match: (c) => c === 'diaper' },
  { key: 'health', label: 'Health', match: (c) => c === 'medicine' || c === 'temperature' },
  { key: 'care', label: 'Care', match: (c) => c === 'bath' || c === 'tummy_time' },
  { key: 'other', label: 'Other', match: (c) => !KNOWN.includes(c) },
];

export default function HistoryScreen() {
  const c = useColors();
  const router = useRouter();
  const selectedChildId = useSession((s) => s.selectedChildId);
  const prefs = useSession((s) => s.prefs);
  const userId = useSession((s) => s.session?.user.id);
  const actions = useEventActions();
  const [day, setDay] = useState(startOfDay(new Date()));
  const [filter, setFilter] = useState('all');
  const [menu, setMenu] = useState<ChildEventRow | null>(null);

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', 'history', selectedChildId, day.toDateString()],
    enabled: !!selectedChildId,
    queryFn: async () => {
      const end = new Date(day); end.setDate(end.getDate() + 1);
      const { data, error } = await supabase.from('events')
        .select('id,child_id,category,subtype,started_at,ended_at,payload,note,creator_id')
        .eq('child_id', selectedChildId!).is('deleted_at', null)
        .gte('started_at', day.toISOString()).lt('started_at', end.toISOString())
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data as ChildEventRow[];
    },
  });

  const active = FILTERS.find((f) => f.key === filter)!;
  const shown = useMemo(() => (events ?? []).filter((e) => active.match(e.category)), [events, active]);
  const isToday = day.getTime() === startOfDay(new Date()).getTime();
  const shift = (n: number) => setDay((d) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; });
  const t = (iso: string) => fmtTime(iso, prefs.timeFormat);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppBar />
      <Screen headerShown>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Pressable accessibilityLabel="Previous day" accessibilityRole="button" onPress={() => shift(-1)} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={isToday ? 'Today' : 'Jump to today'} disabled={isToday} onPress={() => setDay(startOfDay(new Date()))} style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontFamily: font.bold, fontSize: 18, color: c.text }}>
              {isToday ? 'Today' : day.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            {!isToday ? <Text style={{ fontFamily: font.semibold, fontSize: 12, color: c.primary }}>Jump to today</Text> : null}
          </Pressable>
          <Pressable accessibilityLabel="Next day" accessibilityRole="button" disabled={isToday} onPress={() => shift(1)} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', opacity: isToday ? 0.3 : 1 }}>
            <Ionicons name="chevron-forward" size={24} color={c.text} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }} style={{ flexGrow: 0, marginBottom: 8 }}>
          {FILTERS.map((f) => <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />)}
        </ScrollView>

        {isLoading ? <ActivityIndicator color={c.primary} style={{ marginTop: 24 }} />
          : isError ? (
            <Card><Body>Couldn’t load history.</Body><View style={{ height: 8 }} /><Button label="Retry" variant="secondary" onPress={() => refetch()} /></Card>
          ) : !shown.length ? (
            <Card tint="sky"><Body>{filter === 'all' ? 'No entries on this day.' : `No ${active.label.toLowerCase()} entries on this day.`}</Body></Card>
          ) : (
            <>
              <Text style={{ fontFamily: font.regular, fontSize: 13, color: c.textMuted, marginBottom: 8 }}>{shown.length} {shown.length === 1 ? 'entry' : 'entries'}</Text>
              {shown.map((e) => {
                const range = e.ended_at && (e.category === 'sleep' || e.category === 'breastfeeding') ? `${t(e.started_at)} – ${t(e.ended_at)}` : t(e.started_at);
                const who = e.creator_id === userId ? 'You' : e.creator_id ? 'Another caregiver' : null;
                return (
                  <Card key={e.id} style={{ marginBottom: 8, padding: 0, flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`${describeEvent(e)}, ${range}. Open details`} onPress={() => router.push(`/event/${e.id}`)}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 64 }}>
                      <Text style={{ fontSize: 26 }}>{briefEvent(e).emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: font.semibold, fontSize: 15, color: c.text }}>{describeEvent(e)}</Text>
                        <Text style={{ fontFamily: font.regular, fontSize: 13, color: c.textMuted }}>{range}{who ? ` · ${who}` : ''}</Text>
                        {e.note ? <Text numberOfLines={1} style={{ fontFamily: font.regular, fontSize: 13, color: c.textMuted, marginTop: 2 }}>{e.note}</Text> : null}
                      </View>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`More actions for ${describeEvent(e)}`} onPress={() => setMenu(e)}
                      style={{ width: 48, height: 64, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="ellipsis-vertical" size={20} color={c.textMuted} />
                    </Pressable>
                  </Card>
                );
              })}
            </>
          )}
      </Screen>

      <EventActionSheet
        event={menu}
        onClose={() => setMenu(null)}
        onView={() => { const id = menu!.id; setMenu(null); router.push(`/event/${id}`); }}
        onEdit={() => { const id = menu!.id; setMenu(null); router.push(`/event/${id}?edit=1`); }}
        onDuplicate={menu && canDuplicate(menu) ? async () => {
          const e = menu; setMenu(null);
          const err = await actions.duplicate(e);
          Alert.alert(err ? 'Couldn’t duplicate' : 'Duplicated', err ?? 'A copy was added at the current time.');
        } : undefined}
        onDelete={() => { const e = menu!; setMenu(null); confirmDelete(e, actions.remove); }}
      />
    </View>
  );
}
