import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Title } from '@/components/ui';
import { useColors, font, radius } from '@/theme';

const ITEMS = [
  { key: 'breastfeeding', label: 'Breastfeeding', icon: 'heart' },
  { key: 'bottle', label: 'Bottle', icon: 'water' },
  { key: 'pump', label: 'Pumping', icon: 'funnel' },
  { key: 'sleep', label: 'Sleep', icon: 'moon' },
  { key: 'diaper', label: 'Diaper', icon: 'happy' },
  { key: 'solids', label: 'Solids', icon: 'nutrition' },
  { key: 'growth', label: 'Growth', icon: 'trending-up' },
  { key: 'milestone', label: 'Milestone', icon: 'star' },
  { key: 'temperature', label: 'Temperature', icon: 'thermometer' },
  { key: 'medicine', label: 'Medicine', icon: 'medkit' },
  { key: 'vaccination', label: 'Vaccination', icon: 'shield-checkmark' },
  { key: 'symptoms', label: 'Symptoms', icon: 'alert-circle' },
  { key: 'bath', label: 'Bath', icon: 'water-outline' },
  { key: 'tummy_time', label: 'Tummy Time', icon: 'body' },
  { key: 'potty', label: 'Potty', icon: 'cafe' },
  { key: 'note', label: 'Note / Custom', icon: 'create' },
];

export default function QuickLog() {
  const c = useColors();
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>Quick Log</Title>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={28} color={c.text} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        {ITEMS.map((i) => (
          <Pressable key={i.key} accessibilityRole="button" accessibilityLabel={i.label}
            onPress={() => router.replace(`/log/${i.key}`)}
            style={{ width: '22%', flexGrow: 1, minHeight: 92, borderRadius: radius.lg, backgroundColor: c.sky, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 4 }}>
            <Ionicons name={i.icon as any} size={26} color={c.primary} />
            <Text style={{ fontFamily: font.semibold, fontSize: 12, color: c.text, textAlign: 'center' }}>{i.label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
