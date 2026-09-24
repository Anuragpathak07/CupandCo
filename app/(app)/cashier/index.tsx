import { useMemo, useState } from 'react';
import { Search, ShoppingBag, Trash2 } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ItemNoteModal } from '@/components/order/ItemNoteModal';
import { OrderSummary } from '@/components/order/OrderSummary';
import { CategoryPill } from '@/components/menu/CategoryPill';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SheetModal } from '@/components/ui/SheetModal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { useMenuQuery } from '@/services/menu';
import { useCreateOrderMutation } from '@/services/orders';
import { useAuthStore } from '@/store/authStore';
import {
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from '@/store/cartStore';
import { colors, layout, radii, spacing, typography } from '@/theme';
import type { MenuItem } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { triggerHaptic } from '@/utils/haptics';

export default function CashierScreen() {
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const { data: menu, isLoading, isError, error, refetch } = useMenuQuery();
  const createOrder = useCreateOrderMutation();
  const lines = useCartStore((state) => state.lines);
  const orderNotes = useCartStore((state) => state.notes);
  const cartCount = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const addItem = useCartStore((state) => state.addItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const remove = useCartStore((state) => state.remove);
  const updateNotes = useCartStore((state) => state.updateNotes);
  const setOrderNotes = useCartStore((state) => state.setOrderNotes);
  const clear = useCartStore((state) => state.clear);
  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [basketOpen, setBasketOpen] = useState(false);
  const [noteItem, setNoteItem] = useState<MenuItem | null>(null);

  const categories = menu?.categories ?? [];
  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (menu?.items ?? []).filter(
      (item) =>
        (categoryId === 'all' || item.categoryId === categoryId) &&
        (!term || `${item.name} ${item.description}`.toLowerCase().includes(term)),
    );
  }, [categoryId, menu?.items, search]);

  const quantityFor = (id: string) => lines.find((line) => line.menuItem.id === id)?.quantity ?? 0;
  const selectedLine = noteItem ? lines.find((line) => line.menuItem.id === noteItem.id) : undefined;

  const handleAdd = (item: MenuItem) => {
    addItem(item);
    void triggerHaptic('selection');
  };

  const handlePlaceOrder = async () => {
    if (lines.length === 0) return;
    try {
      const order = await createOrder.mutateAsync({
        createdBy: user?.id ?? null,
        notes: orderNotes,
        items: lines.map((line) => ({
          menuItemId: line.menuItem.id,
          itemName: line.menuItem.name,
          quantity: line.quantity,
          unitPrice: line.menuItem.price,
          notes: line.notes,
        })),
      });
      clear();
      setBasketOpen(false);
      await triggerHaptic('success');
      showToast({
        title: `Order #${order.orderNumber} placed`,
        message: 'The barista queue updated instantly.',
      });
    } catch (caught) {
      showToast({ title: 'Could not place order', message: getErrorMessage(caught), tone: 'error' });
      void triggerHaptic('error');
    }
  };

  const contentWidth = Math.min(width, layout.maxContentWidth) - spacing.xl * 2;
  const columns = contentWidth >= 1020 ? 4 : contentWidth >= 650 ? 3 : contentWidth >= 390 ? 2 : 1;
  const cardWidth = Math.max(160, (contentWidth - spacing.sm * (columns - 1)) / columns);

  return (
    <Screen
      includeTopInset={false}
      contentContainerStyle={styles.screenContent}
      footer={
        <View style={styles.basketDock}>
          <View style={styles.basketInner}>
            <View style={styles.basketSummary}>
              <View style={styles.bagIcon}>
                <ShoppingBag size={20} color={colors.accentDark} />
              </View>
              <View>
                <Text style={styles.basketCount}>
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </Text>
                <Text style={styles.basketTotal}>{formatCurrency(subtotal)}</Text>
              </View>
            </View>
            <View style={styles.basketActions}>
              {cartCount > 0 ? (
                <Button
                  title="Clear"
                  variant="ghost"
                  size="sm"
                  onPress={clear}
                  icon={<Trash2 size={15} color={colors.inkSecondary} />}
                />
              ) : null}
              <Button
                title="Review"
                variant="secondary"
                onPress={() => setBasketOpen(true)}
                disabled={cartCount === 0}
              />
              <Button
                title={`Place order${cartCount > 0 ? ` · ${formatCurrency(subtotal)}` : ''}`}
                onPress={() => void handlePlaceOrder()}
                loading={createOrder.isPending}
                disabled={cartCount === 0}
              />
            </View>
          </View>
        </View>
      }
    >
      <PageHeader
        eyebrow="CASHIER"
        title="New order"
        subtitle="Build the basket, add prep notes, and send it straight to the live barista queue."
        actions={
          cartCount > 0 ? <Button title="Clear basket" variant="secondary" onPress={clear} /> : undefined
        }
      />

      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <CategoryPill
            label="All items"
            selected={categoryId === 'all'}
            count={menu?.items.length}
            onPress={() => setCategoryId('all')}
          />
          {categories.map((category) => (
            <CategoryPill
              key={category.id}
              label={category.name}
              selected={categoryId === category.id}
              count={menu?.items.filter((item) => item.categoryId === category.id).length}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </ScrollView>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search the menu"
          left={<Search size={18} color={colors.inkTertiary} />}
          containerStyle={styles.search}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <LoadingState label="Loading the menu…" />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <View style={styles.emptyCard}>
          <EmptyState
            title="No menu items found"
            message="Try another category or clear your search."
          />
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(220)} style={styles.grid}>
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              quantity={quantityFor(item.id)}
              onAdd={() => handleAdd(item)}
              onRemove={() => decrement(item.id)}
              onAddNote={() => setNoteItem(item)}
              style={{ flexBasis: cardWidth, minWidth: cardWidth, maxWidth: cardWidth }}
            />
          ))}
        </Animated.View>
      )}

      <SheetModal
        visible={basketOpen}
        onClose={() => setBasketOpen(false)}
        title="Review order"
        subtitle={`${cartCount} ${cartCount === 1 ? 'item' : 'items'} · prices are snapshotted when placed`}
        footer={
          <Button
            title={`Place order · ${formatCurrency(subtotal)}`}
            size="lg"
            fullWidth
            loading={createOrder.isPending}
            disabled={cartCount === 0}
            onPress={() => void handlePlaceOrder()}
          />
        }
      >
        <OrderSummary
          lines={lines}
          orderNotes={orderNotes}
          onOrderNotesChange={setOrderNotes}
          onIncrement={increment}
          onDecrement={decrement}
          onRemove={remove}
        />
      </SheetModal>

      <ItemNoteModal
        item={noteItem}
        visible={Boolean(noteItem)}
        initialNote={selectedLine?.notes ?? ''}
        onClose={() => setNoteItem(null)}
        onSave={(note) => {
          if (noteItem) updateNotes(noteItem.id, note);
          setNoteItem(null);
          void triggerHaptic('selection');
        }}
      />
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: spacing.xxl },
  toolbar: { gap: spacing.md, marginBottom: spacing.lg },
  categoryScroll: { gap: spacing.xs, paddingRight: spacing.lg },
  search: { width: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'stretch' },
  emptyCard: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  basketDock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.scrim,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  basketInner: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    minHeight: 64,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  basketSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bagIcon: { width: 42, height: 42, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  basketCount: { ...typography.caption, color: colors.inkSecondary },
  basketTotal: { ...typography.headline, color: colors.ink, fontVariant: ['tabular-nums'] },
  basketActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
