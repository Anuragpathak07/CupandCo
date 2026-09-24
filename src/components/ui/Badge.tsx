import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';
import type { OrderStatus, RealtimeStatus } from '@/types';

export type BadgeTone = 'neutral' | 'amber' | 'blue' | 'green' | 'rose' | 'dark';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
  style?: StyleProp<ViewStyle>;
}

const toneStyles = {
  neutral: { background: colors.secondarySurface, foreground: colors.inkSecondary },
  amber: { background: colors.pendingSoft, foreground: colors.pendingText },
  blue: { background: colors.progressSoft, foreground: colors.progressText },
  green: { background: colors.completedSoft, foreground: colors.completedText },
  rose: { background: colors.cancelledSoft, foreground: colors.cancelledText },
  dark: { background: colors.ink, foreground: colors.white },
} satisfies Record<BadgeTone, { background: string; foreground: string }>;

export function Badge({ label, tone = 'neutral', dot = false, pulse = false, style }: BadgeProps) {
  const palette = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: palette.foreground }, pulse && styles.pulseDot]} /> : null}
      <Text style={[styles.label, { color: palette.foreground }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status, style }: { status: OrderStatus; style?: StyleProp<ViewStyle> }) {
  const config: Record<OrderStatus, { label: string; tone: BadgeTone; pulse?: boolean }> = {
    PENDING: { label: 'Pending', tone: 'amber' },
    IN_PROGRESS: { label: 'In progress', tone: 'blue', pulse: true },
    COMPLETED: { label: 'Completed', tone: 'green' },
    CANCELLED: { label: 'Cancelled', tone: 'rose' },
  };
  const item = config[status];
  return <Badge label={item.label} tone={item.tone} dot pulse={item.pulse} style={style} />;
}

export function RealtimeBadge({ status }: { status: RealtimeStatus }) {
  const config: Record<RealtimeStatus, { label: string; tone: BadgeTone; pulse?: boolean }> = {
    connecting: { label: 'Connecting', tone: 'amber' },
    live: { label: 'Live', tone: 'green', pulse: true },
    offline: { label: 'Offline', tone: 'neutral' },
  };
  const item = config[status];
  return <Badge label={item.label} tone={item.tone} dot pulse={item.pulse} />;
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 24,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
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
  pulseDot: {
    opacity: 0.9,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
});

