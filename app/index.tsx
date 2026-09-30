import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';
import { defaultRouteForRole } from '@/utils/roles';

export default function IndexScreen() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  // Wait for session restore before deciding where to go.
  // This prevents a flash of the app (or login) before auth is known.
  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // Enforce login: no user -> always to /login, never into (app).
  return <Redirect href={user ? defaultRouteForRole(user.role) : '/login'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
});
