/**
 * GlobalText.ts
 *
 * Patches React Native's Text and TextInput defaultProps once at app startup
 * to apply Plus Jakarta Sans globally to every text element in the app.
 *
 * Import this as the FIRST statement in index.js (before any screen renders).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Text, TextInput } from 'react-native';
import { DEFAULT_FONT_FAMILY } from '../../theme/typography';

const TextAny = Text as any;
const TextInputAny = TextInput as any;

// Patch Text
TextAny.defaultProps = TextAny.defaultProps || {};
const existingTextStyle = TextAny.defaultProps.style;
TextAny.defaultProps.style = [
  { fontFamily: DEFAULT_FONT_FAMILY },
  ...(Array.isArray(existingTextStyle) ? existingTextStyle : existingTextStyle ? [existingTextStyle] : []),
];

// Patch TextInput
TextInputAny.defaultProps = TextInputAny.defaultProps || {};
const existingInputStyle = TextInputAny.defaultProps.style;
TextInputAny.defaultProps.style = [
  { fontFamily: DEFAULT_FONT_FAMILY },
  ...(Array.isArray(existingInputStyle) ? existingInputStyle : existingInputStyle ? [existingInputStyle] : []),
];

export {};
