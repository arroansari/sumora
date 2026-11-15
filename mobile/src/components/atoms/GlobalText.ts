/**
 * GlobalText.ts
 *
 * Provides application-wide typography and dynamic text scaling.
 * Intercepts React Native's Text component so that text scaling seamlessly
 * and smoothly scales ALL text across the entire application and reader screens.
 */

import React from 'react';
import { StyleSheet, TextProps } from 'react-native';
import * as ReactNative from 'react-native';
import { DEFAULT_FONT_FAMILY } from '../../theme/typography';

// Keep original Native Text component
const OriginalText = ReactNative.Text;

declare global {
  var __SUMORA_TEXT_SCALE__: number | undefined;
}

if (typeof (globalThis as any).__SUMORA_TEXT_SCALE__ === 'undefined') {
  (globalThis as any).__SUMORA_TEXT_SCALE__ = 1.0;
}

export interface ScaledTextProps extends TextProps {
  skipGlobalScale?: boolean;
}

const ScaledText = React.forwardRef<any, ScaledTextProps>((props, ref) => {
  const { style, skipGlobalScale, allowFontScaling, ...rest } = props;
  const currentScale = (globalThis as any).__SUMORA_TEXT_SCALE__ || 1.0;

  // Flatten style safely
  const flat = (StyleSheet.flatten(style) || {}) as Record<string, any>;

  // If explicit skip or no scale adjustment needed
  if (skipGlobalScale || allowFontScaling === false || currentScale === 1.0) {
    const finalStyle = flat.fontFamily
      ? style
      : [{ fontFamily: DEFAULT_FONT_FAMILY }, style];

    return React.createElement(OriginalText, {
      ...rest,
      allowFontScaling,
      ref,
      style: finalStyle,
    });
  }

  // Calculate dynamically scaled typography
  const baseFontSize = flat.fontSize ?? 14;
  const scaledFontSize = Math.round(baseFontSize * currentScale);
  const scaledLineHeight = flat.lineHeight
    ? Math.round(flat.lineHeight * currentScale)
    : undefined;

  const scaledStyle = [
    { fontFamily: flat.fontFamily || DEFAULT_FONT_FAMILY },
    style,
    {
      fontSize: scaledFontSize,
      ...(scaledLineHeight !== undefined ? { lineHeight: scaledLineHeight } : {}),
    },
  ];

  return React.createElement(OriginalText, {
    ...rest,
    allowFontScaling,
    ref,
    style: scaledStyle,
  });
});

ScaledText.displayName = 'ScaledText';

// Copy static methods/properties from OriginalText
Object.assign(ScaledText, OriginalText);

// Overwrite ReactNative.Text
try {
  Object.defineProperty(ReactNative, 'Text', {
    get() {
      return ScaledText;
    },
    configurable: true,
    enumerable: true,
  });
} catch {
  // In environments where property is not configurable
  (ReactNative as any).Text = ScaledText;
}

export { ScaledText };
