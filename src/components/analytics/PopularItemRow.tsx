import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatters';

interface PopularItemRowProps {
  rank: number;
  name: string;
  quantity: number;
  revenue: number;
  maxQuantity: number;
}

export function PopularItemRow({ rank, name, quantity, revenue, maxQuantity }: PopularItemRowProps) {
  const width = `${Math.max(8, (quantity / Math.max(1, maxQuantity)) * 100)}%` as `${number}%`;
  return (
    <View style={styles.row}>
      <View style={styles.rank}><Text style={styles.rankText}>{rank}</Text></View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.name}>{name}</Text>
          <Text style={styles.quantity}>{quantity} sold</Text>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width }]} /></View>
      </View>
      <Text style={styles.revenue}>{formatCurrency(revenue)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rank: { width: 32, height: 32, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  rankText: { ...typography.caption, color: colors.inkSecondary },
  copy: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { ...typography.subheadline, color: colors.ink, flex: 1 },
  quantity: { ...typography.caption, color: colors.inkSecondary },
  track: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  revenue: { ...typography.subheadline, color: colors.ink, minWidth: 66, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
