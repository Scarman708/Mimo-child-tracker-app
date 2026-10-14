import React from 'react';
import {
  ActivityIndicator, Pressable, Text, TextInput, TextInputProps, View, ViewStyle, StyleProp, ScrollView,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, font, radius, MIN_TOUCH } from '@/theme';

/** Pass `headerShown` for screens that sit under a navigation header (avoids double top padding). */
export function Screen({ children, scroll = true, style, headerShown }: { children: React.ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle>; headerShown?: boolean }) {
  const c = useColors();
  const edges: Edge[] = headerShown ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right'];
  const body = scroll
    ? <ScrollView contentContainerStyle={[{ padding: 20, flexGrow: 1 }, style]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={[{ padding: 20, flex: 1 }, style]}>{children}</View>;
  return <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.bg }}>{body}</SafeAreaView>;
}

export function Title({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <Text accessibilityRole="header" style={{ fontFamily: font.bold, fontSize: 28, color: c.text, marginBottom: 8 }}>{children}</Text>;
}
export function Body({ children, muted, style }: { children: React.ReactNode; muted?: boolean; style?: any }) {
  const c = useColors();
  return <Text style={[{ fontFamily: font.regular, fontSize: 16, color: muted ? c.textMuted : c.text }, style]}>{children}</Text>;
}
export function SectionLabel({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <Text accessibilityRole="header" style={{ fontFamily: font.bold, fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase', color: c.textMuted, marginTop: 24, marginBottom: 8 }}>{children}</Text>;
}

export function Button({
  label, onPress, variant = 'primary', loading, disabled,
}: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; loading?: boolean; disabled?: boolean }) {
  const c = useColors();
  const bg = variant === 'primary' ? c.primary : variant === 'danger' ? c.error : 'transparent';
  const fg = variant === 'secondary' ? c.primary : c.onPrimary;
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH, borderRadius: radius.md, backgroundColor: bg,
        borderWidth: variant === 'secondary' ? 1.5 : 0, borderColor: c.primary,
        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20,
        opacity: off ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ fontFamily: font.bold, fontSize: 16, color: fg }}>{label}</Text>}
    </Pressable>
  );
}

/** Text input with label, optional unit suffix (e.g. "kg") and inline error. */
export function TextField({ label, error, suffix, containerStyle, ...props }: TextInputProps & { label: string; error?: string; suffix?: string; containerStyle?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      <Text style={{ fontFamily: font.semibold, fontSize: 14, color: c.text, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: MIN_TOUCH, borderRadius: radius.sm, borderWidth: 1.5, borderColor: error ? c.error : c.border, backgroundColor: c.card, paddingHorizontal: 14 }}>
        <TextInput
          accessibilityLabel={suffix ? `${label} in ${suffix}` : label}
          placeholderTextColor={c.textMuted}
          {...props}
          style={{ flex: 1, minHeight: MIN_TOUCH - 4, fontFamily: font.regular, fontSize: 16, color: c.text }}
        />
        {suffix ? <Text style={{ fontFamily: font.semibold, color: c.textMuted, marginLeft: 8 }}>{suffix}</Text> : null}
      </View>
      {error ? <Text accessibilityRole="alert" style={{ color: c.error, fontFamily: font.regular, fontSize: 13, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export function Card({ children, tint, style }: { children: React.ReactNode; tint?: 'mint' | 'peach' | 'sky'; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[{ backgroundColor: tint ? c[tint] : c.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: c.border }, style]}>{children}</View>;
}

/** Single-choice pill group (units, time format, theme, gender). */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string; sub?: string }[]; value: T | null; onChange: (v: T) => void; label?: string }) {
  const c = useColors();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 10 }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <Pressable key={o.value} accessibilityRole="radio" accessibilityLabel={o.label} accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            style={{ flex: 1, minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderColor: on ? c.primary : c.border, backgroundColor: on ? c.sky : c.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
            <Text style={{ fontFamily: font.bold, fontSize: 14, color: c.text, textAlign: 'center' }}>{o.label}</Text>
            {o.sub ? <Text style={{ fontFamily: font.regular, fontSize: 12, color: c.textMuted }}>{o.sub}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** List row used in Settings / Child Hub. */
export function Row({ label, value, icon, onPress, disabled, danger, last }: { label: string; value?: string; icon?: string; onPress?: () => void; disabled?: boolean; danger?: boolean; last?: boolean }) {
  const c = useColors();
  const color = danger ? c.error : c.text;
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={value ? `${label}, ${value}` : label} accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, opacity: disabled ? 0.45 : pressed ? 0.7 : 1, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.border })}>
      {icon ? <Ionicons name={icon as any} size={22} color={danger ? c.error : c.primary} /> : null}
      <Text style={{ flex: 1, fontFamily: font.semibold, fontSize: 16, color }}>{label}</Text>
      {value ? <Text style={{ fontFamily: font.regular, fontSize: 14, color: c.textMuted }}>{value}</Text> : null}
      {onPress && !disabled ? <Ionicons name="chevron-forward" size={18} color={c.textMuted} /> : null}
    </Pressable>
  );
}
export function Group({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <View style={{ backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>{children}</View>;
}
