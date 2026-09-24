import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, spacing, typography } from '@/theme';

interface Segment<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  scrollable = false,
}: SegmentedControlProps<T>) {
  const control = (
    <View style={[styles.track, scrollable && styles.trackScroll]}>
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.segment,
              scrollable && styles.segmentScroll,
              selected && styles.segmentSelected,
              pressed && !selected && styles.segmentPressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{segment.label}</Text>
            {segment.count !== undefined ? (
              <View style={[styles.count, selected && styles.countSelected]}>
                <Text style={[styles.countLabel, selected && styles.countLabelSelected]}>
                  {segment.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  if (!scrollable) return control;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {control}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.secondarySurface,
    alignSelf: 'flex-start',
  },
  trackScroll: {
    minWidth: '100%',
  },
  scroll: {
    minWidth: '100%',
  },
  segment: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  segmentScroll: {
    flex: 1,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  segmentPressed: {
    opacity: 0.65,
  },
  label: {
    ...typography.caption,
    fontSize: 13,
    color: colors.inkSecondary,
    fontWeight: '500',
  },
  labelSelected: {
    color: colors.ink,
    fontWeight: '600',
  },
  count: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  countSelected: {
    backgroundColor: colors.accentSoft,
  },
  countLabel: {
    ...typography.micro,
    fontSize: 11,
    color: colors.inkSecondary,
  },
  countLabelSelected: {
    color: colors.accentDark,
    fontWeight: '600',
  },
});

