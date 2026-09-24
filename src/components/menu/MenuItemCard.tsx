import { CircleOff, MessageSquarePlus, Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';
import type { MenuItem } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onAddNote: () => void;
  style?: StyleProp<ViewStyle>;
}

export function MenuItemCard({ item, quantity, onAdd, onRemove, onAddNote, style }: MenuItemCardProps) {
  return (
    <View style={[styles.card, !item.isAvailable && styles.unavailable, style]}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          {item.description ? <Text style={styles.description} numberOfLines={2}>{item.description}</Text> : null}
        </View>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      </View>

      {!item.isAvailable ? (
        <View style={styles.soldOut}>
          <CircleOff size={13} color={colors.inkTertiary} />
          <Text style={styles.soldOutText}>Currently unavailable</Text>
        </View>
      ) : quantity > 0 ? (
        <View style={styles.bottomRow}>
          <View style={styles.stepper}>
            <Pressable onPress={onRemove} style={styles.stepButton} accessibilityLabel={`Remove one ${item.name}`}>
              <Minus size={15} color={colors.ink} />
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable onPress={onAdd} style={styles.stepButton} accessibilityLabel={`Add one ${item.name}`}>
              <Plus size={15} color={colors.ink} />
            </Pressable>
          </View>
          <Pressable
            onPress={onAddNote}
            style={({ pressed }) => [styles.noteButton, pressed && styles.pressed]}
            accessibilityLabel={`Edit note for ${item.name}`}
          >
            <MessageSquarePlus size={14} color={colors.accentDark} />
            <Text style={styles.noteText}>Note</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          accessibilityLabel={`Add ${item.name}`}
        >
          <Plus size={16} color={colors.ink} />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 220,
    maxWidth: 360,
    minHeight: 148,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  unavailable: { backgroundColor: colors.surfaceMuted, opacity: 0.68 },
  topRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs },
  name: { ...typography.subheadline, color: colors.ink },
  description: { ...typography.caption, color: colors.inkSecondary },
  price: { ...typography.subheadline, color: colors.ink, fontVariant: ['tabular-nums'] },
  soldOut: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  soldOutText: { ...typography.caption, color: colors.inkTertiary },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { height: 38, flexDirection: 'row', alignItems: 'center', borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, padding: 3 },
  stepButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  quantity: { ...typography.footnote, color: colors.ink, minWidth: 20, textAlign: 'center' },
  noteButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.xs },
  noteText: { ...typography.caption, color: colors.accentDark },
  addButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  addText: { ...typography.caption, color: colors.ink },
  pressed: { opacity: 0.62 },
});
