import React, { useState, useMemo, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { createSearchBarStyles } from './SearchBar.styles';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar = React.memo<SearchBarProps>(
  ({ value, onChangeText, placeholder = 'Search channels...' }) => {
    const { colors } = useAppTheme();
    const styles = useMemo(() => createSearchBarStyles(colors), [colors]);
    const [focused, setFocused] = useState(false);

    const handleClear = useCallback(() => {
      onChangeText('');
    }, [onChangeText]);

    return (
      <View style={[styles.wrapper, focused && styles.wrapperFocused]}>
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.magnifierCircle,
              focused && styles.magnifierCircleFocused,
            ]}
          />
          <View
            style={[
              styles.magnifierHandle,
              focused && styles.magnifierHandleFocused,
            ]}
          />
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

