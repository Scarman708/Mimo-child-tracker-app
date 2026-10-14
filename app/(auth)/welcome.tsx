import React from 'react';
import { View, Text, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Button, Body } from '@/components/ui';
import { useColors, font } from '@/theme';

export default function Welcome() {
  const c = useColors();
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 40 }}>
        {/* TODO: replace with the original elephant mascot SVG */}
        <View accessibilityLabel="Mimo elephant mascot" style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: c.sky, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 80 }}>🐘</Text>
        </View>
        <Text style={{ fontFamily: font.bold, fontSize: 40, color: c.primary }}>Mimo</Text>
        <Text style={{ fontFamily: font.semibold, fontSize: 18, color: c.text }}>Little Moments, Big Love</Text>
        <Body muted style={{ textAlign: 'center', marginTop: 8 }}>
          Track feeds, sleep, diapers and growth in a few taps — and share with the people who care for your little one.
        </Body>
      </View>
      <View style={{ gap: 12 }}>
        <Button label="Get Started" onPress={() => router.push({ pathname: '/(auth)/sign-in', params: { mode: 'register' } })} />
        <Button label="Sign In / Restore" variant="secondary" onPress={() => router.push({ pathname: '/(auth)/sign-in', params: { mode: 'login' } })} />
        <Text
          accessibilityRole="link"
          onPress={() => Linking.openURL('https://example.com/privacy') /* TODO: real privacy URL */}
          style={{ textAlign: 'center', color: c.textMuted, fontFamily: font.regular, fontSize: 13, paddingVertical: 12 }}
        >
          Your baby's data is private and never public. Privacy policy
        </Text>
      </View>
    </Screen>
  );
}
