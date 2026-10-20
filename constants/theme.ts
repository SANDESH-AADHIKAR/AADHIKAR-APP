import { DarkTheme, DefaultTheme } from 'expo-router';

/**
 * Navigation themes aligned with the merged AADHIKAR palette in `global.css`.
 * The active tab uses forest green in light mode (high contrast on parchment)
 * and luminous marigold in dark mode.
 */
export const appLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#14524F',
    background: '#FBF7EF',
    card: '#FFFFFF',
    text: '#241C12',
    border: '#E9DFCE',
    notification: '#DC2626',
  },
};

export const appDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#F59E0B',
    background: '#13110E',
    card: '#1C1916',
    text: '#F4EFE6',
    border: '#2E2A24',
    notification: '#FF6467',
  },
};

/** Ink used on top of marigold surfaces in both modes. */
export const ON_PRIMARY = '#241C12';

/** Muted text/icon colour for the active navigation theme. */
export function mutedColor(dark: boolean) {
  return dark ? '#B0A799' : '#6E6353';
}

/** Trust green / teal for the active navigation theme. */
export function trustColor(dark: boolean) {
  return dark ? '#2DD4BF' : '#14524F';
}

/** Foreground colour on trust surfaces for the active navigation theme. */
export function trustForegroundColor(dark: boolean) {
  return dark ? '#0A2622' : '#FBF7EF';
}
