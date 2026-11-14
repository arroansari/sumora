import React, { useMemo } from 'react';
import { View } from 'react-native';
import { createTabIconStyles } from './TabIcons.styles';

interface TabIconProps {
  color: string;
  focused: boolean;
}

export const HomeTabIcon = React.memo<TabIconProps>(({ color, focused }) => {
  const styles = useMemo(() => createTabIconStyles(color, focused), [color, focused]);
  return (
    <View style={styles.container}>
      <View style={styles.homeRoof} />
      <View style={styles.homeBody}>
        <View style={styles.homeDoor} />
      </View>
    </View>
  );
});

export const FollowingTabIcon = React.memo<TabIconProps>(({ color, focused }) => {
  const styles = useMemo(() => createTabIconStyles(color, focused), [color, focused]);
  return (
    <View style={styles.followingContainer}>
      {/* Back person */}
      <View style={styles.backUserHead} />
      <View style={styles.backUserBody} />
      {/* Front person */}
      <View style={styles.frontUserHead} />
      <View style={styles.frontUserBody} />
    </View>
  );
});

export const ConnectedTabIcon = React.memo<TabIconProps>(({ color, focused }) => {
  const styles = useMemo(() => createTabIconStyles(color, focused), [color, focused]);
  return (
    <View style={styles.linkContainer}>
      <View style={styles.linkUpperOuter} />
      <View style={styles.linkLowerOuter} />
    </View>
  );
});

export const AlertsTabIcon = React.memo<TabIconProps>(({ color, focused }) => {
  const styles = useMemo(() => createTabIconStyles(color, focused), [color, focused]);
  return (
    <View style={styles.bellContainer}>
      <View style={styles.bellTop} />
      <View style={styles.bellBody} />
      <View style={styles.bellBase} />
      <View style={styles.bellClapper} />
    </View>
  );
});

export const ProfileTabIcon = React.memo<TabIconProps>(({ color, focused }) => {
  const styles = useMemo(() => createTabIconStyles(color, focused), [color, focused]);
  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileHead} />
      <View style={styles.profileBody} />
    </View>
  );
});
