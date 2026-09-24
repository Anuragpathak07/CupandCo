import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Input } from '@/components/ui/Input';
import { colors, radii, spacing, typography } from '@/theme';
import type { CartLine } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface OrderSummaryProps {
  lines: CartLine[];
  orderNotes: string;
  onOrderNotesChange: (notes: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
}

export function OrderSummary({
  lines,
  orderNotes,
  onOrderNotesChange,
  onIncrement,
  onDecrement,
  onRemove,
}: OrderSummaryProps) {
  const subtotal = lines.reduce((total, line) => total + line.menuItem.price * line.quantity, 0);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  if (lines.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <ShoppingBag size={24} color={colors.accentDark} />
        </View>
        <Text style={styles.title}>Your basket is empty</Text>
        <Text style={styles.body}>Add an available menu item to start an order.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.lines}>
        {lines.map((line) => (
          <View key={line.menuItem.id} style={styles.line}>
            <View style={styles.lineTop}>
              <View style={styles.lineCopy}>
                <Text style={styles.name}>{line.menuItem.name}</Text>
                <Text style={styles.price}>{formatCurrency(line.menuItem.price)} each</Text>
                {line.notes ? <Text style={styles.note}>“{line.notes}”</Text> : null}
              </View>
              <Text style={styles.lineTotal}>{formatCurrency(line.menuItem.price * line.quantity)}</Text>
            </View>
            <View style={styles.lineActions}>
              <View style={styles.stepper}>
                <Pressable onPress={() => onDecrement(line.menuItem.id)} style={styles.stepButton} accessibilityLabel={`Remove one ${line.menuItem.name}`}>
                  <Minus size={15} color={colors.ink} />
                </Pressable>
                <Text style={styles.quantity}>{line.quantity}</Text>
                <Pressable onPress={() => onIncrement(line.menuItem.id)} style={styles.stepButton} accessibilityLabel={`Add one ${line.menuItem.name}`}>
                  <Plus size={15} color={colors.ink} />
                </Pressable>
              </View>
              <Pressable onPress={() => onRemove(line.menuItem.id)} style={styles.remove} accessibilityLabel={`Remove ${line.menuItem.name}`}>
                <Trash2 size={17} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
      <Input
        label="Order note (optional)"
        value={orderNotes}
        onChangeText={onOrderNotesChange}
        placeholder="Pickup time, table number, or a general request"
        multiline
        maxLength={240}
      />
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Items</Text>
          <Text style={styles.totalValue}>{itemCount}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>{formatCurrency(subtotal)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.xs },
  emptyIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  title: { ...typography.headline, color: colors.ink },
  body: { ...typography.footnote, color: colors.inkSecondary, textAlign: 'center' },
  lines: { gap: spacing.sm },
  line: { padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  lineTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  lineCopy: { flex: 1, gap: 2 },
  name: { ...typography.subheadline, color: colors.ink },
  price: { ...typography.caption, color: colors.inkSecondary },
  note: { ...typography.footnote, color: colors.accentDark, marginTop: spacing.xs },
  lineTotal: { ...typography.subheadline, color: colors.ink, fontVariant: ['tabular-nums'] },
  lineActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', padding: 3, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted },
  stepButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  quantity: { ...typography.subheadline, color: colors.ink, minWidth: 24, textAlign: 'center' },
  remove: { width: 38, height: 38, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  totals: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surfaceMuted, gap: spacing.sm },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { ...typography.footnote, color: colors.inkSecondary },
  totalValue: { ...typography.footnote, color: colors.ink, fontVariant: ['tabular-nums'] },
  grandTotal: { paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
  grandLabel: { ...typography.headline, color: colors.ink },
  grandValue: { ...typography.title3, color: colors.ink, fontVariant: ['tabular-nums'] },
});
