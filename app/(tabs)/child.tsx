import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatAge } from '@/lib/age';
import { fmtDate } from '@/lib/format';
import { formatLength, formatWeight } from '@/lib/units';
import { Avatar } from '@/components/Avatar';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { Body, Button, Card, Screen, SectionLabel } from '@/components/ui';
import { useSession } from '@/store/session';
import { useColors, font } from '@/theme';

interface Growth { measure_type: 'weight' | 'length' | 'head'; value_metric: number; measured_on: string }

export default function ChildHub() {
  const c = useColors();
  const router = useRouter();
  const { children, selectedChildId, roles } = useSession();
  const child = children.find((k) => k.id === selectedChildId);

  const { data: growth, isLoading } = useQuery({
    queryKey: ['growth-latest', selectedChildId], enabled: !!selectedChildId,
    queryFn: async () => {
      const { data, error } = await supabase.from('growth_records')
        .select('measure_type,value_metric,measured_on').eq('child_id', selectedChildId!)
        .is('deleted_at', null).order('measured_on', { ascending: false });
      if (error) throw error;
      return data as Growth[];
    },
  });
  if (!child) return null;
  const latest = (t: Growth['measure_type']) => growth?.find((g) => g.measure_type === t);
  const stats: { label: string; type: Growth['measure_type']; fmt: (v: number) => string }[] = [
    { label: 'Weight', type: 'weight', fmt: (v) => formatWeight(v, child.unit_system) },
    { label: 'Length', type: 'length', fmt: (v) => formatLength(v, child.unit_system) },
    { label: 'Head', type: 'head', fmt: (v) => formatLength(v, child.unit_system) },
  ];
  const isAdmin = roles[child.id] === 'admin';
  const genderLabel = child.gender === 'girl' ? 'Girl' : child.gender === 'boy' ? 'Boy' : child.gender === 'unspecified' ? 'Prefer not to say' : null;

  return (
    <Screen>
      <ChildSwitcher />
      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        <Avatar path={child.photo_path} name={child.name} size={104} />
        <Text accessibilityRole="header" style={{ fontFamily: font.bold, fontSize: 26, color: c.text, marginTop: 12 }}>{child.name}</Text>
        <Body muted>{formatAge(child.birth_date)} old · born {fmtDate(child.birth_date)}</Body>
        {genderLabel ? <Body muted style={{ fontSize: 14 }}>{genderLabel}</Body> : null}
      </View>
      <View style={{ gap: 12 }}>
        <Button label="Edit profile" variant="secondary" onPress={() => router.push({ pathname: '/child/edit', params: { id: child.id } })} />
        <Button label="Add another baby" variant="secondary" onPress={() => router.push('/child/new')} />
      </View>

      <SectionLabel>Latest measurements</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {stats.map((s, i) => {
          const g = latest(s.type);
          return (
            <Card key={s.type} tint={(['mint', 'peach', 'sky'] as const)[i]} style={{ flex: 1, padding: 12 }}>
              <Body muted style={{ fontSize: 13 }}>{s.label}</Body>
              <Text style={{ fontFamily: font.bold, fontSize: 16, color: c.text, marginTop: 2 }}>{isLoading ? '…' : g ? s.fmt(g.value_metric) : '—'}</Text>
              {g ? <Text style={{ fontFamily: font.regular, fontSize: 12, color: c.textMuted }}>{fmtDate(g.measured_on)}</Text> : null}
            </Card>
          );
        })}
      </View>
      {!isLoading && !growth?.length ? <Body muted style={{ marginTop: 8, fontSize: 14 }}>No measurements yet. Growth logging arrives in an upcoming step.</Body> : null}

      <SectionLabel>Milestones, teeth &amp; photos</SectionLabel>
      <Card><Body muted>Milestones, teeth and the photo gallery are coming in a later step.</Body></Card>
      {!isAdmin && <Body muted style={{ marginTop: 16, fontSize: 13 }}>You have {roles[child.id] ?? 'limited'} access to this profile.</Body>}
    </Screen>
  );
}
