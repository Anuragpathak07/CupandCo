import { Check, MessageSquareText, Play, X } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import type { Order } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { getOrderItemCount, getOrderSubtotal } from '@/utils/orders';

interface ActiveOrderCardProps {
  order: Order;
  completing: boolean;
  starting: boolean;
  cancelling: boolean;
  onDone: () => void;
  onStart: () => void;
  onCancel?: () => void;
}

export function ActiveOrderCard({
  order,
  completing,
  starting,
  cancelling,
  onDone,
  onStart,
  onCancel,
}: ActiveOrderCardProps) {
  const itemCount = getOrderItemCount(order);
  const isPending = order.status === 'PENDING';

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>CURRENT ORDER</Text>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        </View>
        <Text style={styles.statusText}>{isPending ? 'Waiting' : 'In progress'}</Text>
      </View>

      <View style={styles.items}>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.quantity}>{item.quantity}×</Text>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.itemName}</Text>
              {item.notes ? (
                <View style={styles.itemNoteRow}>
                  <MessageSquareText size={13} color={colors.accentDark} />
                  <Text style={styles.itemNote}>{item.notes}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice * item.quantity)}</Text>
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
          <Text style={styles.metaValue}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
        </View>
        <View style={styles.totalCopy}>
          <Text style={styles.metaLabel}>TOTAL</Text>
          <Text style={styles.total}>{formatCurrency(getOrderSubtotal(order))}</Text>
        </View>
      </View>

      <Button
        title="Order Done"
        size="xl"
        loading={completing}
        onPress={onDone}
        icon={<Check size={21} color={colors.accent} strokeWidth={2.5} />}
        style={styles.doneButton}
      />

      <View style={styles.secondaryActions}>
        {isPending ? (
          <Button
            title="Start preparing"
            variant="ghost"
            size="sm"
            loading={starting}
            onPress={onStart}
            icon={<Play size={14} color={colors.accentDark} fill={colors.accentDark} />}
          />
        ) : null}
        {onCancel ? (
          <Button
            title="Cancel ticket"
            variant="ghost"
            size="sm"
            loading={cancelling}
            onPress={onCancel}
            icon={<X size={14} color={colors.danger} />}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
    padding: spacing.xl,
    borderRadius: radii.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    backgroundColor: colors.surface,
    gap: spacing.lg,
    ...shadows.card,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headerCopy: { gap: spacing.xxs },
  kicker: { ...typography.overline, color: colors.accentDark },
  orderNumber: { ...typography.hero, color: colors.ink, fontVariant: ['tabular-nums'] },
  statusText: { ...typography.caption, color: colors.inkTertiary, paddingTop: spacing.xs },
  items: { gap: spacing.md },
  itemRow: { minHeight: 32, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  quantity: { ...typography.headline, color: colors.accentDark, minWidth: 28, fontVariant: ['tabular-nums'] },
  itemCopy: { flex: 1, gap: 3 },
  itemName: { ...typography.bodyMedium, color: colors.ink },
  itemNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemNote: { ...typography.footnote, color: colors.accentDark, flex: 1 },
  itemPrice: { ...typography.subheadline, color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  orderNote: { padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.accentSoft, gap: spacing.xs },
  orderNoteLabel: { ...typography.micro, color: colors.accentDark, letterSpacing: 0.7 },
  orderNoteText: { ...typography.subheadline, color: colors.ink },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  customerCopy: { flex: 1, gap: 2 },
  totalCopy: { alignItems: 'flex-end', gap: 2 },
  metaLabel: { ...typography.micro, color: colors.inkTertiary, letterSpacing: 0.6 },
  customer: { ...typography.headline, color: colors.ink },
  metaValue: { ...typography.caption, color: colors.inkSecondary },
  total: { ...typography.title2, color: colors.ink, fontVariant: ['tabular-nums'] },
  doneButton: { marginTop: spacing.xs },
  secondaryActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
