import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Badge } from '../atoms';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing, typography } from '../../theme';
import { MockSummary } from '../../types/models.types';

interface SummaryCardProps {
  summary: MockSummary;
  onPress: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, onPress }) => {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card>
        <View style={styles.headerRow}>
          <Badge label={summary.category} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {summary.readingTimeMinutes} min read • {summary.publishedAgo}
          </Text>
        </View>

        <Text style={[typography.h3, styles.title, { color: colors.textPrimary }]}>
          {summary.videoTitle}
        </Text>

        <Text style={[typography.caption, styles.channel, { color: colors.secondary }]}>
          {summary.channelName} • {summary.source}
        </Text>

        <Text
          numberOfLines={2}
          style={[typography.body, styles.headline, { color: colors.textSecondary }]}>
          {summary.headline}
        </Text>

        <View style={[styles.pointsContainer, { borderTopColor: colors.border }]}>
          {summary.keyPoints.slice(0, 2).map((pt: string, idx: number) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
              <Text
                numberOfLines={1}
                style={[typography.caption, styles.pointText, { color: colors.textSecondary }]}>
                {pt}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    marginTop: spacing.xs,
  },
  channel: {
    marginVertical: spacing.xs,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontWeight: '600',
  },
  headline: {
    marginVertical: spacing.xs,
  },
  pointsContainer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  bullet: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  pointText: {
    flex: 1,
  },
});

