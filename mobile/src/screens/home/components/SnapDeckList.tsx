import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { createHomeStyles } from '../HomeScreen.styles';

export interface SnapDeckListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (info: ListRenderItemInfo<T>) => React.ReactElement | null;
  cardContainerHeight: number;
  loading: boolean;
  loadingText: string;
  loadingColor?: string;
  refreshing: boolean;
  onRefresh: () => void;
  emptyComponent: React.ReactElement;
  styles: ReturnType<typeof createHomeStyles>;
}

export function SnapDeckList<T>({
  data,
  keyExtractor,
  renderItem,
  cardContainerHeight,
  loading,
  loadingText,
  loadingColor = '#6366F1',
  refreshing,
  onRefresh,
  emptyComponent,
  styles,
}: SnapDeckListProps<T>) {
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={loadingColor} />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return emptyComponent;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.listContentNoPadding}
      pagingEnabled={true}
      snapToInterval={cardContainerHeight > 0 ? cardContainerHeight : undefined}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum={true}
      showsVerticalScrollIndicator={false}
      initialNumToRender={2}
      maxToRenderPerBatch={4}
      windowSize={5}
      removeClippedSubviews={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={loadingColor}
        />
      }
    />
  );
}
