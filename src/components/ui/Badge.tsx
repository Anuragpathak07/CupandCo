import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';
import type { OrderStatus, RealtimeStatus } from '@/types';

export type BadgeTone = 'neutral' | 'amber' | 'blue' | 'green' | 'rose' | 'dark';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

const toneStyles = {
  neutral: { background: colors.surfaceMuted, foreground: colors.inkSecondary },
  amber: { background: colors.pendingSoft, foreground: colors.accentDark },
  blue: { background: colors.progressSoft, foreground: colors.progress },
  green: { background: colors.completedSoft, foreground: colors.completed },
  rose: { background: colors.cancelledSoft, foreground: colors.cancelled },
  dark: { background: colors.ink, foreground: colors.white },
} satisfies Record<BadgeTone, { background: string; foreground: string }>;

export function Badge({ label, tone = 'neutral', dot = false, style }: BadgeProps) {
  const palette = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: palette.foreground }]} /> : null}
      <Text style={[styles.label, { color: palette.foreground }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status, style }: { status: OrderStatus; style?: StyleProp<ViewStyle> }) {
  const config: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
    PENDING: { label: 'Pending', tone: 'amber' },
    IN_PROGRESS: { label: 'In progress', tone: 'blue' },
    COMPLETED: { label: 'Completed', tone: 'green' },
    CANCELLED: { label: 'Cancelled', tone: 'rose' },
  };
  return <Badge label={config[status].label} tone={config[status].tone} dot style={style} />;
}

export function RealtimeBadge({ status }: { status: RealtimeStatus }) {
  const config: Record<RealtimeStatus, { label: string; tone: BadgeTone }> = {
    connecting: { label: 'Connecting', tone: 'amber' },
    live: { label: 'Live', tone: 'green' },
    offline: { label: 'Offline', tone: 'neutral' },
  };
  return <Badge label={config[status].label} tone={config[status].tone} dot />;
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 26,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    ...typography.micro,
  },
});
