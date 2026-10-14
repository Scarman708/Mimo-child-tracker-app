import { useColorScheme } from 'react-native';

export const palette = {
  lavender: '#7C72F3',
  navy: '#24345B',
  mint: '#DDF6ED',
  peach: '#FFE8DC',
  sky: '#E6F3FF',
  cream: '#FFFBF6',
  error: '#C83F60',
};

export const lightColors = {
  primary: palette.lavender,
  text: palette.navy,
  textMuted: '#5B6785',
  bg: palette.cream,
  card: '#FFFFFF',
  border: '#E8E3F5',
  mint: palette.mint,
  peach: palette.peach,
  sky: palette.sky,
  error: palette.error,
  onPrimary: '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  primary: '#A39BFF',
  text: '#F1EEFF',
  textMuted: '#B4B9CF',
  bg: '#141A2E',
  card: '#1F2742',
  border: '#33406A',
  mint: '#1E3B36',
  peach: '#443129',
  sky: '#1D3550',
  error: '#FF7A97',
  onPrimary: '#141A2E',
};

export type Colors = typeof lightColors;
export const useColors = (): Colors => (useColorScheme() === 'dark' ? darkColors : lightColors);

export const spacing = (n: number) => n * 8;
export const radius = { sm: 12, md: 16, lg: 20 };
export const font = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
};
export const MIN_TOUCH = 48;
