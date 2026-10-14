import React from 'react';
import { BabySwitcher } from '@/components/BabySwitcher';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Group, Row, Screen, SectionLabel, Segmented, Title, Body } from '@/components/ui';
import { useSession, ThemePref } from '@/store/session';
import type { TimeFormat } from '@/lib/format';
import type { UnitSystem } from '@/types';

export default function Settings() {
  const router = useRouter();
  const { session, children, selectedChildId, roles, prefs, setPrefs, updateChild, deleteChild, deleteAccount, signOut } = useSession();
  const child = children.find((k) => k.id === selectedChildId);

  const confirm = (title: string, msg: string, action: string, onYes: () => void) =>
    Alert.alert(title, msg, [{ text: 'Cancel', style: 'cancel' }, { text: action, style: 'destructive', onPress: onYes }]);

  const onDeleteChild = () => child && confirm(
    `Delete ${child.name}?`, 'This permanently deletes this baby and every log, measurement and photo for all caregivers. This cannot be undone.', 'Delete',
    async () => { const err = await deleteChild(child.id); if (err) Alert.alert('Could not delete', err); });

  const onDeleteAccount = () => confirm(
    'Delete your account?', 'Your account is removed. Babies only you manage are deleted with all their data. Babies shared with other caregivers stay with them. This cannot be undone.', 'Delete account',
    async () => { const err = await deleteAccount(); if (err) Alert.alert('Could not delete', err); });

  return (
    <Screen>
      <Title>Settings</Title>
 <BabySwitcher variant="card" />
      <SectionLabel>Account</SectionLabel>
      <Group>
        <Row icon="mail" label="Signed in as" value={session?.user.email ?? ''} />
        <Row icon="log-out" label="Sign out" last onPress={() => confirm('Sign out?', 'Your data stays safely in your account.', 'Sign out', signOut)} />
      </Group>

      <SectionLabel>Babies</SectionLabel>
      <Group>
        {children.map((k) => (
          <Row key={k.id} icon="happy" label={k.name} onPress={() => router.push({ pathname: '/child/edit', params: { id: k.id } })} />
        ))}
        <Row icon="add-circle" label="Add another baby" last onPress={() => router.push('/child/new')} />
      </Group>

      <SectionLabel>Preferences</SectionLabel>
      <Group>
        <Row icon="flash" label="Shortcuts" onPress={() => router.push('/settings/shortcuts')} last />
      </Group>
      {child && (
        <>
          <SectionLabel>Units for {child.name}</SectionLabel>
          <Segmented<UnitSystem> label="Units" value={child.unit_system}
            onChange={(u) => updateChild(child.id, { unit_system: u })}
            options={[{ value: 'metric', label: 'Metric', sub: 'kg · cm · mL' }, { value: 'imperial', label: 'Imperial', sub: 'lb · in · oz' }]} />
        </>
      )}
      <SectionLabel>Time format</SectionLabel>
      <Segmented<TimeFormat> label="Time format" value={prefs.timeFormat} onChange={(v) => setPrefs({ timeFormat: v })}
        options={[{ value: '12h', label: '12-hour', sub: '2:30 PM' }, { value: '24h', label: '24-hour', sub: '14:30' }]} />
      <SectionLabel>Theme</SectionLabel>
      <Segmented<ThemePref> label="Theme" value={prefs.theme} onChange={(v) => setPrefs({ theme: v })}
        options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />

      <SectionLabel>Coming soon</SectionLabel>
      <Group>
        <Row icon="notifications" label="Notifications &amp; reminders" disabled />
        <Row icon="people" label="Family &amp; caregivers" disabled />
        <Row icon="cloud-upload" label="Export, backup &amp; restore" disabled last />
      </Group>

      <SectionLabel>Privacy &amp; help</SectionLabel>
      <Group>
        <Row icon="shield-checkmark" label="Privacy" onPress={() => Alert.alert('Privacy', 'Your baby’s records are private to you and caregivers you invite. Nothing is public. A full privacy policy link will be added before launch.')} />
        <Row icon="help-circle" label="Help" last onPress={() => Alert.alert('Help', 'Help and support content will be added before launch.')} />
      </Group>

      <SectionLabel>Danger zone</SectionLabel>
      <Group>
        {child && <Row icon="trash" danger label={`Delete ${child.name}`} onPress={onDeleteChild} disabled={roles[child.id] !== 'admin'} />}
        <Row icon="warning" danger label="Delete my account" last onPress={onDeleteAccount} />
      </Group>
      {child && roles[child.id] !== 'admin' && <Body muted style={{ marginTop: 8, fontSize: 13 }}>Only an admin can delete a baby profile.</Body>}
    </Screen>
  );
}
