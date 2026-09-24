import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { CategoryEditorModal } from '@/components/menu/CategoryEditorModal';
import { CategoryPill } from '@/components/menu/CategoryPill';
import { ItemEditorModal } from '@/components/menu/ItemEditorModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SheetModal } from '@/components/ui/SheetModal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import {
  useCreateCategoryMutation,
  useCreateMenuItemMutation,
  useDeleteCategoryMutation,
  useDeleteMenuItemMutation,
  useMenuQuery,
  useReorderCategoriesMutation,
  useUpdateCategoryMutation,
  useUpdateMenuItemMutation,
} from '@/services/menu';
import { colors, radii, spacing, typography } from '@/theme';
import type { MenuCategory, MenuItem, MenuMutationInput } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { triggerHaptic } from '@/utils/haptics';

type DeleteTarget = { type: 'category' | 'item'; id: string; name: string };

export default function MenuManagementScreen() {
  const { showToast } = useToast();
  const { data: menu, isLoading, isError, error, refetch, isFetching } = useMenuQuery();
  const createCategory = useCreateCategoryMutation();
  const updateCategory = useUpdateCategoryMutation();
  const deleteCategory = useDeleteCategoryMutation();
  const reorderCategories = useReorderCategoriesMutation();
  const createItem = useCreateMenuItemMutation();
  const updateItem = useUpdateMenuItemMutation();
  const deleteItem = useDeleteMenuItemMutation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryModal, setCategoryModal] = useState<{ visible: boolean; category: MenuCategory | null }>({
    visible: false,
    category: null,
  });
  const [itemEditor, setItemEditor] = useState<{ visible: boolean; item: MenuItem | null }>({
    visible: false,
    item: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const categories = menu?.categories ?? [];
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (menu?.items ?? []).filter(
      (item) =>
        (selectedCategory === 'all' || item.categoryId === selectedCategory) &&
        (!term || `${item.name} ${item.description}`.toLowerCase().includes(term)),
    );
  }, [menu?.items, search, selectedCategory]);

  const mutationPending =
    createCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending ||
    reorderCategories.isPending ||
    createItem.isPending ||
    updateItem.isPending ||
    deleteItem.isPending;

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= categories.length) return;
    const orderedIds = categories.map((category) => category.id);
    const [moved] = orderedIds.splice(index, 1);
    orderedIds.splice(destination, 0, moved);
    try {
      await reorderCategories.mutateAsync(orderedIds);
      await triggerHaptic('selection');
    } catch (caught) {
      showToast({ title: 'Could not reorder categories', message: getErrorMessage(caught), tone: 'error' });
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await updateItem.mutateAsync({ id: item.id, input: { isAvailable: !item.isAvailable } });
      await triggerHaptic('selection');
    } catch (caught) {
      showToast({ title: 'Could not update availability', message: getErrorMessage(caught), tone: 'error' });
    }
  };

  const saveCategory = async (name: string) => {
    try {
      if (categoryModal.category) {
        await updateCategory.mutateAsync({ id: categoryModal.category.id, name });
        showToast({ title: 'Category updated' });
      } else {
        await createCategory.mutateAsync(name);
        showToast({ title: 'Category added' });
      }
      setCategoryModal({ visible: false, category: null });
    } catch (caught) {
      showToast({ title: 'Could not save category', message: getErrorMessage(caught), tone: 'error' });
    }
  };

  const saveItem = async (input: MenuMutationInput) => {
    try {
      if (itemEditor.item) {
        await updateItem.mutateAsync({ id: itemEditor.item.id, input });
        showToast({ title: 'Menu item updated', message: 'Historical prices remain unchanged.' });
      } else {
        await createItem.mutateAsync(input);
        showToast({ title: 'Menu item added' });
      }
      setItemEditor({ visible: false, item: null });
    } catch (caught) {
      showToast({ title: 'Could not save menu item', message: getErrorMessage(caught), tone: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'category') {
        await deleteCategory.mutateAsync(deleteTarget.id);
      } else {
        await deleteItem.mutateAsync(deleteTarget.id);
      }
      showToast({ title: `${deleteTarget.type === 'category' ? 'Category' : 'Menu item'} deleted` });
      setDeleteTarget(null);
    } catch (caught) {
      showToast({ title: 'Could not delete', message: getErrorMessage(caught), tone: 'error' });
    }
  };

  return (
    <Screen includeTopInset={false}>
      <PageHeader
        eyebrow="MENU"
        title="Menu management"
        subtitle="Control availability, pricing, categories, and cashier ordering—all without touching order history."
        actions={<Button title="Add item" icon={<Plus size={17} color={colors.white} />} onPress={() => setItemEditor({ visible: true, item: null })} />}
      />

      <Card style={styles.categoryPanel} padded={false}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Categories</Text>
            <Text style={styles.panelSubtitle}>Use the arrows to set cashier menu order.</Text>
          </View>
          <Button
            title="Add category"
            variant="secondary"
            size="sm"
            icon={<Plus size={15} color={colors.accentDark} />}
            onPress={() => setCategoryModal({ visible: true, category: null })}
          />
        </View>
        {categories.length === 0 ? (
          <View style={styles.categoryEmpty}><Text style={styles.mutedText}>Add a category to begin organizing the menu.</Text></View>
        ) : (
          <View style={styles.categoryList}>
            {categories.map((category, index) => {
              const count = menu?.items.filter((item) => item.categoryId === category.id).length ?? 0;
              return (
                <View key={category.id} style={styles.categoryRow}>
                  <GripVertical size={18} color={colors.inkTertiary} />
                  <View style={styles.categoryNameWrap}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>{count} {count === 1 ? 'item' : 'items'}</Text>
                  </View>
                  <IconButton
                    icon={<ArrowUp size={15} color={colors.inkSecondary} />}
                    label={`Move ${category.name} up`}
                    size="sm"
                    variant="plain"
                    disabled={index === 0 || reorderCategories.isPending}
                    onPress={() => void moveCategory(index, -1)}
                  />
                  <IconButton
                    icon={<ArrowDown size={15} color={colors.inkSecondary} />}
                    label={`Move ${category.name} down`}
                    size="sm"
                    variant="plain"
                    disabled={index === categories.length - 1 || reorderCategories.isPending}
                    onPress={() => void moveCategory(index, 1)}
                  />
                  <IconButton
                    icon={<Pencil size={15} color={colors.inkSecondary} />}
                    label={`Edit ${category.name}`}
                    size="sm"
                    onPress={() => setCategoryModal({ visible: true, category })}
                  />
                  <IconButton
                    icon={<Trash2 size={15} color={colors.danger} />}
                    label={`Delete ${category.name}`}
                    size="sm"
                    variant="danger"
                    onPress={() => setDeleteTarget({ type: 'category', id: category.id, name: category.name })}
                  />
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <View style={styles.itemsHeader}>
        <View>
          <Text style={styles.itemsTitle}>Menu items</Text>
          <Text style={styles.panelSubtitle}>{filteredItems.length} shown · changes update the cashier instantly</Text>
        </View>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search items"
          left={<Search size={17} color={colors.inkTertiary} />}
          containerStyle={styles.itemSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <CategoryPill label="All" selected={selectedCategory === 'all'} onPress={() => setSelectedCategory('all')} />
        {categories.map((category) => (
          <CategoryPill
            key={category.id}
            label={category.name}
            selected={selectedCategory === category.id}
            onPress={() => setSelectedCategory(category.id)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <LoadingState label="Loading menu…" />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : filteredItems.length === 0 ? (
        <Card style={styles.emptyCard}>
          <EmptyState title="No items found" message="Add a menu item or try another filter." />
        </Card>
      ) : (
        <View style={styles.itemList}>
          {filteredItems.map((item, index) => {
            const category = categories.find((entry) => entry.id === item.categoryId);
            return (
              <View key={item.id} style={[styles.itemRow, index < filteredItems.length - 1 && styles.itemDivider, !item.isAvailable && styles.itemRowUnavailable]}>
                <View style={[styles.itemMonogram, !item.isAvailable && styles.itemMonogramMuted]}>
                  <Text style={styles.itemMonogramText}>{item.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.itemCopy}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {!item.isAvailable ? <Text style={styles.soldOut}>Sold out</Text> : null}
                  </View>
                  <Text numberOfLines={1} style={styles.itemDescription}>{item.description || category?.name || 'Menu item'}</Text>
                  <Text style={styles.itemMeta}>{category?.name ?? 'Uncategorized'} · {formatCurrency(item.price)}</Text>
                </View>
                <View style={styles.availability}>
                  <Text style={styles.availabilityLabel}>{item.isAvailable ? 'Available' : 'Unavailable'}</Text>
                  <Switch
                    value={item.isAvailable}
                    onValueChange={() => void toggleAvailability(item)}
                    disabled={updateItem.isPending}
                    trackColor={{ false: colors.borderStrong, true: colors.accent }}
                    thumbColor={colors.white}
                  />
                </View>
                <IconButton
                  icon={<Pencil size={16} color={colors.inkSecondary} />}
                  label={`Edit ${item.name}`}
                  onPress={() => setItemEditor({ visible: true, item })}
                />
                <IconButton
                  icon={<Trash2 size={16} color={colors.danger} />}
                  label={`Delete ${item.name}`}
                  variant="danger"
                  onPress={() => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}
                />
              </View>
            );
          })}
        </View>
      )}

      <CategoryEditorModal
        visible={categoryModal.visible}
        category={categoryModal.category}
        saving={createCategory.isPending || updateCategory.isPending}
        onClose={() => setCategoryModal({ visible: false, category: null })}
        onSave={(name) => void saveCategory(name)}
      />
      <ItemEditorModal
        visible={itemEditor.visible}
        item={itemEditor.item}
        categories={categories}
        saving={createItem.isPending || updateItem.isPending}
        onClose={() => setItemEditor({ visible: false, item: null })}
        onSave={(input) => void saveItem(input)}
      />
      <SheetModal
        visible={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.type ?? 'item'}?`}
        subtitle={deleteTarget?.name}
        variant="center"
        scroll={false}
        footer={
          <View style={styles.deleteActions}>
            <Button title="Cancel" variant="secondary" onPress={() => setDeleteTarget(null)} style={styles.flexButton} />
            <Button
              title="Delete"
              variant="danger"
              loading={mutationPending}
              onPress={() => void confirmDelete()}
              style={styles.flexButton}
            />
          </View>
        }
      >
        <Text style={styles.deleteCopy}>
          {deleteTarget?.type === 'category'
            ? 'Categories with menu items cannot be deleted until those items are moved or removed.'
            : 'Historical orders remain intact. Their item names and prices are stored as snapshots.'}
        </Text>
      </SheetModal>

      {isFetching && !isLoading ? <Text style={styles.syncText}>Syncing menu changes…</Text> : null}
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  categoryPanel: { marginBottom: spacing.xxl, overflow: 'hidden' },
  panelHeader: { minHeight: 70, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, padding: spacing.md },
  panelTitle: { ...typography.headline, color: colors.ink },
  panelSubtitle: { ...typography.caption, color: colors.inkSecondary },
  categoryList: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  categoryRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: spacing.md, paddingRight: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  categoryNameWrap: { flex: 1, minWidth: 90 },
  categoryName: { ...typography.subheadline, color: colors.ink },
  categoryCount: { ...typography.caption, color: colors.inkTertiary },
  categoryEmpty: { padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  mutedText: { ...typography.footnote, color: colors.inkSecondary },
  itemsHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.md },
  itemsTitle: { ...typography.title3, color: colors.ink },
  itemSearch: { width: 260, maxWidth: '100%' },
  filters: { gap: spacing.xs, paddingBottom: spacing.md },
  itemList: { overflow: 'hidden', borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface },
  itemRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  itemDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  itemRowUnavailable: { backgroundColor: colors.surfaceMuted },
  itemMonogram: { width: 48, height: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  itemMonogramMuted: { backgroundColor: colors.border },
  itemMonogramText: { ...typography.headline, color: colors.accentDark },
  itemCopy: { flex: 1, minWidth: 120, gap: 2 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  itemName: { ...typography.headline, color: colors.ink },
  soldOut: { ...typography.micro, color: colors.cancelled },
  itemDescription: { ...typography.footnote, color: colors.inkSecondary },
  itemMeta: { ...typography.caption, color: colors.inkTertiary },
  availability: { alignItems: 'center', gap: 2 },
  availabilityLabel: { ...typography.micro, color: colors.inkSecondary },
  emptyCard: { minHeight: 280 },
  deleteActions: { flexDirection: 'row', gap: spacing.sm },
  flexButton: { flex: 1 },
  deleteCopy: { ...typography.body, color: colors.inkSecondary, paddingVertical: spacing.sm },
  syncText: { ...typography.caption, color: colors.inkTertiary, textAlign: 'right', marginTop: spacing.md },
});
