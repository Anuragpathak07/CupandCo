import { useMemo, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShoppingBag,
  Timer,
  TrendingUp,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MetricCard } from '@/components/analytics/MetricCard';
import { PopularItemRow } from '@/components/analytics/PopularItemRow';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SheetModal } from '@/components/ui/SheetModal';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useOrdersQuery } from '@/services/orders';
import { colors, radii, spacing, typography } from '@/theme';
import { calculateAnalyticsForRange } from '@/utils/analytics';
import {
  addDays,
  addMonths,
  endOfMonth,
  formatDate,
  formatDuration,
  startOfMonth,
  startOfWeek,
  toDateKey,
} from '@/utils/dates';
import { formatCompactCurrency, formatCurrency } from '@/utils/formatters';

type RangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'custom';

const shortDay = (date: Date) => formatDate(date, { day: 'numeric', month: 'short' });
const shortMonth = (date: Date) => formatDate(date, { month: 'short' });

export default function AnalyticsScreen() {
  const { data: orders, isLoading, isError, error, refetch, isFetching } = useOrdersQuery();
  const now = useMemo(() => new Date(), []);
  const todayKey = toDateKey(now);

  const [preset, setPreset] = useState<RangePreset>('today');
  const [customRange, setCustomRange] = useState({ start: todayKey, end: todayKey });
  const [filterOpen, setFilterOpen] = useState(false);
  const [presetDraft, setPresetDraft] = useState<RangePreset>('today');
  const [rangeDraft, setRangeDraft] = useState({ start: todayKey, end: todayKey });
  const [rangeError, setRangeError] = useState('');

  const range = useMemo(() => {
    switch (preset) {
      case 'yesterday': {
        const day = addDays(now, -1);
        const key = toDateKey(day);
        return { start: key, end: key, label: `Yesterday, ${shortDay(day)}` };
      }
      case 'week': {
        const start = startOfWeek(now);
        return { start: toDateKey(start), end: todayKey, label: `This week, ${shortDay(start)}–${shortDay(now)}` };
      }
      case 'month':
        return { start: toDateKey(startOfMonth(now)), end: todayKey, label: `This month, ${shortMonth(now)}` };
      case 'lastMonth': {
        const start = addMonths(now, -1);
        const end = endOfMonth(start);
        return { start: toDateKey(start), end: toDateKey(end), label: `Last month, ${shortMonth(start)}` };
      }
      case 'custom':
        return { start: customRange.start, end: customRange.end, label: `${formatRangeKey(customRange.start)}–${formatRangeKey(customRange.end)}` };
      default:
        return { start: todayKey, end: todayKey, label: `Today, ${shortDay(now)}` };
    }
  }, [customRange.end, customRange.start, now, preset, todayKey]);

  const analytics = useMemo(
    () => calculateAnalyticsForRange(orders ?? [], range.start, range.end),
    [orders, range.end, range.start],
  );
  const totalInRange =
    analytics.statusCounts.completed +
    analytics.statusCounts.pending +
    analytics.statusCounts.inProgress +
    analytics.statusCounts.cancelled;
  const maxQuantity = analytics.popularItems[0]?.quantity ?? 1;
  const isFiltered = preset !== 'today';

  const options = useMemo(
    () => [
      { value: 'today' as RangePreset, label: `Today, ${shortDay(now)}` },
      { value: 'yesterday' as RangePreset, label: `Yesterday, ${shortDay(addDays(now, -1))}` },
      {
        value: 'week' as RangePreset,
        label: `This week, ${shortDay(startOfWeek(now))}–${shortDay(now)}`,
      },
      { value: 'month' as RangePreset, label: `This month, ${shortMonth(now)}` },
      { value: 'lastMonth' as RangePreset, label: `Last month, ${shortMonth(addMonths(now, -1))}` },
      { value: 'custom' as RangePreset, label: 'Custom' },
    ],
    [now],
  );

  const openFilters = () => {
    setPresetDraft(preset);
    setRangeDraft(customRange);
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
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setPreset('today');
    setPresetDraft('today');
    setCustomRange({ start: todayKey, end: todayKey });
    setRangeDraft({ start: todayKey, end: todayKey });
    setRangeError('');
    setFilterOpen(false);
  };

  return (
    <Screen includeTopInset={false}>
      <PageHeader
        eyebrow="INSIGHTS"
        title={preset === 'today' ? 'Today at a glance' : range.label}
        subtitle={`${range.label} · completed sales and workload`}
        actions={(
          <View style={styles.headerActions}>
            <IconButton
              label="Filter insights by date"
              variant="soft"
              icon={<CalendarDays size={17} color={isFiltered ? colors.accentDark : colors.inkSecondary} />}
              onPress={openFilters}
              style={isFiltered ? styles.activeFilterIcon : undefined}
            />
            <IconButton
              label="Refresh analytics"
              icon={<RefreshCw size={18} color={colors.inkSecondary} />}
              onPress={() => void refetch()}
              disabled={isFetching}
            />
          </View>
        )}
      />

      {isLoading ? (
        <LoadingState label="Calculating metrics…" />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <View style={styles.content}>
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Revenue"
              value={formatCurrency(analytics.revenue)}
              detail={`${analytics.orderCount} completed ${analytics.orderCount === 1 ? 'order' : 'orders'}`}
              icon={<Banknote size={19} color={colors.accentDark} />}
              tone="amber"
            />
            <MetricCard
              label="Average order"
              value={formatCompactCurrency(analytics.averageOrderValue)}
              detail="Completed orders only"
              icon={<TrendingUp size={19} color={colors.progress} />}
              tone="blue"
            />
            <MetricCard
              label="Average prep"
              value={formatDuration(analytics.averagePrepSeconds)}
              detail="Started to completed"
              icon={<Timer size={19} color={colors.completed} />}
              tone="green"
            />
            <MetricCard
              label="Active workload"
              value={String(analytics.statusCounts.pending + analytics.statusCounts.inProgress)}
              detail={`${analytics.statusCounts.pending} pending · ${analytics.statusCounts.inProgress} in progress`}
              icon={<Clock3 size={19} color={colors.cancelled} />}
              tone="rose"
            />
          </View>

          <View style={styles.splitGrid}>
            <Card style={styles.breakdownCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Order breakdown</Text>
                  <Text style={styles.cardSubtitle}>All {totalInRange} orders · {range.label}</Text>
                </View>
                <ShoppingBag size={21} color={colors.accentDark} />
              </View>

              <View style={styles.statusBar}>
                <StatusSegment value={analytics.statusCounts.completed} total={totalInRange} color={colors.completed} />
                <StatusSegment value={analytics.statusCounts.inProgress} total={totalInRange} color={colors.progress} />
                <StatusSegment value={analytics.statusCounts.pending} total={totalInRange} color={colors.pending} />
                <StatusSegment value={analytics.statusCounts.cancelled} total={totalInRange} color={colors.cancelled} />
              </View>
              <View style={styles.legendGrid}>
                <Legend color={colors.completed} label="Completed" value={analytics.statusCounts.completed} />
                <Legend color={colors.progress} label="In progress" value={analytics.statusCounts.inProgress} />
                <Legend color={colors.pending} label="Pending" value={analytics.statusCounts.pending} />
                <Legend color={colors.cancelled} label="Cancelled" value={analytics.statusCounts.cancelled} />
              </View>
            </Card>

            <Card style={styles.popularCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Popular items</Text>
                  <Text style={styles.cardSubtitle}>Ranked by completed quantity</Text>
                </View>
                <TrendingUp size={21} color={colors.progress} />
              </View>
              {analytics.popularItems.length === 0 ? (
                <View style={styles.emptyPopular}>
                  <Text style={styles.emptyPopularText}>No completed orders in this range yet.</Text>
                </View>
              ) : (
                analytics.popularItems.slice(0, 6).map((item, index) => (
                  <PopularItemRow
                    key={item.menuItemId ?? item.name}
                    rank={index + 1}
                    name={item.name}
                    quantity={item.quantity}
                    revenue={item.revenue}
                    maxQuantity={maxQuantity}
                  />
                ))
              )}
            </Card>
          </View>

          <View style={styles.footnote}>
            <CheckCircle2 size={17} color={colors.completed} />
            <Text style={styles.footnoteText}>
              Metrics exclude cancelled orders and use snapshotted line-item prices, so menu edits never rewrite past totals.
            </Text>
          </View>
        </View>
      )}

      <SheetModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter insights"
        subtitle="Pick a date range for revenue, orders and rankings."
        footer={(
          <View style={styles.filterFooter}>
            <Button title="Clear Filter" variant="secondary" onPress={clearFilters} fullWidth size="lg" />
            <Button title="Apply" onPress={applyFilters} fullWidth size="lg" />
          </View>
        )}
      >
        <View>
          {options.map(({ value, label }, index) => {
            const selected = presetDraft === value;
            return (
              <Pressable
                key={value}
                onPress={() => setPresetDraft(value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.optionRow,
                  index < options.length - 1 && styles.optionDivider,
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
          <View style={styles.customInputs}>
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
      </SheetModal>
    </Screen>
  );
}

function StatusSegment({ value, total, color }: { value: number; total: number; color: string }) {
  if (value === 0) return null;
  return <View style={{ flex: value / Math.max(1, total), backgroundColor: color }} />;
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View style={styles.legendCopy}>
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={styles.legendValue}>{value}</Text>
      </View>
    </View>
  );
}

function parseDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) || toDateKey(date) !== value ? null : value;
}

function formatRangeKey(value: string) {
  const parsed = parseDateKey(value);
  if (!parsed) return value;
  return formatDate(new Date(`${parsed}T00:00:00`), { day: 'numeric', month: 'short' });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  activeFilterIcon: { backgroundColor: colors.accentSoft },
  content: { gap: spacing.lg },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  splitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  breakdownCard: { flexGrow: 1, flexBasis: 330, gap: spacing.xl },
  popularCard: { flexGrow: 1, flexBasis: 430, gap: spacing.xs },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { ...typography.title3, color: colors.ink },
  cardSubtitle: { ...typography.footnote, color: colors.inkSecondary, marginTop: 2 },
  statusBar: { height: 14, flexDirection: 'row', overflow: 'hidden', borderRadius: 7, backgroundColor: colors.surfaceMuted },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minWidth: 100 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendCopy: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendLabel: { ...typography.caption, color: colors.inkSecondary },
  legendValue: { ...typography.caption, color: colors.ink, fontWeight: '600' },
  emptyPopular: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  emptyPopularText: { ...typography.footnote, color: colors.inkSecondary, textAlign: 'center', maxWidth: 280 },
  footnote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.completedSoft },
  footnoteText: { ...typography.footnote, color: '#047857', flex: 1 },
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
  customInputs: { gap: spacing.sm, paddingTop: spacing.md },
  filterFooter: { gap: spacing.sm },
});
