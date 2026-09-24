import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { CheckCircle2, ClipboardList, Plus } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ActiveOrderCard } from '@/components/order/ActiveOrderCard';
import { UpcomingOrderRow } from '@/components/order/UpcomingOrderRow';
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
import { colors, spacing, typography } from '@/theme';
import type { Order } from '@/types';
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

  const handleStart = async () => {
    if (!activeOrder) return;
    try {
      await startOrder.mutateAsync(activeOrder.id);
      await triggerHaptic('selection');
    } catch (caught) {
      showToast({ title: 'Could not start order', message: getErrorMessage(caught), tone: 'error' });
      void triggerHaptic('error');
    }
  };

  const handleDone = async () => {
    if (!activeOrder) return;
    const number = activeOrder.orderNumber;
    try {
      await completeOrder.mutateAsync(activeOrder.id);
      await triggerHaptic('success');
      showToast({ title: `Order #${number} complete` });
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
        actions={(
          <Button
            title="New order"
            size="sm"
            icon={<Plus size={15} color={colors.accent} />}
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
                icon={<Plus size={16} color={colors.accent} />}
                onPress={() => router.push('/cashier')}
              />
            )}
          />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.queueMeta}>
            <ClipboardList size={15} color={colors.accentDark} />
            <Text style={styles.queueMetaText}>
              {queue.length} {queue.length === 1 ? 'order' : 'orders'} in queue
            </Text>
          </View>

          <ActiveOrderCard
            key={activeOrder.id}
            order={activeOrder}
            completing={completeOrder.isPending}
            starting={startOrder.isPending}
            cancelling={cancelOrder.isPending}
            onDone={() => void handleDone()}
            onStart={() => void handleStart()}
            onCancel={role === 'BARISTA' ? undefined : () => setCancelTarget(activeOrder)}
          />

          {visibleUpcoming.length > 0 ? (
            <View style={styles.upcomingSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Up next</Text>
                <Text style={styles.sectionMeta}>{upcoming.length} waiting</Text>
              </View>
              <View style={styles.ticketList}>
                {visibleUpcoming.map((order) => (
                  <UpcomingOrderRow key={order.id} order={order} />
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
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  emptyCard: {
    minHeight: 340,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  queueMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: -spacing.sm },
  queueMetaText: { ...typography.caption, color: colors.inkSecondary },
  upcomingSection: { gap: spacing.sm, marginTop: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.headline, color: colors.ink },
  sectionMeta: { ...typography.caption, color: colors.inkTertiary },
  ticketList: { gap: spacing.sm },
  moreText: { ...typography.caption, color: colors.inkTertiary, textAlign: 'center', paddingTop: spacing.xs },
  confirmActions: { flexDirection: 'row', gap: spacing.sm },
  confirmButton: { flex: 1 },
  confirmCopy: { ...typography.body, color: colors.inkSecondary, paddingVertical: spacing.sm },
});
