import { useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';

export function AuthProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(useAuthStore.getState().hydrated);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        await useAuthStore.persist.rehydrate();
        await restoreSession();
      } catch (error) {
        console.warn('Authentication hydration failed:', error);
      } finally {
        if (active) {
          setHydrated(true);
          setReady(true);
        }
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [restoreSession, setHydrated]);

  if (!ready) {
    return (
      <View style={styles.loading} accessibilityLabel="Loading Cup & Co">
        <View style={styles.mark} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: colors.canvas,
  },
  mark: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.ink,
    borderBottomRightRadius: 5,
  },
});
