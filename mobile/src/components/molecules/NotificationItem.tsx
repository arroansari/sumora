import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../atoms';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing, typography } from '../../theme';
import { MockNotification } from '../../types/models.types';

interface NotificationItemProps {
  notification: MockNotification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { colors } = useAppTheme();

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[typography.subtitle, { color: colors.textPrimary }]}>
          {notification.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {notification.timestamp}
        </Text>
      </View>
      <Text style={[typography.body, styles.body, { color: colors.textSecondary }]}>
        {notification.body}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  body: {
    marginTop: spacing.xs,
  },
});

