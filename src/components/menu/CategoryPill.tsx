import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface CategoryPillProps {
  label: string;
  selected: boolean;
  count?: number;
  onPress: () => void;
}

export function CategoryPill({ label, selected, count, onPress }: CategoryPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.pillSelected,
        pressed && styles.pillPressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {count !== undefined ? (
        <View style={[styles.count, selected && styles.countSelected]}>
          <Text style={[styles.countLabel, selected && styles.countLabelSelected]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  pillSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillPressed: { opacity: 0.68 },
  label: { ...typography.subheadline, color: colors.inkSecondary },
  labelSelected: { color: colors.white },
  count: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  countSelected: { backgroundColor: 'rgba(255,255,255,0.15)' },
  countLabel: { ...typography.micro, color: colors.inkSecondary },
  countLabelSelected: { color: colors.white },
});
