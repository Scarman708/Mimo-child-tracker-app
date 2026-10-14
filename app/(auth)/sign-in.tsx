import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Screen, Title, Body, Button, TextField } from '@/components/ui';
import { useColors, font } from '@/theme';

export default function SignIn() {
  const c = useColors();
  const router = useRouter();
  const { mode: initial } = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<'login' | 'register'>(initial === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  async function submit() {
    setError(undefined); setInfo(undefined);
    if (!validEmail) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    const { data, error: err } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (err) return setError(err.message.includes('fetch') ? "You're offline. Check your connection and try again." : err.message);
    if (mode === 'register' && !data.session) setInfo('Check your email to confirm your account, then sign in.');
    // On success the root route guard routes to onboarding or Today automatically.
  }

  async function recover() {
    setError(undefined); setInfo(undefined);
    if (!validEmail) return setError('Enter your email above first.');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (err) setError(err.message); else setInfo('If that account exists, a recovery email is on its way.');
  }

  return (
    <Screen>
      <Text onPress={() => router.back()} accessibilityRole="button" style={{ color: c.primary, fontFamily: font.semibold, minHeight: 48, textAlignVertical: 'center' }}>‹ Back</Text>
      <Title>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Title>
      <Body muted style={{ marginBottom: 24 }}>
        {mode === 'login' ? 'Sign in to restore your babies and logs.' : 'One account keeps your records safe and synced.'}
      </Body>
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      {error ? <Text accessibilityRole="alert" style={{ color: c.error, fontFamily: font.regular, marginBottom: 12 }}>{error}</Text> : null}
      {info ? <Text style={{ color: c.primary, fontFamily: font.regular, marginBottom: 12 }}>{info}</Text> : null}
      <View style={{ gap: 12 }}>
        <Button label={mode === 'login' ? 'Sign In' : 'Create Account'} onPress={submit} loading={busy} />
        {mode === 'login' && <Button label="Forgot password?" variant="secondary" onPress={recover} />}
        <Button
          label={mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
          variant="secondary"
          onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(undefined); setInfo(undefined); }}
        />
      </View>
    </Screen>
  );
}
