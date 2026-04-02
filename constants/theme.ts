import { Platform } from 'react-native';

const gold = '#d4af37';
const goldDim = '#aa8c2c';
const bgMainDark = '#0a0a0a';
const bgCardDark = '#141414';
const bgAccentDark = '#1e1e1e';
const lineDark = '#262626';
const mutedDark = '#a0a0a0';

// Light Theme - Inspirado en una barbería moderna y luminosa
const bgMainLight = '#fafafa';
const bgCardLight = '#f0f0f0';
const bgAccentLight = '#e8e8e8';
const lineLight = '#d0d0d0';
const mutedLight = '#555555';

export const Colors = {
  light: {
    text: '#000000',
    background: bgMainLight,
    card: bgCardLight,
    accent: bgAccentLight,
    tint: gold,
    icon: '#444444',
    tabIconDefault: '#888888',
    tabIconSelected: gold,
    border: lineLight,
    muted: mutedLight,
  },
  dark: {
    text: '#ffffff',
    background: bgMainDark,
    card: bgCardDark,
    accent: bgAccentDark,
    tint: gold,
    icon: mutedDark,
    tabIconDefault: mutedDark,
    tabIconSelected: gold,
    border: lineDark,
    muted: mutedDark,
  },
};

export const Brand = {
  gold,
  goldDim,
  bgMain: bgMainDark,
  bgCard: bgCardDark,
  bgAccent: bgAccentDark,
  line: lineDark,
  muted: mutedDark,
};

export function getBrand(mode: 'light' | 'dark') {
  if (mode === 'light') {
    return {
      gold,
      goldDim,
      bgMain: bgMainLight,
      bgCard: bgCardLight,
      bgAccent: bgAccentLight,
      line: lineLight,
      muted: mutedLight,
      text: '#000000',
      textSecondary: '#333333',
    };
  }
  return {
    gold,
    goldDim,
    bgMain: bgMainDark,
    bgCard: bgCardDark,
    bgAccent: bgAccentDark,
    line: lineDark,
    muted: mutedDark,
    text: '#ffffff',
    textSecondary: '#e5e5e5',
  };
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
