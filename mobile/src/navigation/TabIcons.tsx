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
        {!focused && <View style={styles.homeDoor} />}
      </View>
    </View>
  );
});

export const FollowingTabIcon = React.memo<TabIconProps>(({ color, focused }) => {
  const styles = useMemo(() => createTabIconStyles(color, focused), [color, focused]);
  return (
    <View style={styles.followingContainer}>
      <View style={styles.backUserWrapper}>
        <View style={styles.backUserHead} />
        <View style={styles.backUserTorso} />
      </View>
      <View style={styles.frontUserWrapper}>
        <View style={styles.frontUserHead} />
        <View style={styles.frontUserTorso} />
      </View>
    </View>
  );
});

export const ConnectedTabIcon = React.memo<TabIconProps>(({ color, focused }) => {
  const styles = useMemo(() => createTabIconStyles(color, focused), [color, focused]);
  return (
    <View style={styles.container}>
      <View style={styles.linkUpper} />
      <View style={styles.linkLower} />
    </View>
  );
});

export const AlertsTabIcon = React.memo<TabIconProps>(({ color, focused }) => {
  const styles = useMemo(() => createTabIconStyles(color, focused), [color, focused]);
  return (
    <View style={styles.container}>
      <View style={styles.bellDot} />
      <View style={styles.bellBody} />
      <View style={styles.bellRim} />
      <View style={styles.bellClapper} />
    </View>
  );
});

export const ProfileTabIcon = React.memo<TabIconProps>(({ color, focused }) => {
  const styles = useMemo(() => createTabIconStyles(color, focused), [color, focused]);
  return (
    <View style={styles.container}>
      <View style={styles.profileHead} />
      <View style={styles.profileBody} />
    </View>
  );
});

