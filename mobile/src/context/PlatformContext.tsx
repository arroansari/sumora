import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpaceType } from '../types/models.types';

export type PlatformMode = 'YOUTUBE' | 'REDDIT';

interface PlatformContextValue {
  activeSpace: SpaceType;
  setActiveSpace: (space: SpaceType) => void;
  activePlatform: PlatformMode;
  setActivePlatform: (platform: PlatformMode) => void;
  togglePlatform: () => void;
  isYouTube: boolean;
  isReddit: boolean;
  isCinema: boolean;
  isBooks: boolean;
}

const SPACE_STORAGE_KEY = 'sumora:active_space_mode';
const PLATFORM_STORAGE_KEY = 'sumora:active_platform_mode';

const PlatformContext = createContext<PlatformContextValue>({
  activeSpace: 'YOUTUBE',
  setActiveSpace: () => {},
  activePlatform: 'YOUTUBE',
  setActivePlatform: () => {},
  togglePlatform: () => {},
  isYouTube: true,
  isReddit: false,
  isCinema: false,
  isBooks: false,
});

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSpace, setActiveSpaceState] = useState<SpaceType>('OPEN_LIBRARY');

  useEffect(() => {
    AsyncStorage.getItem(SPACE_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'YOUTUBE' || saved === 'REDDIT' || saved === 'TMDB' || saved === 'OPEN_LIBRARY') {
          setActiveSpaceState(saved as SpaceType);
        }
      })
      .catch(() => {});
  }, []);

  const setActiveSpace = useCallback((space: SpaceType) => {
    setActiveSpaceState(space);
    AsyncStorage.setItem(SPACE_STORAGE_KEY, space).catch(() => {});
    const legacyPlatform: PlatformMode = space === 'REDDIT' ? 'REDDIT' : 'YOUTUBE';
    AsyncStorage.setItem(PLATFORM_STORAGE_KEY, legacyPlatform).catch(() => {});
  }, []);

  const setActivePlatform = useCallback((platform: PlatformMode) => {
    const space: SpaceType = platform === 'REDDIT' ? 'REDDIT' : 'YOUTUBE';
    setActiveSpace(space);
  }, [setActiveSpace]);

  const togglePlatform = useCallback(() => {
    setActiveSpaceState((prev) => {
      const next: SpaceType = prev === 'YOUTUBE' ? 'REDDIT' : 'YOUTUBE';
      AsyncStorage.setItem(SPACE_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const activePlatform: PlatformMode = activeSpace === 'REDDIT' ? 'REDDIT' : 'YOUTUBE';

  const value = useMemo(
    () => ({
      activeSpace,
      setActiveSpace,
      activePlatform,
      setActivePlatform,
      togglePlatform,
      isYouTube: activeSpace === 'YOUTUBE',
      isReddit: activeSpace === 'REDDIT',
      isCinema: activeSpace === 'TMDB',
      isBooks: activeSpace === 'OPEN_LIBRARY',
    }),
    [activeSpace, setActiveSpace, activePlatform, setActivePlatform, togglePlatform]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
};

export const usePlatform = (): PlatformContextValue => useContext(PlatformContext);
