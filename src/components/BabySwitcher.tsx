import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { formatAge } from '@/lib/age';
import { useSession } from '@/store/session';
import { useColors, font, radius } from '@/theme';

/**
 * Shows the selected baby (photo, name, age) with a chevron. Tapping opens a bottom sheet to
 * switch between babies, open the profile, or add another baby.
 * variant "bar"  -> transparent, used inside the AppBar
 * variant "card" -> full-width card, used at the top of Settings
 */
export function BabySwitcher({ variant = 'bar', profileLink = false }: { variant?: 'bar' | 'card'; profileLink?: boolean }) {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { children, selectedChildId, selectChild } = useSession();
  const [open, setOpen] = useState(false);
  const child = children.find((k) => k.id === selectedChildId);
  if (!child) return null;

  // Small delay so the sheet finishes closing before the next screen opens (avoids Android flicker).
  const go = (path: string) => { setOpen(false); setTimeout(() => router.push(path as any), 150); };
  const pick = async (id: string) => { setOpen(false); if (id !== selectedChildId) await selectChild(id); };

  const card = variant === 'card';
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${child.name}, ${formatAge(child.birth_date)} old. Switch baby`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.7 : 1,
          alignSelf: card ? 'stretch' : 'flex-start', maxWidth: '100%',
          ...(card ? { backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: 12 } : {}),
        })}>
        <Avatar path={child.photo_path} name={child.name} size={card ? 48 : 40} />
        <View style={{ flexShrink: 1, flexGrow: card ? 1 : 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: font.bold, fontSize: 18, color: c.text }}>{child.name}</Text>
          <Text style={{ fontFamily: font.regular, fontSize: 13, color: c.textMuted }}>{formatAge(child.birth_date)} old</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={c.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="Close baby switcher" onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} accessibilityViewIsModal
            style={{ backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 20 + insets.bottom, maxHeight: '80%' }}>
            <Text accessibilityRole="header" style={{ fontFamily: font.bold, fontSize: 20, color: c.text, marginBottom: 12 }}>Switch baby</Text>

            <ScrollView style={{ flexGrow: 0 }}>
              {children.map((k) => {
                const on = k.id === selectedChildId;
                return (
                  <Pressable key={k.id} onPress={() => pick(k.id)} accessibilityRole="button"
                    accessibilityLabel={`${k.name}, ${formatAge(k.birth_date)} old${on ? ', selected' : ''}`} accessibilityState={{ selected: on }}
                    style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md, marginBottom: 6, backgroundColor: on ? c.sky : 'transparent' }}>
                    <Avatar path={k.photo_path} name={k.name} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontFamily: font.bold, fontSize: 16, color: c.text }}>{k.name}</Text>
                      <Text style={{ fontFamily: font.regular, fontSize: 13, color: c.textMuted }}>{formatAge(k.birth_date)} old</Text>
                    </View>
                    {on ? <Ionicons name="checkmark-circle" size={24} color={c.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ borderTopWidth: 1, borderTopColor: c.border, marginTop: 8, paddingTop: 8 }}>
              {profileLink && (
                <SheetAction icon="person-circle-outline" label={`View ${child.name}'s profile`} onPress={() => go('/profile')} />
              )}
              <SheetAction icon="add-circle-outline" label="Add another baby" onPress={() => go('/child/new')} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function SheetAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={({ pressed }) => ({ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, opacity: pressed ? 0.6 : 1 })}>
      <Ionicons name={icon as any} size={24} color={c.primary} />
      <Text style={{ fontFamily: font.semibold, fontSize: 16, color: c.text }}>{label}</Text>
    </Pressable>
  );
}