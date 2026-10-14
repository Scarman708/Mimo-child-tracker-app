import React from 'react';
import { Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, font } from '@/theme';

export default function TabsLayout() {
  const c = useColors();
  const router = useRouter();
  const icon = (name: any) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} size={size} color={color} />;
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: c.textMuted,
      tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border, height: 64 },
      tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 12, marginBottom: 6 },
    }}>
      <Tabs.Screen name="today" options={{ title: 'Today', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: icon('time') }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: icon('bar-chart') }} />
      <Tabs.Screen name="child" options={{ title: 'Child', tabBarIcon: icon('happy') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings') }} />
    </Tabs>
  );
}
