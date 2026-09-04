import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

const THEME_STORAGE_KEY = 'themeMode';

const palettes = {
  dark: {
    mode: 'dark',
    background: '#080B12',
    backgroundAlt: '#0D1117',
    surface: '#111722',
    surfaceMuted: '#141B26',
    card: '#111722',
    cardAlt: '#0D1117',
    text: '#FFFFFF',
    textMuted: '#94A3B8',
    border: '#1E293B',
    primary: '#22C55E',
    primarySoft: 'rgba(34, 197, 94, 0.15)',
    success: '#22C55E',
    successSoft: 'rgba(34, 197, 94, 0.15)',
    danger: '#EF4444',
    dangerSoft: 'rgba(239, 68, 68, 0.15)',
    warning: '#F59E0B',
    warningSoft: 'rgba(245, 158, 11, 0.15)',
    accent: '#22C55E',
    accentSoft: 'rgba(34, 197, 94, 0.15)',
    overlay: 'rgba(4, 9, 20, 0.88)',
    white: '#FFFFFF',
    black: '#080B12',
    headerGradient: ['#080B12', '#0D1117'],
    authGradient: ['#080B12', '#0D1117', '#080B12'],
    tabBar: '#0D1117',
    tabBarBorder: '#1E293B',
    input: '#111722',
  },
  light: {
    mode: 'light',
    background: '#F3F6FB',
    backgroundAlt: '#E8EEF8',
    surface: '#FFFFFF',
    surfaceMuted: '#F7F9FD',
    card: '#FFFFFF',
    cardAlt: '#EEF3FB',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#D7E2F2',
    primary: '#16A34A',
    primarySoft: 'rgba(22, 163, 74, 0.12)',
    success: '#16A34A',
    successSoft: 'rgba(22, 163, 74, 0.12)',
    danger: '#DC2626',
    dangerSoft: 'rgba(220, 38, 38, 0.12)',
    warning: '#D97706',
    warningSoft: 'rgba(217, 119, 6, 0.12)',
    accent: '#16A34A',
    accentSoft: 'rgba(22, 163, 74, 0.12)',
    overlay: 'rgba(15, 23, 42, 0.35)',
    white: '#FFFFFF',
    black: '#0F172A',
    headerGradient: ['#FFFFFF', '#EDF3FB'],
    authGradient: ['#F3F6FB', '#EEF3FB', '#FFFFFF'],
    tabBar: '#FFFFFF',
    tabBarBorder: '#D7E2F2',
    input: '#FFFFFF',
  },
};

const ThemeContext = createContext({
  themeMode: 'system',
  resolvedMode: 'dark',
  colors: palettes.dark,
  setThemeMode: () => {},
  isDark: true,
});

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value) => {
        if (value === 'dark' || value === 'light' || value === 'system') {
          setThemeModeState(value);
        }
      })
      .catch(() => {});
  }, []);

  const resolvedMode =
    themeMode === 'system' ? systemColorScheme || 'dark' : themeMode;

  const value = useMemo(() => {
    const colors = palettes[resolvedMode] || palettes.dark;
    return {
      themeMode,
      resolvedMode,
      colors,
      isDark: resolvedMode === 'dark',
      setThemeMode: async (nextMode) => {
        setThemeModeState(nextMode);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
      },
    };
  }, [resolvedMode, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
