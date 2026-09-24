import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { colors, radii, shadows, spacing, typography } from '@/theme';
import type { Order } from '@/types';
import { formatTime } from '@/utils/dates';
import { pluralize } from '@/utils/formatters';
import { getOrderItemCount } from '@/utils/orders';

export function UpcomingOrderRow({ order, onPress }: { order: Order; onPress?: () => void }) {
  const itemCount = getOrderItemCount(order);

  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutUp.duration(160)}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.numberBox}>
          <Text style={styles.number}>#{order.orderNumber}</Text>
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.summary}>
            {order.items.map((item) => `${item.quantity}× ${item.itemName}`).join(' · ')}
          </Text>
          <Text style={styles.itemCount}>{pluralize(itemCount, 'item')}</Text>
        </View>
        <View style={styles.timeCopy}>
          <Text style={styles.timeLabel}>PLACED</Text>
          <Text style={styles.time}>{formatTime(order.createdAt)}</Text>
        </View>
        {onPress ? <ChevronRight size={17} color={colors.inkTertiary} /> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 0,
    backgroundColor: colors.surface,
    ...shadows.level1,
  },
  pressed: { backgroundColor: colors.surfacePressed },
  numberBox: {
    minWidth: 54,
    alignItems: 'flex-start',
  },
  number: { ...typography.headline, color: colors.ink, fontVariant: ['tabular-nums'] },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  summary: { ...typography.bodyMedium, color: colors.ink },
  itemCount: { ...typography.caption, color: colors.inkTertiary },
  timeCopy: { alignItems: 'flex-end', gap: 2 },
  timeLabel: { ...typography.overline, color: colors.inkTertiary, fontSize: 10 },
  time: { ...typography.footnote, color: colors.inkSecondary },
});

