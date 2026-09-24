import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: 'amber' | 'blue' | 'green' | 'rose';
}

export function MetricCard({ label, value, detail, icon, tone = 'amber' }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.icon, styles[`icon_${tone}`]]}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 210,
    minHeight: 166,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: { width: 38, height: 38, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  icon_amber: { backgroundColor: colors.accentSoft },
  icon_blue: { backgroundColor: colors.progressSoft },
  icon_green: { backgroundColor: colors.completedSoft },
  icon_rose: { backgroundColor: colors.cancelledSoft },
  label: { ...typography.caption, color: colors.inkSecondary },
  value: { ...typography.title1, color: colors.ink, marginTop: spacing.xxs, fontVariant: ['tabular-nums'] },
  detail: { ...typography.caption, color: colors.inkTertiary, marginTop: spacing.xs },
});
