/**
 * OfflineBanner.tsx
 *
 * Sticky status banner shown at the top of the orders screen when:
 *  - Supabase is unreachable (offline)
 *  - There are orders queued locally waiting to sync
 *  - A sync is in progress
 *
 * Dismisses automatically once the queue is empty and sync is idle.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

import { useOfflineSync } from '@/services/orders';
import { colors } from '@/theme';

export function OfflineBanner() {
  const { syncStatus, pendingCount } = useOfflineSync();
  const opacity = useRef(new Animated.Value(0)).current;

  const isVisible = syncStatus !== 'idle' || pendingCount > 0;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, opacity]);

  if (!isVisible) return null;

  const config = getBannerConfig(syncStatus, pendingCount);

  return (
    <Animated.View style={[styles.wrapper, { opacity, backgroundColor: config.bg }]}>
      <View style={styles.inner}>
        <Text style={styles.dot}>{config.dot}</Text>
        <Text style={styles.message}>{config.message}</Text>
      </View>
    </Animated.View>
  );
}

function getBannerConfig(
  syncStatus: string,
  pendingCount: number,
): { bg: string; dot: string; message: string } {
  if (syncStatus === 'syncing') {
    return {
      bg: '#2563eb',
      dot: '⟳',
      message: `Syncing ${pendingCount} pending order${pendingCount !== 1 ? 's' : ''}…`,
    };
  }
  if (syncStatus === 'offline' || (pendingCount > 0 && syncStatus !== 'syncing')) {
    return {
      bg: '#d97706',
      dot: '⚠',
      message:
        pendingCount > 0
          ? `Offline – ${pendingCount} order${pendingCount !== 1 ? 's' : ''} queued locally. Will sync when connection restores.`
          : 'Offline – orders will be saved locally and synced automatically.',
    };
  }
  if (syncStatus === 'error') {
    return {
      bg: '#dc2626',
      dot: '✕',
      message: `Sync failed for ${pendingCount} order${pendingCount !== 1 ? 's' : ''}. Retrying…`,
    };
  }
  // idle with 0 pending (only shown in dev)
  return { bg: '#16a34a', dot: '✓', message: 'All orders synced.' };
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 999,
    ...(Platform.OS === 'web' ? { position: 'sticky' as never, top: 0 } : {}),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 900,
    marginHorizontal: 'auto',
  },
  dot: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
