export type UnitSystem = 'metric' | 'imperial';
export interface Child {
  id: string; name: string; birth_date: string;
  photo_path: string | null; unit_system: UnitSystem;
  gender: 'girl' | 'boy' | 'unspecified' | null;
}
export type ShortcutKey =
  | 'feed' | 'sleep' | 'diaper' | 'pump' | 'solids' | 'growth'
  | 'medicine' | 'milestone' | 'temperature' | 'bath' | 'tummy_time' | 'potty';
export const ALL_SHORTCUTS: { key: ShortcutKey; label: string; icon: string }[] = [
  { key: 'feed', label: 'Feed', icon: 'water' },
  { key: 'sleep', label: 'Sleep', icon: 'moon' },
  { key: 'diaper', label: 'Diaper', icon: 'happy' },
  { key: 'pump', label: 'Pump', icon: 'funnel' },
  { key: 'solids', label: 'Solids', icon: 'nutrition' },
  { key: 'growth', label: 'Growth', icon: 'trending-up' },
  { key: 'medicine', label: 'Medicine', icon: 'medkit' },
  { key: 'milestone', label: 'Milestone', icon: 'star' },
  { key: 'temperature', label: 'Temperature', icon: 'thermometer' },
  { key: 'bath', label: 'Bath', icon: 'water-outline' },
  { key: 'tummy_time', label: 'Tummy Time', icon: 'body' },
  { key: 'potty', label: 'Potty', icon: 'cafe' },
];
export const DEFAULT_SHORTCUTS: ShortcutKey[] = ['feed', 'sleep', 'diaper', 'pump'];
export type Gender = 'girl' | 'boy' | 'unspecified';
