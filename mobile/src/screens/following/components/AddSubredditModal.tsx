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
import { createFollowingStyles } from '../FollowingScreen.styles';
import { useAppTheme } from '../../../context/ThemeContext';

export interface AddSubredditModalProps {
  visible: boolean;
  styles: ReturnType<typeof createFollowingStyles>;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  onClose: () => void;
}

export const AddSubredditModal: React.FC<AddSubredditModalProps> = ({
  visible,
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
            <Text style={styles.modalTitle}>💬 Track a Subreddit</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14 }}>
            Enter the name of a subreddit you want to distill top debates from.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. technology or r/stocks"
            placeholderTextColor={colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#FF4500', marginTop: 14 }]}
            onPress={onSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.addButtonText}>Start Tracking Subreddit</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

