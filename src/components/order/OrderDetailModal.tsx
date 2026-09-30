import { CheckCircle2, Clock3, MessageSquareText, ReceiptText, Trash2, UserRound } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SheetModal } from '@/components/ui/SheetModal';
import { colors, radii, spacing, typography } from '@/theme';
import type { Order } from '@/types';
import { formatDate, formatDuration, formatTime } from '@/utils/dates';
import { formatCurrency } from '@/utils/formatters';
import { getOrderItemCount, getOrderSubtotal } from '@/utils/orders';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
}

export function OrderDetailModal({ order, onClose, canDelete = false, deleting = false, onDelete }: OrderDetailModalProps) {
  const prepSeconds = order?.startedAt && order.completedAt
    ? Math.max(0, (new Date(order.completedAt).getTime() - new Date(order.startedAt).getTime()) / 1000)
    : 0;

  return (
    <SheetModal
      visible={Boolean(order)}
      onClose={onClose}
      title={order ? `Order #${order.orderNumber}` : 'Order details'}
      subtitle={order ? formatDate(order.createdAt, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : undefined}
      footer={
        canDelete && order && onDelete ? (
          <Button
            title="Delete ticket"
            variant="danger"
            loading={deleting}
            icon={<Trash2 size={16} color={colors.danger} />}
            onPress={onDelete}
            fullWidth
          />
        ) : null
      }
    >
      {order ? (
        <View style={styles.container}>
          <View style={styles.topRow}>
            <StatusBadge status={order.status} />
            <View style={styles.timeBlock}>
              <Clock3 size={15} color={colors.inkTertiary} />
              <Text style={styles.timeText}>Placed {formatTime(order.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCard}>
              <UserRound size={17} color={colors.accentDark} />
              <View><Text style={styles.metaLabel}>Created by</Text><Text style={styles.metaValue}>{order.createdByName ?? 'Staff member'}</Text></View>
            </View>
            <View style={styles.metaCard}>
              {order.completedAt ? <CheckCircle2 size={17} color={colors.completed} /> : <ReceiptText size={17} color={colors.progress} />}
              <View><Text style={styles.metaLabel}>{order.completedAt ? 'Prep time' : 'Current status'}</Text><Text style={styles.metaValue}>{order.completedAt ? formatDuration(prepSeconds) : order.status === 'IN_PROGRESS' ? 'In progress' : 'Waiting'}</Text></View>
            </View>
          </View>

          <View style={styles.itemsCard}>
            <Text style={styles.sectionTitle}>Items · {getOrderItemCount(order)}</Text>
            <View style={styles.items}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.quantity}>{item.quantity}×</Text>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    {item.notes ? (
                      <View style={styles.noteRow}>
                        <MessageSquareText size={13} color={colors.accentDark} />
                        <Text style={styles.itemNote}>{item.notes}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.snapshot}>Saved at {formatCurrency(item.unitPrice)} each</Text>
                  </View>
                  <Text style={styles.itemTotal}>{formatCurrency(item.unitPrice * item.quantity)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Order total</Text>
              <Text style={styles.total}>{formatCurrency(getOrderSubtotal(order))}</Text>
            </View>
          </View>

          {order.notes ? (
            <View style={styles.orderNote}>
              <Text style={styles.noteLabel}>ORDER NOTE</Text>
              <Text style={styles.noteText}>{order.notes}</Text>
            </View>
          ) : null}

          <View style={styles.timeline}>
            <Text style={styles.metaLabel}>Timeline</Text>
            <Text style={styles.timelineText}>Placed at {formatTime(order.createdAt)}</Text>
            {order.startedAt ? <Text style={styles.timelineText}>Started at {formatTime(order.startedAt)}</Text> : null}
            {order.completedAt ? <Text style={styles.timelineText}>Completed at {formatTime(order.completedAt)}</Text> : null}
          </View>
        </View>
      ) : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  timeText: { ...typography.footnote, color: colors.inkSecondary },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metaCard: { flexGrow: 1, flexBasis: 180, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surfaceMuted },
  metaLabel: { ...typography.caption, color: colors.inkTertiary },
  metaValue: { ...typography.subheadline, color: colors.ink },
  itemsCard: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionTitle: { ...typography.headline, color: colors.ink, padding: spacing.md, backgroundColor: colors.surfaceMuted },
  items: { padding: spacing.md, gap: spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  quantity: { ...typography.headline, color: colors.accentDark, minWidth: 27, fontVariant: ['tabular-nums'] },
  itemCopy: { flex: 1, gap: 2 },
  itemName: { ...typography.subheadline, color: colors.ink },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemNote: { ...typography.footnote, color: colors.accentDark, flex: 1 },
  snapshot: { ...typography.caption, color: colors.inkTertiary },
  itemTotal: { ...typography.subheadline, color: colors.ink, fontVariant: ['tabular-nums'] },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.surfaceMuted },
  totalLabel: { ...typography.subheadline, color: colors.inkSecondary },
  total: { ...typography.title3, color: colors.ink, fontVariant: ['tabular-nums'] },
  orderNote: { padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.accentSoft, gap: spacing.xs },
  noteLabel: { ...typography.micro, color: colors.accentDark, letterSpacing: 0.7 },
  noteText: { ...typography.subheadline, color: colors.ink },
  timeline: { padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surfaceMuted, gap: spacing.xs },
  timelineText: { ...typography.footnote, color: colors.inkSecondary },
});
