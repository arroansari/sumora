import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Image,
  ActivityIndicator,
  View,
  StyleProp,
} from 'react-native';

const buttonGradientSource = require('../../assets/images/button_gradient.png');

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
  const flattenedStyle = StyleSheet.flatten([styles.container, style]) || {};
  const radius =
    typeof flattenedStyle.borderRadius === 'number' ? flattenedStyle.borderRadius : 21;

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.container, style]}>
      {/* Dedicated clipping container so iOS clips the gradient to border radius without clipping outer shadows */}
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
          source={buttonGradientSource}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
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
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    fontSize: 13.5,
    letterSpacing: 0.1,
  },
});
