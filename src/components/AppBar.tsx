import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BabySwitcher } from '@/components/BabySwitcher';
import { useColors } from '@/theme';

/** 48dp round icon button, used in the AppBar and in stack headers (Profile / Settings). */
export function HeaderIconButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Ionicons name={icon as any} size={24} color={c.primary} />
    </Pressable>
  );
}

/** Top bar for the main tabs: baby switcher on the left (switch / profile / add baby), Settings on the right. */
export function AppBar() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, paddingHorizontal: 12, backgroundColor: c.bg, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <View style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}><BabySwitcher profileLink /></View>
        <HeaderIconButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
      </View>
    </View>
  );
}