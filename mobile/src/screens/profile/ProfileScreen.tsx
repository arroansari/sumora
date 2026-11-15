import React, { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
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
  const { user, logout } = useAuth();
  const styles = useMemo(() => createProfileStyles(colors), [colors]);

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
            <Text
              style={{
                fontSize: Math.round(15 * textScale),
                lineHeight: Math.round(23 * textScale),
                color: colors.textPrimary,
                fontFamily: 'PlusJakartaSans-Medium',
              }}>
              Sumora distills complex video knowledge into concise, grounded takeaways designed for maximum visual retention and deep intellect.
            </Text>
          </View>

          {/* Incremental Steppers */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setTextScale((prev) => Math.max(0.8, Math.round((prev - 0.05) * 100) / 100))}
              activeOpacity={0.75}>
              <Text style={styles.stepperBtnText}>A- Smaller</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stepperBtn, { backgroundColor: accentTheme.badgeBg, borderColor: accentTheme.badgeBg }]}
              onPress={resetTextScale}
              activeOpacity={0.75}>
              <Text style={[styles.stepperBtnText, { color: accentTheme.badgeText }]}>100% Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setTextScale((prev) => Math.min(1.4, Math.round((prev + 0.05) * 100) / 100))}
              activeOpacity={0.75}>
              <Text style={styles.stepperBtnText}>A+ Larger</Text>
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

        {/* ── Sign Out ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
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
