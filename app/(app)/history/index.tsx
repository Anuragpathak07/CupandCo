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
import { useOrdersQuery } from '@/services/orders';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import type { Order, OrderStatus } from '@/types';
import { formatTime, toDateKey } from '@/utils/dates';
import { formatCurrency, pluralize } from '@/utils/formatters';
import { getOrderItemCount, getOrderSubtotal } from '@/utils/orders';

type DatePreset = 'today' | 'date';
type StatusFilter = 'ALL' | OrderStatus;

const INITIAL_TODAY_KEY = toDateKey(new Date());
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
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [customRange, setCustomRange] = useState({ start: INITIAL_TODAY_KEY, end: INITIAL_TODAY_KEY });
  const [filterOpen, setFilterOpen] = useState(false);
  const [rangeDraft, setRangeDraft] = useState(customRange);
  const [statusDraft, setStatusDraft] = useState<StatusFilter>('ALL');
  const [rangeError, setRangeError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const dateMatches = useCallback(
    (order: Order) => {
      if (datePreset === 'today') return toDateKey(order.createdAt) === INITIAL_TODAY_KEY;
      const key = toDateKey(order.createdAt);
      return key >= customRange.start && key <= customRange.end;
    },
    [customRange.end, customRange.start, datePreset],
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

  const hasAdvancedFilters = datePreset === 'date' || status === 'CANCELLED';

  const openFilters = () => {
    setRangeDraft(customRange);
    setStatusDraft(status);
    setRangeError('');
    setFilterOpen(true);
  };

  const applyFilters = () => {
    const start = parseDateKey(rangeDraft.start);
    const end = parseDateKey(rangeDraft.end);
    if (!start || !end || start > end) {
      setRangeError('Enter valid dates as YYYY-MM-DD with the start on or before the end.');
      return;
    }
    setCustomRange({ start: rangeDraft.start, end: rangeDraft.end });
    setStatus(statusDraft);
    setDatePreset('date');
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setDatePreset('today');
    setStatus('ALL');
    setCustomRange({ start: INITIAL_TODAY_KEY, end: INITIAL_TODAY_KEY });
    setRangeDraft({ start: INITIAL_TODAY_KEY, end: INITIAL_TODAY_KEY });
    setStatusDraft('ALL');
    setRangeError('');
    setFilterOpen(false);
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
          <SegmentedControl<DatePreset>
            value={datePreset}
            onChange={setDatePreset}
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
          <View style={styles.filterActions}>
            <Button title="Reset" variant="secondary" onPress={resetFilters} style={styles.filterButton} />
            <Button title="Apply filters" onPress={applyFilters} style={styles.filterButton} />
          </View>
        )}
      >
        <View style={styles.filterContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>DATE RANGE</Text>
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
          </View>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>STATUS</Text>
            <View style={styles.advancedStatuses}>
              {allStatuses.map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setStatusDraft(filter)}
                  style={[styles.chip, statusDraft === filter && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, statusDraft === filter && styles.chipTextSelected]}>
                    {statusLabels[filter]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </SheetModal>

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
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
  ticketItems: { ...typography.caption, color: colors.inkTertiary },
  filterContent: { gap: spacing.xl },
  filterSection: { gap: spacing.sm },
  filterLabel: { ...typography.overline, color: colors.inkTertiary },
  dateInputs: { gap: spacing.sm },
  advancedStatuses: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  filterActions: { flexDirection: 'row', gap: spacing.sm },
  filterButton: { flex: 1 },
});

