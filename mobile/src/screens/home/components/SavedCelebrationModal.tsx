import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { createHomeStyles } from '../HomeScreen.styles';

export interface SavedCelebrationModalProps {
  visible: boolean;
  videoTitle?: string;
  styles: ReturnType<typeof createHomeStyles>;
  onViewSaved: () => void;
  onDismiss: () => void;
}

export const SavedCelebrationModal: React.FC<SavedCelebrationModalProps> = React.memo(
  ({ visible, videoTitle, styles, onViewSaved, onDismiss }) => {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}>
        <View style={styles.celebrationBackdrop}>
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationIconCircle}>
              <Text style={styles.celebrationIconEmoji}>🎉</Text>
            </View>

            <Text style={styles.celebrationTitle}>First Summary Saved!</Text>
            <Text style={styles.celebrationSubtitle}>
              {videoTitle ? `"${videoTitle}"\n\n` : ''}
              We've created a dedicated <Text style={styles.celebrationBoldText}>Saved</Text> tab at the top of your feed for instant, 1-tap access to your bookmarked takeaways anytime.
            </Text>

            <View style={styles.celebrationBtnCol}>
              <TouchableOpacity
                style={styles.celebrationPrimaryBtn}
                onPress={onViewSaved}
                activeOpacity={0.85}>
                <Text style={styles.celebrationPrimaryBtnText}>View in Saved Tab 🔖</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.celebrationSecondaryBtn}
                onPress={onDismiss}
                activeOpacity={0.75}>
                <Text style={styles.celebrationSecondaryBtnText}>Keep Browsing Feed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

