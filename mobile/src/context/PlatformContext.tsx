import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PlatformMode = 'YOUTUBE' | 'REDDIT';

interface PlatformContextValue {
  activePlatform: PlatformMode;
  setActivePlatform: (platform: PlatformMode) => void;
  togglePlatform: () => void;
  isReddit: boolean;
  isYouTube: boolean;
}

const PLATFORM_STORAGE_KEY = 'sumora:active_platform_mode';

const PlatformContext = createContext<PlatformContextValue>({
  activePlatform: 'YOUTUBE',
  setActivePlatform: () => {},
  togglePlatform: () => {},
  isReddit: false,
  isYouTube: true,
});

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePlatform, setActivePlatformState] = useState<PlatformMode>('YOUTUBE');

  useEffect(() => {
    AsyncStorage.getItem(PLATFORM_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'YOUTUBE' || saved === 'REDDIT') {
          setActivePlatformState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setActivePlatform = useCallback((platform: PlatformMode) => {
    setActivePlatformState(platform);
    AsyncStorage.setItem(PLATFORM_STORAGE_KEY, platform).catch(() => {});
  }, []);

  const togglePlatform = useCallback(() => {
    setActivePlatformState((prev) => {
      const next: PlatformMode = prev === 'YOUTUBE' ? 'REDDIT' : 'YOUTUBE';
      AsyncStorage.setItem(PLATFORM_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      activePlatform,
      setActivePlatform,
      togglePlatform,
      isReddit: activePlatform === 'REDDIT',
      isYouTube: activePlatform === 'YOUTUBE',
    }),
    [activePlatform, setActivePlatform, togglePlatform]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
};

export const usePlatform = (): PlatformContextValue => useContext(PlatformContext);
