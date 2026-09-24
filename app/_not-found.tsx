import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>That page isn’t on the menu.</Text>
        <Text style={styles.body}>The link may have moved, or you may not have access to it.</Text>
        <Link href="/" asChild>
          <Button title="Back to Cup & Co" />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  code: { ...typography.hero, color: colors.accent },
  title: { ...typography.title2, color: colors.ink, textAlign: 'center' },
  body: { ...typography.body, color: colors.inkSecondary, textAlign: 'center' },
});
