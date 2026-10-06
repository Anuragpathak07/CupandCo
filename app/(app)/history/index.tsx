import { useCallback, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, History as HistoryIcon, RefreshCw, Search, SlidersHorizontal } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OrderDetailModal } from '@/components/order/OrderDetailModal';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SheetModal } from '@/components/ui/SheetModal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { useDeleteOrderMutation, useOrdersQuery } from '@/services/orders';
import { useAuthStore } from '@/store/authStore';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import type { Order, OrderStatus } from '@/types';
import {
  addDays,
  addMonths,
  endOfMonth,
  formatDate,
  formatTime,
  startOfMonth,
  startOfWeek,
  toDateKey,
} from '@/utils/dates';
import { formatCurrency, pluralize } from '@/utils/formatters';
import { triggerHaptic } from '@/utils/haptics';
import { getOrderItemCount, getOrderSubtotal, getPaymentMethodLabel } from '@/utils/orders';

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'custom';
type StatusFilter = 'ALL' | OrderStatus;

const shortDay = (date: Date) => formatDate(date, { day: 'numeric', month: 'short' });
const shortMonth = (date: Date) => formatDate(date, { month: 'short' });
const quickStatuses: StatusFilter[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];
const allStatuses: StatusFilter[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const statusLabels: Record<StatusFilter, string> = {
  ALL: 'All',
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function OrderHistoryScreen() {
  const { data: orders, isLoading, isError, error, refetch, isFetching } = useOrdersQuery();
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const deleteOrder = useDeleteOrderMutation();
  const canDelete = user?.role === 'OWNER';
  const now = useMemo(() => new Date(), []);
  const todayKey = toDateKey(now);
  const [preset, setPreset] = useState<DatePreset>('today');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [customRange, setCustomRange] = useState({ start: todayKey, end: todayKey });
  const [filterOpen, setFilterOpen] = useState(false);
  const [presetDraft, setPresetDraft] = useState<DatePreset>('today');
  const [rangeDraft, setRangeDraft] = useState(customRange);
  const [statusDraft, setStatusDraft] = useState<StatusFilter>('ALL');
  const [rangeError, setRangeError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  const range = useMemo(() => {
    switch (preset) {
      case 'yesterday': {
        const key = toDateKey(addDays(now, -1));
        return { start: key, end: key };
      }
      case 'week':
        return { start: toDateKey(startOfWeek(now)), end: todayKey };
      case 'month':
        return { start: toDateKey(startOfMonth(now)), end: todayKey };
      case 'lastMonth': {
        const start = addMonths(now, -1);
        const end = endOfMonth(start);
        return { start: toDateKey(start), end: toDateKey(end) };
      }
      case 'custom':
        return { start: customRange.start, end: customRange.end };
      default:
        return { start: todayKey, end: todayKey };
    }
  }, [customRange.end, customRange.start, now, preset, todayKey]);

  const dateOptions = useMemo(
    () => [
      { value: 'today' as DatePreset, label: `Today, ${shortDay(now)}` },
      { value: 'yesterday' as DatePreset, label: `Yesterday, ${shortDay(addDays(now, -1))}` },
      {
        value: 'week' as DatePreset,
        label: `This week, ${shortDay(startOfWeek(now))}–${shortDay(now)}`,
      },
      { value: 'month' as DatePreset, label: `This month, ${shortMonth(now)}` },
      { value: 'lastMonth' as DatePreset, label: `Last month, ${shortMonth(addMonths(now, -1))}` },
      { value: 'custom' as DatePreset, label: 'Custom' },
    ],
    [now],
  );

  const dateMatches = useCallback(
    (order: Order) => {
      const key = toDateKey(order.createdAt);
      return key >= range.start && key <= range.end;
    },
    [range.end, range.start],
  );

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (orders ?? [])
      .filter(dateMatches)
      .filter((order) => status === 'ALL' || order.status === status)
      .filter((order) => {
        if (!term) return true;
        return (
          String(order.orderNumber).includes(term) ||
          `${order.createdByName ?? ''} ${order.items.map((item) => item.itemName).join(' ')}`
            .toLowerCase()
            .includes(term)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [dateMatches, orders, search, status]);

  const hasAdvancedFilters = preset !== 'today' || status === 'CANCELLED';

  const openFilters = () => {
    setPresetDraft(preset);
    setRangeDraft(customRange);
    setStatusDraft(status);
    setRangeError('');
    setFilterOpen(true);
  };

  const applyFilters = () => {
    if (presetDraft === 'custom') {
      const start = parseDateKey(rangeDraft.start);
      const end = parseDateKey(rangeDraft.end);
      if (!start || !end || start > end) {
        setRangeError('Enter valid dates as YYYY-MM-DD with the start on or before the end.');
        return;
      }
      setCustomRange({ start: rangeDraft.start, end: rangeDraft.end });
    }
    setPreset(presetDraft);
    setStatus(statusDraft);
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setPreset('today');
    setPresetDraft('today');
    setStatus('ALL');
    setCustomRange({ start: todayKey, end: todayKey });
    setRangeDraft({ start: todayKey, end: todayKey });
    setStatusDraft('ALL');
    setRangeError('');
    setFilterOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOrder.mutateAsync(deleteTarget.id);
      await triggerHaptic('success');
      showToast({ title: `Order #${deleteTarget.orderNumber} deleted` });
      if (selectedOrder?.id === deleteTarget.id) setSelectedOrder(null);
      setDeleteTarget(null);
    } catch (caught) {
      showToast({ title: 'Could not delete ticket', message: getErrorMessage(caught), tone: 'error' });
    }
  };

  return (
    <Screen includeTopInset={false}>
      <PageHeader
        eyebrow="SERVICE"
        title="History"
        actions={(
          <IconButton
            label="Refresh history"
            variant="soft"
            icon={<RefreshCw size={16} color={colors.inkSecondary} />}
            onPress={() => void refetch()}
            disabled={isFetching}
          />
        )}
      />

      <View style={styles.toolbar}>
        <View style={styles.topControlRow}>
          <SegmentedControl<'today' | 'date'>
            value={preset === 'today' ? 'today' : 'date'}
            onChange={(mode) => {
              if (mode === 'today') setPreset('today');
              else openFilters();
            }}
            segments={[
              { value: 'today', label: 'Today' },
              { value: 'date', label: 'Date' },
            ]}
          />
        </View>

        <View style={styles.searchRow}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search tickets, items, or staff"
            left={<Search size={17} color={colors.inkTertiary} />}
            clearButtonMode="while-editing"
            containerStyle={styles.searchInput}
          />
          <IconButton
            label="Filter options"
            variant={hasAdvancedFilters ? 'soft' : 'soft'}
            icon={<SlidersHorizontal size={17} color={hasAdvancedFilters ? colors.accentDark : colors.inkSecondary} />}
            onPress={openFilters}
            style={hasAdvancedFilters ? styles.activeFilterIcon : undefined}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFilters}
        >
          {quickStatuses.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setStatus(filter)}
              accessibilityRole="tab"
              accessibilityState={{ selected: status === filter }}
              style={({ pressed }) => [
                styles.chip,
                status === filter && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, status === filter && styles.chipTextSelected]}>
                {statusLabels[filter]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingState label="Loading history…" />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyCard}>
          <EmptyState
            icon={<HistoryIcon size={26} color={colors.accentDark} />}
            title="No tickets found"
            message="Try another date, status, or search."
          />
        </View>
      ) : (
        <View style={styles.ticketSection}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketHeaderLabel}>RECENT TICKETS</Text>
            <Badge label={`${filteredOrders.length}`} tone="neutral" />
          </View>
          <View style={styles.ticketList}>
            {filteredOrders.map((order, index) => {
              const itemCount = getOrderItemCount(order);
              return (
                <Pressable
                  key={order.id}
                  onPress={() => setSelectedOrder(order)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open order ${order.orderNumber}`}
                  style={({ pressed }) => [
                    styles.ticketRow,
                    index < filteredOrders.length - 1 && styles.ticketDivider,
                    pressed && styles.ticketPressed,
                  ]}
                >
                  <View style={styles.ticketNumberBlock}>
                    <Text style={styles.ticketNumber}>#{order.orderNumber}</Text>
                    <Text style={styles.ticketTime}>{formatTime(order.createdAt)}</Text>
                  </View>
                  <View style={styles.ticketCopy}>
                    <Text numberOfLines={1} style={styles.ticketSummary}>
                      {order.items.map((item) => `${item.quantity}× ${item.itemName}`).join(' · ')}
                    </Text>
                    <View style={styles.ticketMetaRow}>
                      <Text style={styles.ticketMeta}>{order.createdByName ?? 'Counter order'}</Text>
                      <StatusBadge status={order.status} />
                    </View>
                  </View>
                  <View style={styles.ticketAmountBlock}>
                    <Text style={styles.ticketAmount}>{formatCurrency(getOrderSubtotal(order))}</Text>
                    {order.paymentMethod ? (
                      <Text style={styles.ticketPayment}>{getPaymentMethodLabel(order.paymentMethod)}</Text>
                    ) : null}
                    <Text style={styles.ticketItems}>{pluralize(itemCount, 'item')}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.inkTertiary} />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <SheetModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filters"
        subtitle="Choose a date range and order status."
        footer={(
          <View style={styles.filterFooter}>
            <Button title="Reset" variant="secondary" onPress={resetFilters} fullWidth size="lg" />
            <Button title="Apply filters" onPress={applyFilters} fullWidth size="lg" />
          </View>
        )}
      >
        <View style={styles.filterContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>DATE RANGE</Text>
            <View>
              {dateOptions.map(({ value, label }, index) => {
                const selected = presetDraft === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setPresetDraft(value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      index < dateOptions.length - 1 && styles.optionDivider,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {presetDraft === 'custom' ? (
              <View style={styles.dateInputs}>
                <Input
                  label="Start"
                  value={rangeDraft.start}
                  onChangeText={(value) => setRangeDraft((draft) => ({ ...draft, start: value }))}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  left={<CalendarDays size={16} color={colors.inkTertiary} />}
                  error={rangeError || undefined}
                />
                <Input
                  label="End"
                  value={rangeDraft.end}
                  onChangeText={(value) => setRangeDraft((draft) => ({ ...draft, end: value }))}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  left={<CalendarDays size={16} color={colors.inkTertiary} />}
                />
              </View>
            ) : null}
          </View>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>STATUS</Text>
            <View>
              {allStatuses.map((filter, index) => {
                const selected = statusDraft === filter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setStatusDraft(filter)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      index < allStatuses.length - 1 && styles.optionDivider,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {statusLabels[filter]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </SheetModal>

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        canDelete={canDelete}
        deleting={deleteOrder.isPending}
        onDelete={selectedOrder ? () => setDeleteTarget(selectedOrder) : undefined}
      />

      <SheetModal
        visible={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete Order #${deleteTarget?.orderNumber ?? ''}?`}
        subtitle="This permanently removes the ticket and its items."
        variant="center"
        scroll={false}
        footer={(
          <View style={styles.deleteActions}>
            <Button title="Cancel" variant="secondary" onPress={() => setDeleteTarget(null)} style={styles.flexButton} />
            <Button
              title="Delete"
              variant="danger"
              loading={deleteOrder.isPending}
              onPress={() => void confirmDelete()}
              style={styles.flexButton}
            />
          </View>
        )}
      >
        <Text style={styles.deleteCopy}>
          Only owners see this action. Deleted tickets cannot be recovered and are removed from reports.
        </Text>
      </SheetModal>
    </Screen>
  );
}

function parseDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) || toDateKey(date) !== value ? null : value;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  toolbar: { gap: spacing.md, marginBottom: spacing.xl },
  topControlRow: { flexDirection: 'row', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchInput: { flex: 1 },
  activeFilterIcon: { backgroundColor: colors.accentSoft },
  quickFilters: { gap: spacing.xs, paddingRight: spacing.lg },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.secondarySurface,
  },
  chipSelected: { backgroundColor: colors.ink },
  chipPressed: { opacity: 0.75 },
  chipText: { ...typography.caption, color: colors.inkSecondary, fontWeight: '500' },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  emptyCard: { minHeight: 320, borderRadius: radii.xxl, backgroundColor: colors.surface, ...shadows.level1 },
  ticketSection: { gap: spacing.sm },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  ticketHeaderLabel: { ...typography.overline, color: colors.inkTertiary },
  ticketList: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.level1,
  },
  ticketRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  ticketDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  ticketPressed: { backgroundColor: colors.surfacePressed },
  ticketNumberBlock: { width: 58, alignItems: 'flex-start', gap: 2 },
  ticketNumber: { ...typography.headline, color: colors.ink, fontVariant: ['tabular-nums'] },
  ticketTime: { ...typography.caption, color: colors.inkTertiary },
  ticketCopy: { flex: 1, minWidth: 0, gap: 4 },
  ticketSummary: { ...typography.bodyMedium, color: colors.ink },
  ticketMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketMeta: { ...typography.caption, color: colors.inkTertiary },
  ticketAmountBlock: { alignItems: 'flex-end', gap: 2 },
  ticketAmount: { ...typography.body, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  ticketPayment: { ...typography.caption, color: colors.accentDark, fontWeight: '600' },
  ticketItems: { ...typography.caption, color: colors.inkTertiary },
  filterContent: { gap: spacing.xl },
  filterSection: { gap: spacing.sm },
  filterLabel: { ...typography.overline, color: colors.inkTertiary },
  dateInputs: { gap: spacing.sm, paddingTop: spacing.md },
  optionRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  optionDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  optionPressed: { opacity: 0.6 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  radioSelected: { borderColor: colors.ink },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.ink },
  optionLabel: { ...typography.body, color: colors.inkSecondary },
  optionLabelSelected: { color: colors.ink, fontWeight: '600' },
  filterFooter: { gap: spacing.sm },
  deleteActions: { flexDirection: 'row', gap: spacing.sm },
  flexButton: { flex: 1 },
  deleteCopy: { ...typography.body, color: colors.inkSecondary, paddingVertical: spacing.sm },
});

