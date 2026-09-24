import { useCallback, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, History as HistoryIcon, RefreshCw, Search, SlidersHorizontal } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OrderDetailModal } from '@/components/order/OrderDetailModal';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SheetModal } from '@/components/ui/SheetModal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useOrdersQuery } from '@/services/orders';
import { colors, radii, spacing, typography } from '@/theme';
import type { Order, OrderStatus } from '@/types';
import { formatTime, toDateKey } from '@/utils/dates';
import { formatCurrency } from '@/utils/formatters';
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

const statusColors: Record<OrderStatus, string> = {
  PENDING: colors.pending,
  IN_PROGRESS: colors.progress,
  COMPLETED: colors.completed,
  CANCELLED: colors.cancelled,
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
            icon={<RefreshCw size={17} color={colors.inkSecondary} />}
            onPress={() => void refetch()}
            disabled={isFetching}
          />
        )}
      />

      <View style={styles.toolbar}>
        <View style={styles.dateRow}>
          <View style={styles.dateControl}>
            <SegmentedControl<DatePreset>
              value={datePreset}
              onChange={setDatePreset}
              segments={[
                { value: 'today', label: 'Today' },
                { value: 'date', label: 'Date' },
              ]}
            />
          </View>
          <FilterButton active={hasAdvancedFilters} onPress={openFilters} />
        </View>

        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search tickets, items, or staff"
          left={<Search size={17} color={colors.inkTertiary} />}
          clearButtonMode="while-editing"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFilters}
        >
          {quickStatuses.map((filter) => (
            <FilterChip
              key={filter}
              label={statusLabels[filter]}
              selected={status === filter}
              onPress={() => setStatus(filter)}
            />
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
            <Text style={styles.ticketHeaderCount}>{filteredOrders.length}</Text>
          </View>
          <View style={styles.ticketList}>
            {filteredOrders.map((order, index) => (
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
                    <View style={[styles.statusDot, { backgroundColor: statusColors[order.status] }]} />
                    <Text style={[styles.ticketStatus, { color: statusColors[order.status] }]}>
                      {statusLabels[order.status]}
                    </Text>
                  </View>
                </View>
                <View style={styles.ticketAmountBlock}>
                  <Text style={styles.ticketAmount}>{formatCurrency(getOrderSubtotal(order))}</Text>
                  <Text style={styles.ticketItems}>{getOrderItemCount(order)} items</Text>
                </View>
                <ChevronRight size={16} color={colors.inkTertiary} />
              </Pressable>
            ))}
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
                <FilterChip
                  key={filter}
                  label={statusLabels[filter]}
                  selected={statusDraft === filter}
                  onPress={() => setStatusDraft(filter)}
                />
              ))}
            </View>
          </View>
        </View>
      </SheetModal>

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </Screen>
  );
}

function FilterButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.filterButtonShell, active && styles.filterButtonActive, pressed && styles.filterButtonPressed]}>
      <SlidersHorizontal size={16} color={active ? colors.accentDark : colors.inkSecondary} />
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>Filter</Text>
    </Pressable>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.chipPressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
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
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateControl: { flex: 1 },
  filterButtonShell: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterButtonActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  filterButtonPressed: { opacity: 0.65 },
  filterButtonText: { ...typography.footnote, color: colors.inkSecondary },
  filterButtonTextActive: { color: colors.accentDark },
  quickFilters: { gap: spacing.xs, paddingRight: spacing.lg },
  chip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted },
  chipSelected: { backgroundColor: colors.ink },
  chipPressed: { opacity: 0.65 },
  chipText: { ...typography.caption, color: colors.inkSecondary },
  chipTextSelected: { color: colors.white },
  emptyCard: { minHeight: 320, borderRadius: radii.xxl, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface },
  ticketSection: { gap: spacing.sm },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  ticketHeaderLabel: { ...typography.overline, color: colors.inkTertiary },
  ticketHeaderCount: { ...typography.caption, color: colors.inkTertiary },
  ticketList: { overflow: 'hidden', borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface },
  ticketRow: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  ticketDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  ticketPressed: { backgroundColor: colors.surfacePressed },
  ticketNumberBlock: { width: 58, alignItems: 'flex-start', gap: 2 },
  ticketNumber: { ...typography.headline, color: colors.ink, fontVariant: ['tabular-nums'] },
  ticketTime: { ...typography.caption, color: colors.inkTertiary },
  ticketCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  ticketSummary: { ...typography.footnote, color: colors.ink },
  ticketMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ticketMeta: { ...typography.caption, color: colors.inkTertiary },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  ticketStatus: { ...typography.caption },
  ticketAmountBlock: { alignItems: 'flex-end', gap: 2 },
  ticketAmount: { ...typography.subheadline, color: colors.ink, fontVariant: ['tabular-nums'] },
  ticketItems: { ...typography.caption, color: colors.inkTertiary },
  filterContent: { gap: spacing.xl },
  filterSection: { gap: spacing.sm },
  filterLabel: { ...typography.overline, color: colors.inkTertiary },
  dateInputs: { gap: spacing.sm },
  advancedStatuses: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  filterActions: { flexDirection: 'row', gap: spacing.sm },
  filterButton: { flex: 1 },
});
