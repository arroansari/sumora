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
const TEXT_SCALE_KEY = 'sumora:reader_text_scale';

export const MIN_TEXT_SCALE = 0.8;
export const MAX_TEXT_SCALE = 1.4;
export const DEFAULT_TEXT_SCALE = 1.0;

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
  // Reader Typography Scaling
  textScale: number;
  setTextScale: (scale: number | ((prev: number) => number)) => void;
  resetTextScale: () => void;
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
  textScale: DEFAULT_TEXT_SCALE,
  setTextScale: () => {},
  resetTextScale: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>('light');
  const [accentThemeId, setAccentThemeIdState] = useState<AppThemeId>(DEFAULT_THEME_ID);
  const [textScale, setTextScaleState] = useState<number>(DEFAULT_TEXT_SCALE);

  // Load persisted preferences on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_STORAGE_KEY),
      AsyncStorage.getItem(ACCENT_THEME_KEY),
      AsyncStorage.getItem(TEXT_SCALE_KEY),
    ])
      .then(([storedMode, storedAccent, storedScale]) => {
        if (storedMode === 'light' || storedMode === 'dark') {
          setThemeModeState(storedMode);
        } else {
          setThemeModeState('light');
        }
        const validAccent = APP_THEMES.find((t) => t.id === storedAccent);
        if (validAccent) {
          setAccentThemeIdState(validAccent.id);
        }
        if (storedScale) {
          const parsed = parseFloat(storedScale);
          if (!isNaN(parsed) && parsed >= MIN_TEXT_SCALE && parsed <= MAX_TEXT_SCALE) {
            setTextScaleState(Math.round(parsed * 100) / 100);
          }
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

  const setTextScale = useCallback((action: number | ((prev: number) => number)) => {
    setTextScaleState((prev) => {
      const nextRaw = typeof action === 'function' ? action(prev) : action;
      const clamped = Math.max(MIN_TEXT_SCALE, Math.min(MAX_TEXT_SCALE, Math.round(nextRaw * 100) / 100));
      AsyncStorage.setItem(TEXT_SCALE_KEY, clamped.toString()).catch(() => {});
      return clamped;
    });
  }, []);

  const resetTextScale = useCallback(() => {
    setTextScaleState(DEFAULT_TEXT_SCALE);
    AsyncStorage.setItem(TEXT_SCALE_KEY, DEFAULT_TEXT_SCALE.toString()).catch(() => {});
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
      textScale,
      setTextScale,
      resetTextScale,
    }),
    [
      isDark,
      colors,
      toggleTheme,
      setThemeMode,
      accentTheme,
      accentThemeId,
      setAccentTheme,
      textScale,
      setTextScale,
      resetTextScale,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => useContext(ThemeContext);
