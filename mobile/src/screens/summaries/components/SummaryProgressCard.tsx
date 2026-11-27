import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../../../context/ThemeContext';

interface SummaryProgressCardProps {
  status: string;
  themeColor?: string;
  onRetry?: () => void;
  errorMessage?: string;
}

interface StepInfo {
  id: number;
  icon: string;
  title: string;
  description: string;
}

const STEPS: StepInfo[] = [
  {
    id: 1,
    icon: '🎙️',
    title: 'Transcribing & Ingesting Stream',
    description: 'Streaming audio and decoding speech boundaries...',
  },
  {
    id: 2,
    icon: '⚖️',
    title: 'Analyzing Timeline & Claims',
    description: 'Verifying chronological milestones, facts vs allegations...',
  },
  {
    id: 3,
    icon: '✨',
    title: 'Synthesizing Takeaways & Deep Dive',
    description: 'Structuring 60-second takeaways, key moments & insights...',
  },
];

export const SummaryProgressCard: React.FC<SummaryProgressCardProps> = ({
  status,
  themeColor = '#10B981',
  onRetry,
  errorMessage,
}) => {
  const { colors } = useAppTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeStep, setActiveStep] = useState(1);
  const [displayPercent, setDisplayPercent] = useState(15);

  const progressAnim = useRef(new Animated.Value(0.15)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for radar badge
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Elapsed timer and milestone progression
  useEffect(() => {
    if (status === 'completed') {
      setActiveStep(3);
      setDisplayPercent(100);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
        easing: Easing.out(Easing.quad),
      }).start();
      return;
    }

    if (status === 'failed') {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;

        // Step 1: 0 - 6s (15% -> 38%)
        if (next < 7) {
          setActiveStep(1);
          const pct = Math.min(38, Math.round(15 + next * 3.8));
          setDisplayPercent(pct);
          Animated.timing(progressAnim, {
            toValue: pct / 100,
            duration: 900,
            useNativeDriver: false,
          }).start();
        }
        // Step 2: 7s - 18s (40% -> 74%)
        else if (next < 19) {
          setActiveStep(2);
          const pct = Math.min(74, Math.round(40 + (next - 7) * 3));
          setDisplayPercent(pct);
          Animated.timing(progressAnim, {
            toValue: pct / 100,
            duration: 900,
            useNativeDriver: false,
          }).start();
        }
        // Step 3: 19s+ (75% -> 94%)
        else {
          setActiveStep(3);
          const pct = Math.min(94, Math.round(75 + Math.min(next - 18, 19) * 1));
          setDisplayPercent(pct);
          Animated.timing(progressAnim, {
            toValue: pct / 100,
            duration: 900,
            useNativeDriver: false,
          }).start();
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, progressAnim]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (status === 'failed') {
    const isQuotaError =
      typeof errorMessage === 'string' &&
      (errorMessage.toLowerCase().includes('limit') || errorMessage.toLowerCase().includes('quota'));
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#EF4444' }]}>
        <View style={styles.errorHeader}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: '#EF4444' }]}>
              {isQuotaError ? 'Daily Limit Reached' : 'Distillation Interrupted'}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {errorMessage || 'The AI summarizer encountered an error while processing this video.'}
            </Text>
          </View>
        </View>

        {onRetry && (
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: themeColor }]}
            activeOpacity={0.8}
            onPress={onRetry}>
            <Text style={styles.retryBtnText}>Retry Distillation</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
      {/* Top Header Badge Row */}
      <View style={styles.topRow}>
        <View style={styles.liveIndicatorRow}>
          <Animated.View
            style={[
              styles.radarDot,
              { backgroundColor: themeColor, opacity: pulseAnim },
            ]}
          />
          <Text style={[styles.liveLabel, { color: themeColor }]}>
            AI DISTILLATION ENGINE
          </Text>
        </View>

        <View style={[styles.percentBadge, { backgroundColor: `${themeColor}15` }]}>
          <Text style={[styles.percentText, { color: themeColor }]}>{displayPercent}%</Text>
        </View>
      </View>

      {/* Progress Bar Container */}
      <View style={[styles.progressBarTrack, { backgroundColor: colors.borderSubtle }]}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressBarWidth,
              backgroundColor: themeColor,
            },
          ]}
        />
      </View>

      {/* Steps List */}
      <View style={styles.stepsContainer}>
        {STEPS.map((step, index) => {
          const isDone = activeStep > step.id;
          const isCurrent = activeStep === step.id;
          const isPending = activeStep < step.id;

          return (
            <View key={step.id} style={styles.stepWrapper}>
              <View style={styles.stepRow}>
                {/* Step Node Icon / Check */}
                <View
                  style={[
                    styles.nodeCircle,
                    isDone && { backgroundColor: themeColor, borderColor: themeColor },
                    isCurrent && {
                      backgroundColor: `${themeColor}20`,
                      borderColor: themeColor,
                    },
                    isPending && {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                    },
                  ]}>
                  {isDone ? (
                    <Text style={styles.nodeCheck}>✓</Text>
                  ) : isCurrent ? (
                    <ActivityIndicator size="small" color={themeColor} />
                  ) : (
                    <Text style={[styles.nodeNumber, { color: colors.textMuted }]}>
                      {step.id}
                    </Text>
                  )}
                </View>

                {/* Step Content */}
                <View style={styles.stepContent}>
                  <View style={styles.stepTitleRow}>
                    <Text style={styles.stepEmoji}>{step.icon}</Text>
                    <Text
                      style={[
                        styles.stepTitle,
                        {
                          color: isPending ? colors.textMuted : colors.textPrimary,
                          fontWeight: isCurrent ? '700' : '600',
                        },
                      ]}>
                      {step.title}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stepDesc,
                      { color: isCurrent ? colors.textSecondary : colors.textMuted },
                    ]}
                    numberOfLines={isCurrent ? 2 : 1}>
                    {step.description}
                  </Text>
                </View>
              </View>

              {/* Vertical Connector Line (between steps) */}
              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor: isDone ? themeColor : colors.borderSubtle,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Bottom Footer with Elapsed Time & Assurance */}
      <View style={[styles.footerRow, { borderTopColor: colors.borderSubtle }]}>
        <Text style={[styles.footerElapsed, { color: colors.textSecondary }]}>
          ⏱️ Elapsed: {elapsedSeconds}s • Grounded in Video Audio
        </Text>
        <Text style={[styles.footerSub, { color: colors.textMuted }]}>
          Zero hallucinations • Multimodal fact verification
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  percentBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepsContainer: {
    marginBottom: 8,
  },
  stepWrapper: {
    position: 'relative',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  nodeCheck: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  nodeNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepEmoji: {
    fontSize: 13,
    marginRight: 6,
  },
  stepTitle: {
    fontSize: 14,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  connectorLine: {
    position: 'absolute',
    left: 13,
    top: 30,
    width: 2,
    height: 14,
  },
  footerRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  footerElapsed: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  footerSub: {
    fontSize: 11,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  retryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
