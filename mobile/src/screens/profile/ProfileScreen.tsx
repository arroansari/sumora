import React, { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/atoms/Card';
import { ThemeSwatchPicker } from '../../components/atoms/ThemeSwatchPicker';
import { createProfileStyles } from './ProfileScreen.styles';

export const ProfileScreen: React.FC = () => {
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
  const styles = useMemo(() => createProfileStyles(colors, textScale), [colors, textScale]);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all associated data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open link', `Please visit ${url} in your browser.`);
    });
  };

  const percentage = Math.round(textScale * 100);

  const presets = [
    { label: '85%', value: 0.85 },
    { label: '100%', value: 1.0 },
    { label: '115%', value: 1.15 },
    { label: '130%', value: 1.3 },
    { label: '140%', value: 1.4 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage preferences and application settings.
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>

        {/* ── User Info Card ── */}
        <Card>
          <View style={styles.userRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.email ? user.email.split('@')[0] : 'Sumora User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || 'Logged in'}</Text>
            </View>
          </View>
        </Card>

        {/* ── Light / Dark Mode Toggle ── */}
        <Card>
          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>
                {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </Text>
              <Text style={styles.settingDesc}>
                {isDark ? 'Dark Premium Editorial' : 'Vibrant Modern Intelligence'}
              </Text>
            </View>
            <View style={[styles.switchContainer, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}>
              <Text style={styles.switchModeIcon}>{isDark ? '🌙' : '☀️'}</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#94A3B8', true: colors.primary }}
                ios_backgroundColor="#94A3B8"
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </Card>

        {/* ── Colour / Accent Theme Section ── */}
        <Card>
          <ThemeSwatchPicker
            themes={allThemes}
            activeThemeId={accentThemeId}
            onSelectTheme={setAccentTheme}
            colors={colors}
            textScale={textScale}
          />
        </Card>

        {/* ── Reading Typography & Text Scaling ── */}
        <Card>
          <View style={styles.textScaleHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Reading Typography Size</Text>
              <Text style={styles.prefHint}>
                Scales summaries up or down for high visual comfort.
              </Text>
            </View>
            <View
              style={[
                styles.textScaleBadge,
                { backgroundColor: accentTheme.badgeBg },
              ]}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.textScaleBadgeText,
                  { color: accentTheme.badgeText },
                ]}>
                {percentage}%
              </Text>
            </View>
          </View>

          {/* Stepped Preset Pills */}
          <View style={styles.presetRow}>
            {presets.map((preset) => {
              const active = Math.abs(textScale - preset.value) < 0.03;
              return (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.presetPill,
                    active && [
                      styles.presetPillActive,
                      {
                        borderColor: accentTheme.primary,
                        backgroundColor: accentTheme.badgeBg,
                      },
                    ],
                  ]}
                  onPress={() => setTextScale(preset.value)}
                  activeOpacity={0.75}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.presetPillText,
                      active && [
                        styles.presetPillTextActive,
                        { color: accentTheme.badgeText },
                      ],
                    ]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Live Dynamic Preview Card */}
          <View
            style={[
              styles.textPreviewCard,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.borderSubtle,
              },
            ]}>
            <Text style={styles.previewBodyText}>
              Sumora distills complex video knowledge into concise, grounded takeaways designed for maximum visual retention and deep intellect.
            </Text>
          </View>

          {/* Incremental Steppers */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setTextScale((prev) => Math.max(0.8, Math.round((prev - 0.05) * 100) / 100))}
              activeOpacity={0.75}>
              <Text allowFontScaling={false} style={styles.stepperBtnText}>A- Smaller</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stepperBtn, { backgroundColor: accentTheme.badgeBg, borderColor: accentTheme.badgeBg }]}
              onPress={resetTextScale}
              activeOpacity={0.75}>
              <Text allowFontScaling={false} style={[styles.stepperBtnText, { color: accentTheme.badgeText }]}>100% Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setTextScale((prev) => Math.min(1.4, Math.round((prev + 0.05) * 100) / 100))}
              activeOpacity={0.75}>
              <Text allowFontScaling={false} style={styles.stepperBtnText}>A+ Larger</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* ── Summarization Info Card ── */}
        <Card>
          <Text style={styles.sectionTitle}>Summarization Architecture</Text>
          <Text style={styles.prefHint}>
            Active engine: Pluggable Grounded Summarizer
          </Text>
          <Text style={styles.prefHint}>
            Format: Structured 7-section grounded summaries
          </Text>
        </Card>

        {/* ── App Store Compliance & Third-Party Attributions ── */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                backgroundColor: '#032541',
                borderRadius: 8,
                paddingHorizontal: 9,
                paddingVertical: 4,
                marginRight: 10,
              }}>
              <Text style={{ color: '#01B4E4', fontWeight: '900', fontSize: 11.5, letterSpacing: 0.8 }}>
                TMDB
              </Text>
            </View>
            <Text style={styles.sectionTitle}>Third-Party Attributions</Text>
          </View>
          <Text style={styles.prefHint}>
            This application uses the TMDB API but is not endorsed or certified by TMDB.
          </Text>
          <Text style={[styles.prefHint, { marginTop: 4 }]}>
            Book insights and metadata powered by the open, public Open Library API.
          </Text>
        </Card>

        {/* ── Legal & Policies ── */}
        <Card>
          <Text style={styles.sectionTitle}>Legal & Privacy</Text>
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => handleOpenLink('https://sumora.app/privacy')}
            activeOpacity={0.7}>
            <Text style={styles.legalText}>Privacy Policy</Text>
            <Text style={styles.legalArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.legalRow, { borderBottomWidth: 0 }]}
            onPress={() => handleOpenLink('https://sumora.app/terms')}
            activeOpacity={0.7}>
            <Text style={styles.legalText}>Terms of Service & EULA</Text>
            <Text style={styles.legalArrow}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* ── Sign Out ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* ── Delete Account ── */}
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}>
          <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sumora Mobile v1.0.0 (Bare React Native CLI)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
