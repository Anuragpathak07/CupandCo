import { Check, ChevronDown, MessageSquareText, Play, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import type { Order } from '@/types';
import { formatTime } from '@/utils/dates';
import { formatCurrency, pluralize } from '@/utils/formatters';
import { getOrderItemCount, getOrderSubtotal } from '@/utils/orders';

interface UpcomingOrderRowProps {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  completing: boolean;
  starting: boolean;
  cancelling: boolean;
  onDone: () => void;
  onStart: () => void;
  onCancel?: () => void;
}

export function UpcomingOrderRow({
  order,
  expanded,
  onToggle,
  completing,
  starting,
  cancelling,
  onDone,
  onStart,
  onCancel,
}: UpcomingOrderRowProps) {
  const itemCount = getOrderItemCount(order);
  const isPending = order.status === 'PENDING';
  const total = getOrderSubtotal(order);

  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutUp.duration(160)}>
      <View style={[styles.card, expanded && styles.cardExpanded]}>
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`Order #${order.orderNumber}, ${expanded ? 'collapse' : 'expand'}`}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.numberBox}>
            <Text style={styles.number}>#{order.orderNumber}</Text>
          </View>
          <View style={styles.copy}>
            <Text numberOfLines={expanded ? undefined : 1} style={styles.summary}>
              {order.items.map((item) => `${item.quantity}× ${item.itemName}`).join(' · ')}
            </Text>
            <Text style={styles.itemCount}>{pluralize(itemCount, 'item')}</Text>
          </View>
          <View style={styles.rightBlock}>
            <View style={styles.timeCopy}>
              <Text style={styles.timeLabel}>PLACED</Text>
              <Text style={styles.time}>{formatTime(order.createdAt)}</Text>
            </View>
            <View style={styles.totalBlock}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalCollapsed}>{formatCurrency(total)}</Text>
            </View>
          </View>
          <View style={[styles.chevron, expanded && styles.chevronExpanded]}>
            <ChevronDown size={17} color={colors.inkTertiary} />
          </View>
        </Pressable>

        {expanded ? (
          <View style={styles.expandedBody}>
            <View style={styles.expandedHeader}>
              <Badge
                label={isPending ? 'Waiting' : 'In progress'}
                tone={isPending ? 'amber' : 'blue'}
                dot
                pulse={!isPending}
              />
            </View>

            <View style={styles.items}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.quantityChip}>
                    <Text style={styles.quantity}>{item.quantity}×</Text>
                  </View>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    {item.notes ? (
                      <View style={styles.itemNoteRow}>
                        <MessageSquareText size={13} color={colors.accentDark} />
                        <Text style={styles.itemNote}>{item.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            {order.notes ? (
              <View style={styles.orderNote}>
                <Text style={styles.orderNoteLabel}>ORDER NOTE</Text>
                <Text style={styles.orderNoteText}>{order.notes}</Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <View style={styles.customerCopy}>
                <Text style={styles.metaLabel}>CUSTOMER</Text>
                <Text style={styles.customer}>{order.createdByName ?? 'Counter order'}</Text>
                <Text style={styles.metaValue}>{pluralize(itemCount, 'item')}</Text>
              </View>
              <View style={styles.totalCopy}>
                <Text style={styles.metaLabel}>TOTAL</Text>
                <Text style={styles.total}>{formatCurrency(getOrderSubtotal(order))}</Text>
              </View>
            </View>

            <Button
              title="Order Done"
              size="lg"
              fullWidth
              loading={completing}
              onPress={onDone}
              icon={<Check size={20} color={colors.white} strokeWidth={2.5} />}
              style={styles.doneButton}
            />

            {isPending || onCancel ? (
              <View style={styles.secondaryActions}>
                {isPending ? (
                  <Button
                    title="Start preparing"
                    variant="ghost"
                    size="sm"
                    loading={starting}
                    onPress={onStart}
                    icon={<Play size={13} color={colors.accentDark} fill={colors.accentDark} />}
                  />
                ) : null}
                {onCancel ? (
                  <Button
                    title="Cancel ticket"
                    variant="ghost"
                    size="sm"
                    loading={cancelling}
                    onPress={onCancel}
                    icon={<X size={13} color={colors.danger} />}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.level1,
  },
  cardExpanded: {
    borderRadius: radii.xxl,
    ...shadows.level2,
  },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
  rightBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  totalBlock: { alignItems: 'flex-end', gap: 2, minWidth: 64 },
  totalLabel: { ...typography.overline, color: colors.inkTertiary, fontSize: 10 },
  totalCollapsed: { ...typography.headline, color: colors.ink, fontWeight: '700', fontVariant: ['tabular-nums'] },
  chevron: { marginLeft: 2 },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
  expandedBody: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  expandedHeader: { flexDirection: 'row', justifyContent: 'flex-end' },
  items: { gap: spacing.sm },
  itemRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  quantityChip: {
    height: 28,
    minWidth: 32,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.secondarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: { ...typography.caption, color: colors.ink, fontWeight: '700', fontVariant: ['tabular-nums'] },
  itemCopy: { flex: 1, gap: 2 },
  itemName: { ...typography.headline, color: colors.ink },
  itemNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  itemNote: { ...typography.footnote, color: colors.accentDark, flex: 1 },
  itemPrice: { ...typography.body, color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  orderNote: { padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.accentSoft, gap: spacing.xs },
  orderNoteLabel: { ...typography.overline, color: colors.accentDark, fontSize: 11 },
  orderNoteText: { ...typography.subheadline, color: colors.ink },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSubtle },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  customerCopy: { flex: 1, gap: 2 },
  totalCopy: { alignItems: 'flex-end', gap: 2 },
  metaLabel: { ...typography.overline, color: colors.inkTertiary, fontSize: 11 },
  customer: { ...typography.headline, color: colors.ink },
  metaValue: { ...typography.caption, color: colors.inkSecondary },
  total: { ...typography.title2, color: colors.ink, fontVariant: ['tabular-nums'] },
  doneButton: { marginTop: spacing.xs, height: 50 },
  secondaryActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: -spacing.xs },
});
