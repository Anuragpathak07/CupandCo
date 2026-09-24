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
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 0,
    backgroundColor: colors.secondarySurface,
    gap: spacing.xs,
  },
  pillSelected: {
    backgroundColor: colors.ink,
  },
  pillPressed: {
    opacity: 0.75,
  },
  label: {
    ...typography.caption,
    fontSize: 14,
    color: colors.inkSecondary,
    fontWeight: '500',
    textTransform: 'none',
  },
  labelSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  countSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  countLabel: {
    ...typography.micro,
    fontSize: 11,
    color: colors.inkSecondary,
    fontWeight: '500',
  },
  countLabelSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});

