import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ListRenderItemInfo,
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useAppTheme } from '../../../context/ThemeContext';
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
  const flatListRef = useRef<FlatList<T>>(null);
  const { accentTheme } = useAppTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const showScrollTopRef = useRef(false);
  const animValue = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      // Show when user goes 4-5 cards down (threshold >= 2.5 * cardContainerHeight, entering 4th card)
      const threshold = cardContainerHeight > 0 ? cardContainerHeight * 2.5 : 1200;
      // Reset when back at 1st card (offset <= 0.4 * cardContainerHeight)
      const resetThreshold = cardContainerHeight > 0 ? cardContainerHeight * 0.4 : 200;

      if (offsetY >= threshold && !showScrollTopRef.current) {
        showScrollTopRef.current = true;
        setShowScrollTop(true);
        Animated.spring(animValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }).start();
      } else if (offsetY <= resetThreshold && showScrollTopRef.current) {
        showScrollTopRef.current = false;
        Animated.timing(animValue, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }).start(() => {
          setShowScrollTop(false);
        });
      }
    },
    [cardContainerHeight, animValue]
  );

  const handleScrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

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
    <View style={{ flex: 1, position: 'relative' }}>
      <FlatList
        ref={flatListRef}
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={loadingColor}
          />
        }
      />

      {/* Floating Fast Forward Scroll-To-Top Button */}
      <Animated.View
        pointerEvents={showScrollTop ? 'auto' : 'none'}
        style={[
          styles.scrollTopFloatingContainer,
          {
            opacity: animValue,
            transform: [
              {
                scale: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              },
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleScrollToTop}
          accessibilityLabel="Fast forward to first card"
          accessibilityRole="button"
          style={[
            styles.scrollTopFab,
            {
              backgroundColor: accentTheme.primary,
              shadowColor: accentTheme.primaryDark || '#4338CA',
            },
          ]}>
          <View
            style={[StyleSheet.absoluteFill, styles.scrollTopGradientClip]}
            pointerEvents="none">
            <Image
              source={accentTheme.assets.button}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <View style={styles.scrollTopIconWrapper}>
            <Text style={styles.scrollTopArrow}>↑</Text>
            <Text style={styles.scrollTopLabel}>TOP</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
