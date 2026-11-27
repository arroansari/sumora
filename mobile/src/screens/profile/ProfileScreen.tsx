import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  Animated,
  Alert,
  Linking,
  StatusBar,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { sourcesApi, redditApi } from '../../services/api';
import { SpaceType, TrackedSource } from '../../types/models.types';
import { RootTabParamList } from '../../types/navigation.types';
import { SpaceIcon } from '../../components/atoms/SpaceIcon';
import { ThemeSwatchPicker } from '../../components/atoms/ThemeSwatchPicker';
import { TextScaleSlider } from '../../components/atoms/TextScaleSlider';
import { createProfileStyles } from './ProfileScreen.styles';

const TRACKED_BOOKS_STORAGE_KEY = 'sumora:tracked_book_authors';
const TRACKED_CINEMA_STORAGE_KEY = 'sumora:tracked_cinema_sources';
const DEFAULT_BOOKS_COUNT = 8;
const DEFAULT_CINEMA_COUNT = 6;

const SPACE_META: Array<{
  id: SpaceType;
  shortLabel: string;
  fullLabel: string;
  unit: string;
}> = [
  { id: 'YOUTUBE', shortLabel: 'Videos', fullLabel: 'YouTube Videos', unit: 'ch' },
  { id: 'REDDIT', shortLabel: 'Reddit', fullLabel: 'Reddit Threads', unit: 'subs' },
  { id: 'TMDB', shortLabel: 'Cinema', fullLabel: 'Cinema & OTT', unit: 'lists' },
  { id: 'OPEN_LIBRARY', shortLabel: 'Books', fullLabel: 'Book Insights', unit: 'picks' },
];

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const {
    colors,
    isDark,
    toggleTheme,
    accentTheme,
    accentThemeId,
    setAccentTheme,
    allThemes,
    textScale,
    setTextScale,
    resetTextScale,
  } = useAppTheme();
  const { user, isAuthenticated, logout, deleteAccount } = useAuth();
  const { activeSpace, setActiveSpace } = usePlatform();

  const [isSlidingScale, setIsSlidingScale] = useState(false);
  const [isScrubbingTheme, setIsScrubbingTheme] = useState(false);
  const [isCompactSticky, setIsCompactSticky] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [spaceCounts, setSpaceCounts] = useState<Record<SpaceType, number>>({
    YOUTUBE: 0,
    REDDIT: 0,
    TMDB: DEFAULT_CINEMA_COUNT,
    OPEN_LIBRARY: DEFAULT_BOOKS_COUNT,
  });

  const styles = useMemo(
    () => createProfileStyles(colors, accentTheme, textScale, insets),
    [colors, accentTheme, textScale, insets]
  );

  // Refresh live tracked counts across all 4 Sumora knowledge spaces
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadSpaceCounts() {
        try {
          const [rawBooks, rawCinema] = await Promise.all([
            AsyncStorage.getItem(TRACKED_BOOKS_STORAGE_KEY).catch(() => null),
            AsyncStorage.getItem(TRACKED_CINEMA_STORAGE_KEY).catch(() => null),
          ]);

          let booksCount = DEFAULT_BOOKS_COUNT;
          if (rawBooks) {
            try {
              const parsed = JSON.parse(rawBooks);
              if (Array.isArray(parsed) && parsed.length > 0) booksCount = parsed.length;
            } catch {}
          }

          let cinemaCount = DEFAULT_CINEMA_COUNT;
          if (rawCinema) {
            try {
              const parsed = JSON.parse(rawCinema);
              if (Array.isArray(parsed) && parsed.length > 0) cinemaCount = parsed.length;
            } catch {}
          }

          let ytCount = 0;
          let redditCount = 0;
          if (isAuthenticated) {
            const [allSources, redditSubs] = await Promise.all([
              sourcesApi.list().catch(() => [] as TrackedSource[]),
              redditApi.listSources().catch(() => [] as TrackedSource[]),
            ]);
            if (Array.isArray(allSources)) {
              ytCount = allSources.filter(
                (s) => s.platform !== 'reddit' && s.platform !== 'books' && s.platform !== 'cinema'
              ).length;
            }
            if (Array.isArray(redditSubs)) {
              redditCount = redditSubs.length;
            }
          }

          if (mounted) {
            setSpaceCounts({
              YOUTUBE: ytCount,
              REDDIT: redditCount,
              TMDB: cinemaCount,
              OPEN_LIBRARY: booksCount,
            });
          }
        } catch {}
      }

      loadSpaceCounts();

      return () => {
        mounted = false;
      };
    }, [isAuthenticated])
  );

  const handleSpacePress = useCallback(
    (space: SpaceType) => {
      setActiveSpace(space);
      navigation.navigate('Home');
    },
    [setActiveSpace, navigation]
  );

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Permanently delete your account and all data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed. Try again.');
            }
          },
        },
      ]
    );
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Unable to open link', `Visit ${url} in your browser.`)
    );
  };

  const percentage = Math.round(textScale * 100);
  const username = user?.email ? user.email.split('@')[0] : 'Sumora User';
  const avatarLetter = user?.email?.charAt(0).toUpperCase() || 'U';
  const memberYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;
  const memberLabel =
    memberYear && !isNaN(memberYear) ? `Since ${memberYear}` : 'Member';

  const activeSpaceMeta =
    SPACE_META.find((s) => s.id === activeSpace) || SPACE_META[0];
  const totalTracked =
    spaceCounts.YOUTUBE +
    spaceCounts.REDDIT +
    spaceCounts.TMDB +
    spaceCounts.OPEN_LIBRARY;

  const heroFadeOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [45, 145],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const compactBarOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [85, 145],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const compactBarTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [85, 145],
        outputRange: [-10, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
          useNativeDriver: true,
          listener: (e: any) => {
            const y = e?.nativeEvent?.contentOffset?.y ?? 0;
            const compact = y >= 100;
            setIsCompactSticky((prev) => (prev !== compact ? compact : prev));
          },
        }
      ),
    [scrollY]
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ════════════════════════════════════════════════════════
          COLLAPSING STICKY MINI BAR (Appears smoothly on scroll)
      ════════════════════════════════════════════════════════ */}
      <Animated.View
        pointerEvents={isCompactSticky ? 'auto' : 'none'}
        style={[
          styles.stickyCompactBar,
          {
            paddingTop: insets.top + 6,
            opacity: compactBarOpacity,
            transform: [{ translateY: compactBarTranslateY }],
          },
        ]}>
        <ImageBackground
          source={accentTheme.assets.header ?? undefined}
          style={StyleSheet.absoluteFill}
          imageStyle={{ resizeMode: 'cover' }}>
          <View style={styles.heroOverlay} />
        </ImageBackground>

        <View style={styles.stickyCompactInner}>
          <View style={styles.stickyUserLeft}>
            <View style={styles.stickyMiniAvatar}>
              <Text style={styles.stickyMiniAvatarText}>{avatarLetter}</Text>
            </View>
            <View style={styles.stickyUserTextWrap}>
              <Text style={styles.stickyUsername} numberOfLines={1}>
                {username}
              </Text>
              <Text style={styles.stickySubmeta} numberOfLines={1}>
                {activeSpaceMeta.shortLabel} · {percentage}%
              </Text>
            </View>
          </View>

          <View style={styles.stickySpacesRow}>
            {SPACE_META.map((space) => {
              const isSelected = space.id === activeSpace;
              return (
                <TouchableOpacity
                  key={`sticky_${space.id}`}
                  onPress={() => handleSpacePress(space.id)}
                  activeOpacity={0.75}
                  style={[
                    styles.stickySpacePill,
                    isSelected && styles.stickySpacePillActive,
                  ]}>
                  <SpaceIcon space={space.id} size={15} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* ════════════════════════════════════════════════════════
          SINGLE UNIFIED SCROLL PAGE (Hero morphs into sticky bar)
      ════════════════════════════════════════════════════════ */}
      <Animated.ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        scrollEnabled={!isSlidingScale && !isScrubbingTheme}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}>
        {/* ════════════════════════════════════════════════════════
            EXECUTIVE MULTI-DOMAIN HERO HEADER
        ════════════════════════════════════════════════════════ */}
        <Animated.View style={{ opacity: heroFadeOpacity }}>
          <ImageBackground
            source={accentTheme.assets.header ?? undefined}
            style={[styles.heroBanner, { paddingTop: insets.top + 10 }]}
            imageStyle={{ resizeMode: 'cover' }}>
          <View style={styles.heroOverlay} />
          <View pointerEvents="none" style={styles.heroGlowOrbTop} />
          <View pointerEvents="none" style={styles.heroGlowOrbBottom} />

          {/* Identity row — profile icon anchored top-left */}
          <View style={styles.heroIdentityRow}>
            <View style={styles.heroAvatarWrap}>
              <View style={styles.heroAvatarFrame}>
                <View style={styles.heroAvatar}>
                  <Text style={styles.heroAvatarLetter}>{avatarLetter}</Text>
                </View>
              </View>
              <View style={styles.heroAvatarSpaceBadge}>
                <SpaceIcon space={activeSpace} size={15} />
              </View>
            </View>

            <View style={styles.heroIdentityText}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroUsername} numberOfLines={1}>
                  {username}
                </Text>
                <View style={styles.heroMemberTag}>
                  <Text style={styles.heroMemberTagText}>{memberLabel}</Text>
                </View>
              </View>
              <Text style={styles.heroEmail} numberOfLines={1}>
                {user?.email || 'Logged in'}
              </Text>
              <View style={styles.heroMetaLine}>
                <View style={styles.heroLiveDot} />
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {activeSpaceMeta.fullLabel} · {percentage}% Text Scale
                </Text>
              </View>
            </View>
          </View>

          {/* Compact 4-Space Knowledge Dock */}
          <View style={styles.spacesDock}>
            {SPACE_META.map((space) => {
              const isSelected = space.id === activeSpace;
              const count = spaceCounts[space.id];
              const metricLabel =
                count > 0 ? `${count} ${space.unit}` : isSelected ? 'Active' : 'Ready';

              return (
                <TouchableOpacity
                  key={space.id}
                  onPress={() => handleSpacePress(space.id)}
                  activeOpacity={0.78}
                  style={[
                    styles.spaceTile,
                    isSelected && styles.spaceTileActive,
                  ]}>
                  <View style={styles.spaceTileHeader}>
                    <SpaceIcon space={space.id} size={18} />
                    {isSelected && <View style={styles.spaceActivePip} />}
                  </View>
                  <Text style={styles.spaceTileName} numberOfLines={1}>
                    {space.shortLabel}
                  </Text>
                  <Text
                    style={[
                      styles.spaceTileMetric,
                      isSelected && styles.spaceTileMetricActive,
                    ]}
                    numberOfLines={1}>
                    {metricLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.dockHintText}>
            Tap a space to jump to its feed · {totalTracked} sources & lists tracked
          </Text>
          </ImageBackground>
        </Animated.View>
        {/* ── Appearance ── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.groupLabel}>APPEARANCE</Text>

          <View style={[styles.settingCard, styles.settingCardOnly]}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingIconText}>{isDark ? '🌙' : '☀️'}</Text>
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={styles.settingDesc}>Vibrant Modern Intelligence</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              thumbColor={accentTheme.primary}
              trackColor={{ false: colors.border, true: accentTheme.primary + '55' }}
            />
          </View>
        </View>

        {/* ── Typography ── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.groupLabel}>TYPOGRAPHY</Text>

          <View style={[styles.settingCard, styles.settingCardOnly]}>
            <TextScaleSlider
              textScale={textScale}
              onChangeScale={setTextScale}
              onResetScale={resetTextScale}
              accentTheme={accentTheme}
              colors={colors}
              onSlidingChange={setIsSlidingScale}
            />
          </View>
        </View>

        {/* ── Theme System ── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.groupLabel}>THEME & COLOR IDENTITY</Text>
          <View style={[styles.settingCard, styles.settingCardOnly]}>
            <ThemeSwatchPicker
              themes={allThemes}
              activeThemeId={accentThemeId}
              onSelectTheme={setAccentTheme}
              colors={colors}
              isDark={isDark}
              textScale={textScale}
              onSlidingChange={setIsScrubbingTheme}
            />
          </View>
        </View>

        {/* ── App Info ── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.groupLabel}>SYSTEM</Text>

          <View style={[styles.settingCard, styles.settingCardFirst]}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingIconText}>🤖</Text>
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>AI Engine</Text>
              <Text style={styles.settingDesc}>Pluggable Grounded Summarizer · 4 Knowledge Spaces</Text>
            </View>
          </View>

          <View style={[styles.settingCard, styles.settingCardLast]}>
            <View style={[styles.settingIcon, { backgroundColor: '#032541', borderRadius: 10 }]}>
              <Text style={{ color: '#01B4E4', fontWeight: '900', fontSize: 11 }}>TMDB</Text>
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Third-Party APIs</Text>
              <Text style={styles.settingDesc}>YouTube · Reddit · TMDB · Open Library API</Text>
            </View>
          </View>
        </View>

        {/* ── Legal ── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.groupLabel}>LEGAL</Text>

          <TouchableOpacity
            style={[styles.settingCard, styles.settingCardFirst]}
            onPress={() => handleOpenLink('https://sumora.app/privacy')}
            activeOpacity={0.7}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingIconText}>🔒</Text>
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingCard, styles.settingCardLast]}
            onPress={() => handleOpenLink('https://sumora.app/terms')}
            activeOpacity={0.7}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingIconText}>📄</Text>
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Terms of Service & EULA</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Account ── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.groupLabel}>ACCOUNT</Text>

          <TouchableOpacity
            style={[styles.settingCard, styles.settingCardOnly]}
            onPress={logout}
            activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: '#FEF2F2' }]}>
              <Text style={styles.settingIconText}>🚪</Text>
            </View>
            <View style={styles.settingBody}>
              <Text style={[styles.settingTitle, { color: colors.danger }]}>Sign Out</Text>
            </View>
            <Text style={[styles.settingArrow, { color: colors.danger }]}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Sumora v1.0.0 · Made with ✦</Text>

        <View style={{ height: insets.bottom + 16 }} />
      </Animated.ScrollView>
    </View>
  );
};
