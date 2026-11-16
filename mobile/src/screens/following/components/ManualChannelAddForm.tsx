import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createFollowingStyles } from '../FollowingScreen.styles';
import { useAppTheme } from '../../../context/ThemeContext';

export interface ManualChannelAddFormProps {
  styles: ReturnType<typeof createFollowingStyles>;
  channelName: string;
  channelId: string;
  onChangeName: (text: string) => void;
  onChangeId: (text: string) => void;
  onSubmit: () => void;
  adding: boolean;
}

export const ManualChannelAddForm: React.FC<ManualChannelAddFormProps> = ({
  styles,
  channelName,
  channelId,
  onChangeName,
  onChangeId,
  onSubmit,
  adding,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.addBox}>
      <Text style={styles.addBoxTitle}>Track a YouTube Channel</Text>
      <TextInput
        style={styles.input}
        placeholder="Channel Name (e.g. Marques Brownlee)"
        placeholderTextColor={colors.textMuted}
        value={channelName}
        onChangeText={onChangeName}
      />
      <TextInput
        style={styles.input}
        placeholder="Channel ID (e.g. UCbXXXXXXXXXXXXXX)"
        placeholderTextColor={colors.textMuted}
        value={channelId}
        onChangeText={onChangeId}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={onSubmit}
        disabled={adding}>
        {adding ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.addButtonText}>Start Tracking</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

