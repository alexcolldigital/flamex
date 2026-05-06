import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

const THEME_STORAGE_KEY = 'themeMode';

const palettes = {
  dark: {
    mode: 'dark',
    background: '#0a0f1f',
    backgroundAlt: '#10182d',
    surface: '#121a30',
    surfaceMuted: '#17213b',
    card: '#1a2440',
    cardAlt: '#0f172b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#23314f',
    primary: '#f59e0b',
    primarySoft: 'rgba(245, 158, 11, 0.16)',
    success: '#22c55e',
    successSoft: 'rgba(34, 197, 94, 0.16)',
    danger: '#ef4444',
    dangerSoft: 'rgba(239, 68, 68, 0.16)',
    accent: '#60a5fa',
    accentSoft: 'rgba(96, 165, 250, 0.16)',
    overlay: 'rgba(4, 9, 20, 0.84)',
    white: '#ffffff',
    black: '#020617',
    headerGradient: ['#0a0f1f', '#16213a'],
    authGradient: ['#0a0f1f', '#16213a', '#0a0f1f'],
    tabBar: '#111a31',
    tabBarBorder: '#23314f',
    input: '#0f172b'
  },
  light: {
    mode: 'light',
    background: '#f3f6fb',
    backgroundAlt: '#e8eef8',
    surface: '#ffffff',
    surfaceMuted: '#f7f9fd',
    card: '#ffffff',
    cardAlt: '#eef3fb',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#d7e2f2',
    primary: '#d97706',
    primarySoft: 'rgba(217, 119, 6, 0.12)',
    success: '#16a34a',
    successSoft: 'rgba(22, 163, 74, 0.12)',
    danger: '#dc2626',
    dangerSoft: 'rgba(220, 38, 38, 0.12)',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    overlay: 'rgba(15, 23, 42, 0.35)',
    white: '#ffffff',
    black: '#0f172a',
    headerGradient: ['#ffffff', '#edf3fb'],
    authGradient: ['#fffaf0', '#eef3fb', '#ffffff'],
    tabBar: '#ffffff',
    tabBarBorder: '#d7e2f2',
    input: '#ffffff'
  }
};

const ThemeContext = createContext({
  themeMode: 'system',
  resolvedMode: 'dark',
  colors: palettes.dark,
  setThemeMode: () => {},
  isDark: true
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
      }
    };
  }, [resolvedMode, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
