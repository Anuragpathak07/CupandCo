import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { colors, radii, spacing, typography } from '@/theme';

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
  last = false,
}: SettingsRowProps) {
  const content = (
    <>
      {icon ? <View style={styles.rowIcon}>{icon}</View> : null}
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, destructive && styles.destructiveLabel]}>{label}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {right}
      {onPress && !right ? <ChevronRight size={17} color={colors.inkTertiary} /> : null}
    </>
  );

  if (onPress) {
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

  return <View style={[styles.row, !last && styles.rowDivider]}>{content}</View>;
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  groupTitle: {
    ...typography.overline,
    color: colors.inkTertiary,
    paddingHorizontal: spacing.xs,
  },
  groupBody: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  rowCopy: { flex: 1, gap: 2 },
  rowLabel: { ...typography.subheadline, color: colors.ink },
  rowDescription: { ...typography.caption, color: colors.inkSecondary },
  rowValue: { ...typography.footnote, color: colors.inkSecondary },
  destructiveLabel: { color: colors.danger },
});
