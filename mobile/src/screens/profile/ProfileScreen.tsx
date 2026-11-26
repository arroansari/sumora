import React, { useMemo } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwatchPicker } from '../../components/atoms/ThemeSwatchPicker';
import { createProfileStyles } from './ProfileScreen.styles';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
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
  const { user, logout, deleteAccount } = useAuth();
  const styles = useMemo(
    () => createProfileStyles(colors, accentTheme, textScale, insets),
    [colors, accentTheme, textScale, insets]
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
            try { await deleteAccount(); }
            catch (err: any) { Alert.alert('Error', err?.message || 'Failed. Try again.'); }
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

  const presets = [
    { label: '85%', value: 0.85 },
    { label: '100%', value: 1.0 },
    { label: '115%', value: 1.15 },
    { label: '130%', value: 1.3 },
    { label: '140%', value: 1.4 },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ════════════════════════════════════════════════════════
          GRADIENT HERO — uses header image for gradient themes,
          falls back to solid tone1 for two-tone themes
      ════════════════════════════════════════════════════════ */}
      <ImageBackground
        source={accentTheme.assets.header ?? undefined}
        style={[styles.heroBanner, { paddingTop: insets.top + 16 }]}
        imageStyle={{ resizeMode: 'cover' }}>

        {/* Dark overlay so text is always readable */}
        <View style={styles.heroOverlay} />

        {/* Top label row */}
        <View style={[styles.heroTopRow, { zIndex: 1 }]}>
          <Text style={styles.heroScreenLabel}>Profile & Settings</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>✦ PRO</Text>
          </View>
        </View>

        {/* Avatar + identity */}
        <View style={[styles.heroIdentityRow, { zIndex: 1 }]}>
          <View style={styles.heroAvatarRing}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarLetter}>{avatarLetter}</Text>
            </View>
          </View>

          <View style={styles.heroIdentityText}>
            <Text style={styles.heroUsername}>{username}</Text>
            <Text style={styles.heroEmail}>{user?.email || 'Logged in'}</Text>
            {/* Active theme pill */}
            <View style={styles.heroThemePill}>
              <View style={[styles.heroThemeDot, { backgroundColor: accentTheme.primary }]} />
              <Text style={styles.heroThemePillText}>{accentTheme.label}</Text>
            </View>
          </View>
        </View>

        {/* Stats strip */}
        <View style={[styles.heroStats, { zIndex: 1 }]}>
          <View style={styles.heroStatBlock}>
            <Text style={styles.heroStatNum}>391</Text>
            <Text style={styles.heroStatLbl}>Channels</Text>
          </View>
          <View style={styles.heroStatSep} />
          <View style={styles.heroStatBlock}>
            <Text style={styles.heroStatNum}>6</Text>
            <Text style={styles.heroStatLbl}>Active</Text>
          </View>
          <View style={styles.heroStatSep} />
          <View style={styles.heroStatBlock}>
            <Text style={styles.heroStatNum}>AI</Text>
            <Text style={styles.heroStatLbl}>Powered</Text>
          </View>
          <View style={styles.heroStatSep} />
          <View style={styles.heroStatBlock}>
            <Text style={styles.heroStatNum}>{percentage}%</Text>
            <Text style={styles.heroStatLbl}>Text Size</Text>
          </View>
        </View>
      </ImageBackground>

      {/* ════════════════════════════════════════════════════════
          CONTENT SCROLL AREA
      ════════════════════════════════════════════════════════ */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

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
            <View style={{ flex: 1 }}>
              <View style={styles.typographyHeader}>
                <Text style={styles.settingTitle}>Text Scale</Text>
                <View style={[styles.scaleBadge, { backgroundColor: accentTheme.badgeBg }]}>
                  <Text style={[styles.scaleBadgeText, { color: accentTheme.badgeText }]}>
                    {percentage}%
                  </Text>
                </View>
              </View>
              <View style={styles.presetRow}>
                {presets.map((p) => (
                  <TouchableOpacity
                    key={p.label}
                    style={[
                      styles.presetPill,
                      textScale === p.value && {
                        backgroundColor: accentTheme.badgeBg,
                        borderColor: accentTheme.primary,
                      },
                    ]}
                    onPress={() => setTextScale(p.value)}
                    activeOpacity={0.75}>
                    <Text
                      style={[
                        styles.presetPillText,
                        textScale === p.value && { color: accentTheme.primary, fontFamily: 'PlusJakartaSans-ExtraBold' },
                      ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.stepRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setTextScale((v) => Math.max(0.8, Math.round((v - 0.05) * 100) / 100))}
                  activeOpacity={0.75}>
                  <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>A−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: accentTheme.badgeBg, borderColor: accentTheme.badgeBg }]}
                  onPress={resetTextScale}
                  activeOpacity={0.75}>
                  <Text style={[styles.stepBtnText, { color: accentTheme.badgeText }]}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setTextScale((v) => Math.min(1.4, Math.round((v + 0.05) * 100) / 100))}
                  activeOpacity={0.75}>
                  <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>
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
              textScale={textScale}
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
              <Text style={styles.settingDesc}>Pluggable Grounded Summarizer · 7-section format</Text>
            </View>
          </View>

          <View style={[styles.settingCard, styles.settingCardLast]}>
            <View style={[styles.settingIcon, { backgroundColor: '#032541', borderRadius: 10 }]}>
              <Text style={{ color: '#01B4E4', fontWeight: '900', fontSize: 11 }}>TMDB</Text>
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Third-Party APIs</Text>
              <Text style={styles.settingDesc}>TMDB · Open Library API · YouTube Data API</Text>
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
            <View style={styles.settingIcon}><Text style={styles.settingIconText}>🔒</Text></View>
            <View style={styles.settingBody}><Text style={styles.settingTitle}>Privacy Policy</Text></View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingCard, styles.settingCardLast]}
            onPress={() => handleOpenLink('https://sumora.app/terms')}
            activeOpacity={0.7}>
            <View style={styles.settingIcon}><Text style={styles.settingIconText}>📄</Text></View>
            <View style={styles.settingBody}><Text style={styles.settingTitle}>Terms of Service & EULA</Text></View>
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
      </ScrollView>
    </View>
  );
};
