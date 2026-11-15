import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, ThemeColors, buildLightColors, buildDarkColors } from '../theme/colors';
import {
  AppThemeId,
  AppThemeOption,
  APP_THEMES,
  DEFAULT_THEME_ID,
  getThemeById,
} from '../theme/appThemes';

const THEME_STORAGE_KEY = 'sumora:theme_mode';
const ACCENT_THEME_KEY = 'sumora:accent_theme_id';

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  // Accent / color theme
  accentTheme: AppThemeOption;
  accentThemeId: AppThemeId;
  setAccentTheme: (id: AppThemeId) => void;
  allThemes: AppThemeOption[];
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setThemeMode: () => {},
  accentTheme: getThemeById(DEFAULT_THEME_ID),
  accentThemeId: DEFAULT_THEME_ID,
  setAccentTheme: () => {},
  allThemes: APP_THEMES,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>('light');
  const [accentThemeId, setAccentThemeIdState] = useState<AppThemeId>(DEFAULT_THEME_ID);

  // Load persisted preferences on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_STORAGE_KEY),
      AsyncStorage.getItem(ACCENT_THEME_KEY),
    ])
      .then(([storedMode, storedAccent]) => {
        if (storedMode === 'light' || storedMode === 'dark') {
          setThemeModeState(storedMode);
        } else {
          setThemeModeState('light');
        }
        const validAccent = APP_THEMES.find((t) => t.id === storedAccent);
        if (validAccent) {
          setAccentThemeIdState(validAccent.id);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeMode = useCallback((mode: 'light' | 'dark' | 'system') => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  }, []);

  const setAccentTheme = useCallback((id: AppThemeId) => {
    setAccentThemeIdState(id);
    AsyncStorage.setItem(ACCENT_THEME_KEY, id).catch(() => {});
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const toggleTheme = useCallback(() => {
    const nextMode = isDark ? 'light' : 'dark';
    setThemeMode(nextMode);
  }, [isDark, setThemeMode]);

  const accentTheme = useMemo(() => getThemeById(accentThemeId), [accentThemeId]);

  const colors = useMemo(
    () => (isDark ? buildDarkColors(accentTheme) : buildLightColors(accentTheme)),
    [isDark, accentTheme]
  );

  const value = useMemo<ThemeContextType>(
    () => ({
      isDark,
      colors,
      toggleTheme,
      setThemeMode,
      accentTheme,
      accentThemeId,
      setAccentTheme,
      allThemes: APP_THEMES,
    }),
    [isDark, colors, toggleTheme, setThemeMode, accentTheme, accentThemeId, setAccentTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => useContext(ThemeContext);
