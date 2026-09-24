import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Lock } from 'lucide-react-native';

import { colors, radii, shadows, spacing, typography } from '@/theme';

export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  value?: string;
  icon?: ReactNode;
  onPress?: () => void;
  right?: ReactNode;
  destructive?: boolean;
  locked?: boolean;
  last?: boolean;
}

export function SettingsRow({
  label,
  description,
  value,
  icon,
  onPress,
  right,
  destructive = false,
  locked = false,
  last = false,
}: SettingsRowProps) {
  const content = (
    <>
      {icon ? <View style={[styles.rowIcon, locked && styles.lockedIcon]}>{icon}</View> : null}
      <View style={[styles.rowCopy, locked && styles.lockedCopy]}>
        <View style={styles.labelRow}>
          <Text style={[styles.rowLabel, destructive && styles.destructiveLabel]}>{label}</Text>
          {locked ? <Lock size={13} color={colors.inkTertiary} /> : null}
        </View>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {value ? <Text style={[styles.rowValue, locked && styles.lockedValue]}>{value}</Text> : null}
      {right}
      {onPress && !right && !locked ? <ChevronRight size={17} color={colors.inkTertiary} /> : null}
    </>
  );

  if (onPress && !locked) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.rowPressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, !last && styles.rowDivider, locked && styles.rowLocked]}>{content}</View>;
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs, marginBottom: spacing.sm },
  groupTitle: {
    ...typography.overline,
    color: colors.inkTertiary,
    paddingHorizontal: spacing.sm,
    marginBottom: 4,
  },
  groupBody: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.level1,
  },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  rowLocked: { opacity: 0.65 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondarySurface,
  },
  lockedIcon: {
    backgroundColor: colors.secondarySurface,
  },
  rowCopy: { flex: 1, gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { ...typography.bodyMedium, color: colors.ink },
  rowDescription: { ...typography.caption, color: colors.inkSecondary },
  rowValue: { ...typography.footnote, color: colors.inkSecondary },
  lockedCopy: { opacity: 0.8 },
  lockedValue: { color: colors.inkTertiary },
  destructiveLabel: { color: colors.danger },
});

