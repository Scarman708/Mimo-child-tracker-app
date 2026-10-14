import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { fmtDateTime } from '@/lib/format';
import { useSession } from '@/store/session';
import { useColors, font, radius } from '@/theme';

/** Date + time picker. Android shows the date dialog, then the time dialog. */
export function DateTimeField({ label, value, onChange, maximumDate, error }: {
  label: string; value: Date; onChange: (d: Date) => void; maximumDate?: Date; error?: string;
}) {
  const c = useColors();
  const tf = useSession((s) => s.prefs.timeFormat);
  const [step, setStep] = useState<null | 'date' | 'time'>(null);
  const [draft, setDraft] = useState(value);

  function handle(e: DateTimePickerEvent, d?: Date) {
    if (Platform.OS === 'ios') { if (d) onChange(d); return; }
    if (e.type !== 'set' || !d) { setStep(null); return; }
    if (step === 'date') {
      const nd = new Date(value);
      nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      setDraft(nd); setStep('time');
    } else {
      const nd = new Date(draft);
      nd.setHours(d.getHours(), d.getMinutes(), 0, 0);
      setStep(null); onChange(nd);
    }
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: font.semibold, fontSize: 14, color: c.text, marginBottom: 6 }}>{label}</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker value={value} mode="datetime" display="compact" maximumDate={maximumDate} onChange={handle} />
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${fmtDateTime(value, tf)}. Change`} onPress={() => setStep('date')}
          style={{ minHeight: 48, borderRadius: radius.sm, borderWidth: 1.5, borderColor: error ? c.error : c.border, backgroundColor: c.card, justifyContent: 'center', paddingHorizontal: 14 }}>
          <Text style={{ fontFamily: font.regular, fontSize: 16, color: c.text }}>{fmtDateTime(value, tf)}</Text>
        </Pressable>
      )}
      {step && Platform.OS !== 'ios' && (
        <DateTimePicker value={step === 'date' ? value : draft} mode={step} is24Hour={tf === '24h'} maximumDate={step === 'date' ? maximumDate : undefined} onChange={handle} />
      )}
      {error ? <Text accessibilityRole="alert" style={{ color: c.error, fontSize: 13, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}
