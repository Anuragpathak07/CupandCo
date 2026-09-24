import { useMemo } from 'react';
import {
  Banknote,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShoppingBag,
  Timer,
  TrendingUp,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { MetricCard } from '@/components/analytics/MetricCard';
import { PopularItemRow } from '@/components/analytics/PopularItemRow';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useOrdersQuery } from '@/services/orders';
import { colors, radii, spacing, typography } from '@/theme';
import { calculateAnalytics } from '@/utils/analytics';
import { formatDate, formatDuration } from '@/utils/dates';
import { formatCompactCurrency, formatCurrency } from '@/utils/formatters';

export default function AnalyticsScreen() {
  const { data: orders, isLoading, isError, error, refetch, isFetching } = useOrdersQuery();
  const analytics = useMemo(() => calculateAnalytics(orders ?? []), [orders]);
  const totalToday =
    analytics.statusCounts.completed +
    analytics.statusCounts.pending +
    analytics.statusCounts.inProgress +
    analytics.statusCounts.cancelled;
  const maxQuantity = analytics.popularItems[0]?.quantity ?? 1;

  return (
    <Screen includeTopInset={false}>
      <PageHeader
        eyebrow="INSIGHTS"
        title="Today at a glance"
        subtitle={`${formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })} · completed sales and live workload`}
        actions={
          <IconButton
            label="Refresh analytics"
            icon={<RefreshCw size={18} color={colors.inkSecondary} />}
            onPress={() => void refetch()}
            disabled={isFetching}
          />
        }
      />

      {isLoading ? (
        <LoadingState label="Calculating today’s metrics…" />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <View style={styles.content}>
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Today’s revenue"
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
                  <Text style={styles.cardSubtitle}>All {totalToday} orders placed today</Text>
                </View>
                <ShoppingBag size={21} color={colors.accentDark} />
              </View>

              <View style={styles.statusBar}>
                <StatusSegment value={analytics.statusCounts.completed} total={totalToday} color={colors.completed} />
                <StatusSegment value={analytics.statusCounts.inProgress} total={totalToday} color={colors.progress} />
                <StatusSegment value={analytics.statusCounts.pending} total={totalToday} color={colors.pending} />
                <StatusSegment value={analytics.statusCounts.cancelled} total={totalToday} color={colors.cancelled} />
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
                  <Text style={styles.emptyPopularText}>Complete an order to start today’s ranking.</Text>
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
              Metrics exclude cancelled orders and use snapshotted line-item prices, so menu edits never rewrite today’s totals.
            </Text>
          </View>
        </View>
      )}
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
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
});
