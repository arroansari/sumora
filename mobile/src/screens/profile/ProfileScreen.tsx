import React, { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/atoms';
import { createProfileStyles } from './ProfileScreen.styles';

export const ProfileScreen: React.FC = () => {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { user, logout } = useAuth();
  const styles = useMemo(() => createProfileStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage AI preferences and application settings.
        </Text>
      </View>

      <View style={styles.container}>
        <Card>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
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

        <Card>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>Dark Appearance</Text>
              <Text style={styles.settingDesc}>Toggle dark / light mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>AI Summarization Architecture</Text>
          <Text style={styles.prefHint}>
            Active engine: Pluggable Grounded Summarizer
          </Text>
          <Text style={styles.prefHint}>
            Format: Structured 7-section grounded summaries
          </Text>
        </Card>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sumora Mobile v1.0.0 (Bare React Native CLI)
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};
