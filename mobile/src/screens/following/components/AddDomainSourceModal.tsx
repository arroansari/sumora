import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { createFollowingStyles } from '../FollowingScreen.styles';

export interface AddDomainSourceModalProps {
  visible: boolean;
  title: string;
  placeholder: string;
  hint: string;
  themeColor: string;
  styles: ReturnType<typeof createFollowingStyles>;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  onClose: () => void;
}

export const AddDomainSourceModal: React.FC<AddDomainSourceModalProps> = ({
  visible,
  title,
  placeholder,
  hint,
  themeColor,
  styles,
  value,
  onChangeText,
  onSubmit,
  loading,
  onClose,
}) => {
  const { colors } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalContent, { paddingBottom: 32 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14 }}>
            {hint}
          </Text>

          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: themeColor, marginTop: 14 }]}
            onPress={onSubmit}
            disabled={!value.trim() || loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.addButtonText}>Start Tracking</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
