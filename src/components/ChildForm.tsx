import React, { useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { formatAge, parseDateOnly, toDateOnly } from '@/lib/age';
import { buildBirthMeasurements, Measurement } from '@/lib/units';
import { Avatar } from '@/components/Avatar';
import { Body, Button, Card, Segmented, SectionLabel, TextField } from '@/components/ui';
import { useColors, font, radius } from '@/theme';
import type { Child, Gender, UnitSystem } from '@/types';

export interface ChildFormValues {
  name: string; birth: Date; gender: Gender | null; unit: UnitSystem;
  photoUri: string | null; measurements: Measurement[];
}
interface Props {
  mode: 'create' | 'edit';
  initial?: Child;
  submitLabel: string;
  /** Return an error message to show on the form, or nothing on success. */
  onSubmit: (v: ChildFormValues) => Promise<string | void>;
}
type Errors = { name?: string; birth?: string; weight?: string; length?: string; head?: string; form?: string };

export function ChildForm({ mode, initial, submitLabel, onSubmit }: Props) {
  const c = useColors();
  const [name, setName] = useState(initial?.name ?? '');
  const [birth, setBirth] = useState<Date | null>(initial ? parseDateOnly(initial.birth_date) : null);
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender] = useState<Gender | null>(initial?.gender ?? null);
  const [unit, setUnit] = useState<UnitSystem>(initial?.unit_system ?? 'metric');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [w1, setW1] = useState(''); const [w2, setW2] = useState('');
  const [len, setLen] = useState(''); const [head, setHead] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const metric = unit === 'metric';

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync(); // asked only when used
    if (!perm.granted) return setErrors((e) => ({ ...e, form: 'Photo access was denied. You can add a photo later.' }));
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) { setPhotoUri(res.assets[0].uri); setErrors((e) => ({ ...e, form: undefined })); }
  }

  function changeUnit(u: UnitSystem) {
    if (u === unit) return;
    setUnit(u); setW1(''); setW2(''); setLen(''); setHead(''); // typed values aren't converted, so clear them
  }

  async function save() {
    if (saving) return; // no duplicate submissions
    const next: Errors = {};
    if (!name.trim()) next.name = 'Please enter your baby’s name.';
    if (!birth) next.birth = 'Please choose a birth date.';
    else if (birth > new Date()) next.birth = 'Birth date cannot be in the future.';

    let measurements: Measurement[] = [];
    if (mode === 'create') {
      const r = buildBirthMeasurements(unit, { w1, w2, len, head });
      Object.assign(next, r.errors);
      measurements = r.measurements;
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const err = await onSubmit({ name: name.trim(), birth: birth!, gender, unit, photoUri, measurements });
    setSaving(false);
    if (err) setErrors({ form: err });
  }

  const unitLabel = (m: string, i: string) => (metric ? m : i);

  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={photoUri || initial?.photo_path ? 'Change baby photo' : 'Add baby photo'} onPress={pickPhoto} style={{ alignSelf: 'center', marginBottom: 20 }}>
        {photoUri ? <Image source={{ uri: photoUri }} style={{ width: 112, height: 112, borderRadius: 56 }} />
          : <Avatar path={initial?.photo_path ?? null} name={name || '+'} size={112} />}
        <Text style={{ textAlign: 'center', color: c.primary, fontFamily: font.semibold, marginTop: 6 }}>{photoUri || initial?.photo_path ? 'Change photo' : 'Add photo (optional)'}</Text>
      </Pressable>

      <TextField label="Baby's name" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" maxLength={60} />

      <Text style={{ fontFamily: font.semibold, fontSize: 14, color: c.text, marginBottom: 6 }}>Birth date</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={birth ? `Birth date ${toDateOnly(birth)}, change` : 'Choose birth date'} onPress={() => setShowPicker(true)}
        style={{ minHeight: 48, borderRadius: radius.sm, borderWidth: 1.5, borderColor: errors.birth ? c.error : c.border, backgroundColor: c.card, justifyContent: 'center', paddingHorizontal: 14 }}>
        <Text style={{ fontFamily: font.regular, fontSize: 16, color: birth ? c.text : c.textMuted }}>{birth ? toDateOnly(birth) : 'Select date'}</Text>
      </Pressable>
      {errors.birth ? <Text accessibilityRole="alert" style={{ color: c.error, fontSize: 13, marginTop: 4 }}>{errors.birth}</Text> : null}
      {showPicker && (
        <DateTimePicker value={birth ?? new Date()} mode="date" maximumDate={new Date()}
          onChange={(_, d) => { setShowPicker(Platform.OS === 'ios'); if (d) setBirth(d); }} />
      )}
      {birth && birth <= new Date() && (
        <Card tint="mint" style={{ marginTop: 12 }}><Body>Age: {formatAge(toDateOnly(birth))}</Body></Card>
      )}

      <SectionLabel>Gender (optional)</SectionLabel>
      <Segmented<Gender> label="Gender" value={gender} onChange={(g) => setGender(g === gender ? null : g)}
        options={[{ value: 'girl', label: 'Girl' }, { value: 'boy', label: 'Boy' }, { value: 'unspecified', label: 'Prefer not to say' }]} />

      <SectionLabel>Units</SectionLabel>
      <Segmented<UnitSystem> label="Unit system" value={unit} onChange={changeUnit}
        options={[{ value: 'metric', label: 'Metric', sub: 'kg · cm · mL' }, { value: 'imperial', label: 'Imperial', sub: 'lb · in · oz' }]} />

      {mode === 'create' && (
        <>
          <SectionLabel>Birth measurements (optional)</SectionLabel>
          <Body muted style={{ marginBottom: 12, fontSize: 14 }}>Add what you know — you can log more in Growth later. Leave blank if unsure.</Body>
          {metric ? (
            <TextField label="Birth weight" suffix="kg" placeholder="e.g. 3.4" value={w1} onChangeText={setW1} keyboardType="decimal-pad" error={errors.weight} />
          ) : (
            <View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextField containerStyle={{ flex: 1 }} label="Birth weight" suffix="lb" placeholder="e.g. 7" value={w1} onChangeText={setW1} keyboardType="decimal-pad" />
                <TextField containerStyle={{ flex: 1 }} label="Ounces" suffix="oz" placeholder="e.g. 8" value={w2} onChangeText={setW2} keyboardType="decimal-pad" />
              </View>
              {errors.weight ? <Text accessibilityRole="alert" style={{ color: c.error, fontSize: 13, marginTop: -10, marginBottom: 12 }}>{errors.weight}</Text> : null}
            </View>
          )}
          <TextField label="Birth length" suffix={unitLabel('cm', 'in')} placeholder={unitLabel('e.g. 50', 'e.g. 19.5')} value={len} onChangeText={setLen} keyboardType="decimal-pad" error={errors.length} />
          <TextField label="Head circumference" suffix={unitLabel('cm', 'in')} placeholder={unitLabel('e.g. 34', 'e.g. 13.5')} value={head} onChangeText={setHead} keyboardType="decimal-pad" error={errors.head} />
        </>
      )}
      {mode === 'edit' && <Body muted style={{ marginTop: 8, fontSize: 13 }}>Changing units only changes how values are shown. Saved measurements keep their original entries.</Body>}

      {errors.form ? <Text accessibilityRole="alert" style={{ color: c.error, fontFamily: font.regular, marginTop: 12 }}>{errors.form}</Text> : null}
      <View style={{ marginTop: 20 }}><Button label={submitLabel} onPress={save} loading={saving} /></View>
    </View>
  );
}
