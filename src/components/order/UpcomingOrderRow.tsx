import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { colors, radii, spacing, typography } from '@/theme';
import type { Order } from '@/types';
import { formatTime } from '@/utils/dates';
import { getOrderItemCount } from '@/utils/orders';

export function UpcomingOrderRow({ order, onPress }: { order: Order; onPress?: () => void }) {
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
          <Text style={styles.itemCount}>{getOrderItemCount(order)} items</Text>
          <Text numberOfLines={1} style={styles.summary}>
            {order.items.map((item) => `${item.quantity}× ${item.itemName}`).join(' · ')}
          </Text>
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
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfacePressed },
  numberBox: {
    minWidth: 50,
    alignItems: 'flex-start',
    gap: 2,
  },
  number: { ...typography.headline, color: colors.ink, fontVariant: ['tabular-nums'] },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  itemCount: { ...typography.overline, color: colors.inkTertiary, fontSize: 10 },
  summary: { ...typography.footnote, color: colors.inkSecondary },
  timeCopy: { alignItems: 'flex-end', gap: 2 },
  timeLabel: { ...typography.micro, color: colors.inkTertiary, letterSpacing: 0.5, fontSize: 9 },
  time: { ...typography.caption, color: colors.inkSecondary },
});
