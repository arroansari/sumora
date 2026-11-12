import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button } from '../atoms';
import { useAppTheme } from '../../context/ThemeContext';
import { borderRadius, spacing, typography } from '../../theme';
import { MockChannel } from '../../types/models.types';

interface SourceItemProps {
  channel: MockChannel;
  onToggleFollow: () => void;
}

export const SourceItem: React.FC<SourceItemProps> = ({ channel, onToggleFollow }) => {
  const { colors } = useAppTheme();

  return (
    <Card>
      <View style={styles.container}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle }]}>
          <Text style={[typography.h3, { color: colors.primary }]}>
            {channel.name.slice(0, 1)}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={[typography.subtitle, { color: colors.textPrimary }]}>{channel.name}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {channel.subscriberCount} • {channel.category}
          </Text>
        </View>

        <Button
          title={channel.connected ? 'Following' : 'Follow'}
          variant={channel.connected ? 'outline' : 'primary'}
          onPress={onToggleFollow}
          style={styles.button}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  button: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
});

