import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useColors, font, radius, MIN_TOUCH } from '@/theme';

/** Date-only picker (no time), styled like TextField. Needs @react-native-community/datetimepicker. */
export function DateField({ label, value, onChange, maximumDate }: { label: string; value: Date; onChange: (d: Date) => void; maximumDate?: Date }) {
  const c = useColors();
  const [showIos, setShowIos] = useState(false);
  const text = value.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value, mode: 'date', maximumDate,
        onChange: (e: DateTimePickerEvent, d?: Date) => { if (e.type === 'set' && d) onChange(d); },
      });
    } else setShowIos((s) => !s);
  }
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: font.semibold, fontSize: 14, color: c.text, marginBottom: 6 }}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${text}. Change date`} onPress={open}
        style={{ flexDirection: 'row', alignItems: 'center', minHeight: MIN_TOUCH, borderRadius: radius.sm, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card, paddingHorizontal: 14, gap: 10 }}>
        <Ionicons name="calendar-outline" size={20} color={c.primary} />
        <Text style={{ flex: 1, fontFamily: font.regular, fontSize: 16, color: c.text }}>{text}</Text>
      </Pressable>
      {showIos ? <DateTimePicker value={value} mode="date" display="inline" maximumDate={maximumDate} onChange={(_e, d) => { if (d) onChange(d); }} /> : null}
    </View>
  );
}
