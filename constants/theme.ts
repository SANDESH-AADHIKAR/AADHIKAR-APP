import { DarkTheme, DefaultTheme } from 'expo-router';

/**
 * Navigation themes aligned with the design tokens in `global.css`.
 * Keeping these in sync means the tab bar, headers and icons use the
 * same colours as the NativeWind/Gluestack components.
 */
export const appLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#171717',
    background: '#ffffff',
    card: '#ffffff',
    text: '#0a0a0a',
    border: '#e5e5e5',
    notification: '#e7000b',
  },
};

export const appDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#fafafa',
    background: '#0a0a0a',
    card: '#171717',
    text: '#fafafa',
    border: '#2e2e2e',
    notification: '#ff6467',
  },
};

/** Muted text/icon colour for the active navigation theme. */
export function mutedColor(dark: boolean) {
  return dark ? '#a1a1a1' : '#737373';
}
