import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ThemeColors } from '../../../theme/colors';
import { createHomeStyles } from '../HomeScreen.styles';

export interface ImportVideoModalProps {
  visible: boolean;
  onClose: () => void;
  urlInput: string;
  onChangeUrlInput: (text: string) => void;
  onImport: () => void;
  importing: boolean;
  styles: ReturnType<typeof createHomeStyles>;
  colors: ThemeColors;
}

export const ImportVideoModal: React.FC<ImportVideoModalProps> = React.memo(
  ({
    visible,
    onClose,
    urlInput,
    onChangeUrlInput,
    onImport,
    importing,
    styles,
    colors,
  }) => {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Summarize Any Video</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.modalCloseBtn}
                accessibilityLabel="Close import dialog">
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Paste any YouTube video link or Shorts URL to generate a concise summary instantly:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor={colors.textMuted}
              value={urlInput}
              onChangeText={onChangeUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={onClose}
                activeOpacity={0.75}
                disabled={importing}>
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={onImport}
                activeOpacity={0.8}
                disabled={importing}>
                {importing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPrimaryBtnText}>Distill Video ✨</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

