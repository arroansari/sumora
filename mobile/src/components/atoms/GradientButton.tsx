import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  StyleProp,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  activeOpacity?: number;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  loading = false,
  disabled = false,
  icon,
  activeOpacity = 0.8,
}) => {
  const { accentTheme } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.container,
        {
          backgroundColor: accentTheme.primary,
          shadowColor: accentTheme.primaryDark,
        },
        style,
      ]}>
      {/* Two-stop gradient simulation: left half lighter, right half primary */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.gradientOverlay,
          { backgroundColor: accentTheme.gradientEnd, opacity: 0.45 },
        ]}
        pointerEvents="none"
      />
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={[styles.text, textStyle]}>
          {icon ? `${icon} ` : ''}
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  gradientOverlay: {
    borderRadius: 21,
  },
  text: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    fontSize: 13.5,
    letterSpacing: 0.1,
  },
});
