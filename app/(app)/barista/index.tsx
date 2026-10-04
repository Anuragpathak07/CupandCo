import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Banknote, CheckCircle2, Plus, QrCode } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ActiveOrderCard } from '@/components/order/ActiveOrderCard';
import { UpcomingOrderRow } from '@/components/order/UpcomingOrderRow';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SheetModal } from '@/components/ui/SheetModal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import {
  useCancelOrderMutation,
  useCompleteOrderMutation,
  useOrdersQuery,
  useRealtimeOrders,
  useStartOrderMutation,
} from '@/services/orders';
import { useAuthStore } from '@/store/authStore';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import type { Order, PaymentMethod } from '@/types';
import { formatCurrency, pluralize } from '@/utils/formatters';
import { getOrderSubtotal } from '@/utils/orders';
import { triggerHaptic } from '@/utils/haptics';

export default function BaristaQueueScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const role = useAuthStore((state) => state.user?.role);
  const { data: orders, isLoading, isError, error, refetch } = useOrdersQuery();
  useRealtimeOrders();
  const completeOrder = useCompleteOrderMutation();
  const startOrder = useStartOrderMutation();
  const cancelOrder = useCancelOrderMutation();
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Order | null>(null);

  const queue = useMemo(
    () =>
      (orders ?? [])
        .filter((order) => order.status === 'PENDING' || order.status === 'IN_PROGRESS')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [orders],
  );
  const activeOrder = queue.find((order) => order.status === 'IN_PROGRESS') ?? queue[0] ?? null;
  const upcoming = queue.filter((order) => order.id !== activeOrder?.id);
  const visibleUpcoming = upcoming.slice(0, 3);
  const hiddenCount = Math.max(0, upcoming.length - visibleUpcoming.length);

  const handleStart = async (target: Order) => {
    try {
      await startOrder.mutateAsync(target.id);
      await triggerHaptic('selection');
    } catch (caught) {
      showToast({ title: 'Could not start order', message: getErrorMessage(caught), tone: 'error' });
      void triggerHaptic('error');
    }
  };

  const handleDone = async (target: Order, paymentMethod: PaymentMethod) => {
    const number = target.orderNumber;
    try {
      await completeOrder.mutateAsync({ id: target.id, paymentMethod });
      if (expandedOrderId === target.id) setExpandedOrderId(null);
      setCompleteTarget(null);
      await triggerHaptic('success');
      showToast({ title: `Order #${number} complete · paid by ${paymentMethod === 'CASH' ? 'cash' : 'UPI'}` });
    } catch (caught) {
      showToast({ title: 'Could not complete order', message: getErrorMessage(caught), tone: 'error' });
      void triggerHaptic('error');
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelOrder.mutateAsync(cancelTarget.id);
      showToast({ title: `Order #${cancelTarget.orderNumber} cancelled` });
      if (expandedOrderId === cancelTarget.id) setExpandedOrderId(null);
      setCancelTarget(null);
    } catch (caught) {
      showToast({ title: 'Could not cancel order', message: getErrorMessage(caught), tone: 'error' });
    }
  };

  return (
    <Screen includeTopInset={false}>
      <PageHeader
        eyebrow="SERVICE"
        title="Orders"
        badge={
          queue.length > 0 ? (
            <Badge label={pluralize(queue.length, 'order')} tone="dark" />
          ) : undefined
        }
        actions={(
          <Button
            title="New order"
            variant="dark"
            size="sm"
            icon={<Plus size={15} color={colors.white} />}
            onPress={() => router.push('/cashier')}
          />
        )}
      />

      {isLoading && !orders ? (
        <LoadingState label="Loading orders…" />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : !activeOrder ? (
        <View style={styles.emptyCard}>
          <EmptyState
            icon={<CheckCircle2 size={27} color={colors.completed} />}
            title="Queue clear"
            message="New orders appear here automatically."
            action={(
              <Button
                title="Add new order"
                variant="dark"
                icon={<Plus size={16} color={colors.white} />}
                onPress={() => router.push('/cashier')}
              />
            )}
          />
        </View>
      ) : (
        <View style={styles.content}>
          <ActiveOrderCard
            key={activeOrder.id}
            order={activeOrder}
            completing={completeOrder.isPending && completeOrder.variables?.id === activeOrder.id}
            starting={startOrder.isPending && startOrder.variables === activeOrder.id}
            cancelling={cancelOrder.isPending && cancelTarget?.id === activeOrder.id}
            onDone={() => setCompleteTarget(activeOrder)}
            onStart={() => void handleStart(activeOrder)}
            onCancel={role === 'BARISTA' ? undefined : () => setCancelTarget(activeOrder)}
          />

          {visibleUpcoming.length > 0 ? (
            <View style={styles.upcomingSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Up next</Text>
                <Badge label={`${upcoming.length} waiting`} tone="neutral" />
              </View>
              <View style={styles.ticketList}>
                {visibleUpcoming.map((order) => (
                  <UpcomingOrderRow
                    key={order.id}
                    order={order}
                    expanded={expandedOrderId === order.id}
                    onToggle={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}
                    completing={completeOrder.isPending && completeOrder.variables?.id === order.id}
                    starting={startOrder.isPending && startOrder.variables === order.id}
                    cancelling={cancelOrder.isPending && cancelTarget?.id === order.id}
                    onDone={() => setCompleteTarget(order)}
                    onStart={() => void handleStart(order)}
                    onCancel={role === 'BARISTA' ? undefined : () => setCancelTarget(order)}
                  />
                ))}
              </View>
              {hiddenCount > 0 ? <Text style={styles.moreText}>+{hiddenCount} more waiting</Text> : null}
            </View>
          ) : null}
        </View>
      )}

      <SheetModal
        visible={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title={`Cancel order #${cancelTarget?.orderNumber ?? ''}?`}
        subtitle="It will remain in history as cancelled."
        variant="center"
        scroll={false}
        footer={(
          <View style={styles.confirmActions}>
            <Button title="Keep order" variant="secondary" onPress={() => setCancelTarget(null)} style={styles.confirmButton} />
            <Button
              title="Cancel order"
              variant="danger"
              loading={cancelOrder.isPending}
              onPress={() => void handleCancel()}
              style={styles.confirmButton}
            />
          </View>
        )}
      >
        <Text style={styles.confirmCopy}>This does not change completed orders or revenue.</Text>
      </SheetModal>

      <SheetModal
        visible={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        title={`Order #${completeTarget?.orderNumber ?? ''} done?`}
        subtitle={completeTarget ? `${formatCurrency(getOrderSubtotal(completeTarget))} · how was it paid?` : undefined}
        variant="center"
        scroll={false}
        footer={(
          <View style={styles.confirmActions}>
            <Button
              title="Cash"
              variant="secondary"
              loading={completeOrder.isPending}
              onPress={() => completeTarget && void handleDone(completeTarget, 'CASH')}
              icon={<Banknote size={16} color={colors.ink} />}
              style={styles.confirmButton}
            />
            <Button
              title="UPI"
              variant="dark"
              loading={completeOrder.isPending}
              onPress={() => completeTarget && void handleDone(completeTarget, 'UPI')}
              icon={<QrCode size={16} color={colors.white} />}
              style={styles.confirmButton}
            />
          </View>
        )}
      >
        <Text style={styles.confirmCopy}>This records the payment method so history shows cash vs UPI.</Text>
      </SheetModal>
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  content: { gap: spacing.xxl },
  emptyCard: {
    minHeight: 340,
    borderRadius: radii.xxl,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    ...shadows.level1,
  },
  upcomingSection: { gap: spacing.md, marginTop: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.headline, color: colors.ink },
  ticketList: { gap: spacing.sm },
  moreText: { ...typography.caption, color: colors.inkTertiary, textAlign: 'center', paddingTop: spacing.xs },
  confirmActions: { flexDirection: 'row', gap: spacing.sm },
  confirmButton: { flex: 1 },
  confirmCopy: { ...typography.body, color: colors.inkSecondary, paddingVertical: spacing.sm },
});

