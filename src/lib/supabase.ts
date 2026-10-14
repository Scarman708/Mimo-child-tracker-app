import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Session tokens live in Android Keystore-backed SecureStore (spec: "secure storage").
// SecureStore has a ~2KB value limit, so chunk large values.
const CHUNK = 1800;
const secureStorage = {
  async getItem(key: string) {
    const n = await AsyncStorage.getItem(`${key}.n`);
    if (!n) return null;
    let out = '';
    for (let i = 0; i < Number(n); i++) out += (await SecureStore.getItemAsync(`${key}.${i}`)) ?? '';
    return out;
  },
  async setItem(key: string, value: string) {
    const parts = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < parts; i++)
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    await AsyncStorage.setItem(`${key}.n`, String(parts));
  },
  async removeItem(key: string) {
    const n = Number(await AsyncStorage.getItem(`${key}.n`)) || 0;
    for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
    await AsyncStorage.removeItem(`${key}.n`);
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } }
);
