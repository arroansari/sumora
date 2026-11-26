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
  Image,
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
  const flattenedStyle = StyleSheet.flatten([styles.container, style]) || {};
  const radius =
    typeof flattenedStyle.borderRadius === 'number' ? flattenedStyle.borderRadius : 21;

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
      {/* 3-stop hardware-accelerated linear gradient asset */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            overflow: 'hidden',
          },
        ]}
        pointerEvents="none">
        <Image
          source={accentTheme.assets.button ?? undefined}
          style={styles.fillImage}
          resizeMode="cover"
        />
      </View>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={[styles.text, textStyle]} numberOfLines={1}>
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
    position: 'relative',
  },
  fillImage: {
    width: '100%',
    height: '100%',
  },
  text: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    fontSize: 13.5,
    letterSpacing: 0.1,
  },
});
