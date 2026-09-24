import { CircleOff, MessageSquarePlus, Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing, typography } from '@/theme';
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
  const isInBasket = quantity > 0;

  return (
    <View
      style={[
        styles.card,
        isInBasket && styles.cardInBasket,
        !item.isAvailable && styles.unavailable,
        style,
      ]}
    >
      {/* Top Row: Item Name on Left, Price on Right */}
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      </View>

      {/* Bottom Row: Add Pill Button / Stepper on Bottom Left */}
      <View style={styles.bottomRow}>
        {!item.isAvailable ? (
          <View style={styles.soldOut}>
            <CircleOff size={13} color={colors.inkTertiary} />
            <Text style={styles.soldOutText}>Unavailable</Text>
          </View>
        ) : quantity > 0 ? (
          <View style={styles.activeControls}>
            <View style={styles.stepper}>
              <Pressable
                onPress={onRemove}
                style={styles.stepButton}
                accessibilityLabel={`Remove one ${item.name}`}
              >
                <Minus size={13} color={colors.white} />
              </Pressable>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Pressable
                onPress={onAdd}
                style={styles.stepButton}
                accessibilityLabel={`Add one ${item.name}`}
              >
                <Plus size={13} color={colors.white} />
              </Pressable>
            </View>
            <Pressable
              onPress={onAddNote}
              style={({ pressed }) => [styles.noteButton, pressed && styles.pressed]}
              accessibilityLabel={`Edit note for ${item.name}`}
            >
              <MessageSquarePlus size={13} color={colors.accentDark} />
              <Text style={styles.noteText}>Note</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            accessibilityLabel={`Add ${item.name}`}
          >
            <Plus size={14} color={colors.ink} />
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 180,
    minHeight: 106,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'space-between',
    ...shadows.level1,
  },
  cardInBasket: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  unavailable: {
    backgroundColor: colors.secondarySurface,
    opacity: 0.60,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.ink,
    flex: 1,
  },
  price: {
    ...typography.body,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: spacing.sm,
  },
  addButton: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.ink,
  },
  activeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepper: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    paddingHorizontal: 3,
  },
  stepButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
    minWidth: 16,
    textAlign: 'center',
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  noteText: {
    ...typography.caption,
    color: colors.accentDark,
    fontWeight: '500',
  },
  soldOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  soldOutText: {
    ...typography.caption,
    color: colors.inkTertiary,
  },
  pressed: {
    opacity: 0.72,
  },
});


