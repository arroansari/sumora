import { StyleSheet } from 'react-native';

export const createTabIconStyles = (color: string, focused: boolean) =>
  StyleSheet.create({
    // ─── Shared container ───────────────────────────────────────────────
    container: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ─── HOME ───────────────────────────────────────────────────────────
    // Triangle roof
    homeRoof: {
      width: 0,
      height: 0,
      borderLeftWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: color,
      marginBottom: -1,
    },
    // Rectangular body
    homeBody: {
      width: 15,
      height: 10,
      backgroundColor: focused ? color : 'transparent',
      borderWidth: focused ? 0 : 1.8,
      borderColor: color,
      borderTopWidth: 0,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 1,
    },
    homeDoor: {
      width: 4,
      height: 5,
      backgroundColor: focused ? 'rgba(255,255,255,0.4)' : color,
      borderTopLeftRadius: 1,
      borderTopRightRadius: 1,
    },

    // ─── FOLLOWING (two people) ──────────────────────────────────────────
    followingContainer: {
      width: 26,
      height: 24,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    // Back person (behind, slightly right)
    backUserHead: {
      position: 'absolute',
      width: 7,
      height: 7,
      borderRadius: 3.5,
      borderWidth: 1.6,
      borderColor: color,
      backgroundColor: 'transparent',
      top: 0,
      right: 2,
    },
    backUserBody: {
      position: 'absolute',
      width: 12,
      height: 7,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      borderWidth: 1.6,
      borderColor: color,
      borderBottomWidth: 0,
      backgroundColor: 'transparent',
      bottom: 0,
      right: 0,
    },
    // Front person (overlapping, slightly left)
    frontUserHead: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: focused ? 0 : 1.8,
      borderColor: color,
      backgroundColor: focused ? color : 'transparent',
      top: 0,
      left: 0,
    },
    frontUserBody: {
      position: 'absolute',
      width: 14,
      height: 8,
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
      borderWidth: focused ? 0 : 1.8,
      borderColor: color,
      borderBottomWidth: 0,
      backgroundColor: focused ? color : 'transparent',
      bottom: 0,
      left: 0,
    },

    // ─── CONNECTED (chain link) ──────────────────────────────────────────
    linkContainer: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Upper-left oval
    linkUpperOuter: {
      width: 14,
      height: 9,
      borderRadius: 4.5,
      borderWidth: 2,
      borderColor: color,
      backgroundColor: 'transparent',
      transform: [{ rotate: '-40deg' }],
      position: 'absolute',
      top: 4,
      left: 2,
    },
    // Lower-right oval
    linkLowerOuter: {
      width: 14,
      height: 9,
      borderRadius: 4.5,
      borderWidth: 2,
      borderColor: color,
      backgroundColor: 'transparent',
      transform: [{ rotate: '-40deg' }],
      position: 'absolute',
      bottom: 4,
      right: 2,
    },
    // Middle gap cover (white bar to create "chain" break illusion)
    linkMiddleMask: {
      width: 5,
      height: 2,
      backgroundColor: focused ? color : 'transparent',
      position: 'absolute',
    },

    // ─── ALERTS (bell) ──────────────────────────────────────────────────
    bellContainer: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellTop: {
      width: 4,
      height: 3,
      backgroundColor: color,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
      marginBottom: -0.5,
      zIndex: 1,
    },
    bellBody: {
      width: 16,
      height: 11,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      backgroundColor: focused ? color : 'transparent',
      borderWidth: focused ? 0 : 2,
      borderColor: color,
      borderBottomWidth: 0,
    },
    bellBase: {
      width: 20,
      height: 2.5,
      backgroundColor: color,
      borderRadius: 1.5,
      marginTop: 0,
    },
    bellClapper: {
      width: 5,
      height: 3,
      borderBottomLeftRadius: 2.5,
      borderBottomRightRadius: 2.5,
      backgroundColor: color,
      marginTop: 1,
    },

    // ─── PROFILE (person silhouette) ────────────────────────────────────
    profileContainer: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    profileHead: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: focused ? color : 'transparent',
      borderWidth: focused ? 0 : 2,
      borderColor: color,
      marginBottom: 2,
    },
    profileBody: {
      width: 18,
      height: 10,
      borderTopLeftRadius: 9,
      borderTopRightRadius: 9,
      backgroundColor: focused ? color : 'transparent',
      borderWidth: focused ? 0 : 2,
      borderColor: color,
      borderBottomWidth: 0,
    },
  });
