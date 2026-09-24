import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CircleAlert, Inbox } from 'lucide-react-native';

import { colors, radii, spacing, typography } from '@/theme';
import { Button } from './Button';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.state} accessibilityLabel={label}>
      <ActivityIndicator size="small" color={colors.accent} />
      <Text style={styles.body}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.errorIcon}>
        <CircleAlert size={24} color={colors.danger} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.icon}>{icon ?? <Inbox size={26} color={colors.accentDark} />}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{message}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  errorIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.cancelledSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.headline,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    ...typography.footnote,
    color: colors.inkSecondary,
    textAlign: 'center',
    maxWidth: 430,
  },
});
