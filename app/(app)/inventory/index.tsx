import { useMemo, useState } from 'react';
import { Minus, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SheetModal } from '@/components/ui/SheetModal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import {
  useCreateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useInventoryQuery,
  useUpdateInventoryItemMutation,
} from '@/services/inventory';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import type { InventoryItem } from '@/types';
import { pluralize } from '@/utils/formatters';
import { triggerHaptic } from '@/utils/haptics';

export default function InventoryScreen() {
  const { showToast } = useToast();
  const { data: items, isLoading, isError, error, refetch } = useInventoryQuery();
  const createItem = useCreateInventoryItemMutation();
  const updateItem = useUpdateInventoryItemMutation();
  const deleteItem = useDeleteInventoryItemMutation();
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<{ visible: boolean; item: InventoryItem | null }>({
    visible: false,
    item: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('pcs');

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (items ?? []).filter(
      (item) => !term || `${item.name} ${item.unit}`.toLowerCase().includes(term),
    );
  }, [items, search]);

  const openEditor = (item: InventoryItem | null) => {
    setName(item?.name ?? '');
    setQuantity(String(item?.quantity ?? 0));
    setUnit(item?.unit ?? 'pcs');
    setEditor({ visible: true, item });
  };

  const closeEditor = () => setEditor({ visible: false, item: null });

  const saveItem = async () => {
    const parsedQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
    try {
      if (editor.item) {
        await updateItem.mutateAsync({
          id: editor.item.id,
          input: { name, quantity: parsedQuantity, unit },
        });
        showToast({ title: 'Inventory item updated' });
      } else {
        await createItem.mutateAsync({ name, quantity: parsedQuantity, unit });
        showToast({ title: 'Inventory item added' });
      }
      closeEditor();
    } catch (caught) {
      showToast({ title: 'Could not save item', message: getErrorMessage(caught), tone: 'error' });
    }
  };

  const adjustQuantity = async (item: InventoryItem, delta: number) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        input: { quantity: Math.max(0, item.quantity + delta) },
      });
      await triggerHaptic('selection');
    } catch (caught) {
      showToast({ title: 'Could not update stock', message: getErrorMessage(caught), tone: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem.mutateAsync(deleteTarget.id);
      showToast({ title: `“${deleteTarget.name}” removed` });
      setDeleteTarget(null);
    } catch (caught) {
      showToast({ title: 'Could not remove item', message: getErrorMessage(caught), tone: 'error' });
    }
  };

  const saving = createItem.isPending || updateItem.isPending;

  return (
    <Screen includeTopInset={false}>
      <PageHeader
        eyebrow="STOCK"
        title="Inventory"
        subtitle="Track what's on hand. Owners and baristas can add, adjust, or remove items."
        actions={(
          <Button
            title="Add item"
            size="sm"
            icon={<Plus size={15} color={colors.white} />}
            onPress={() => openEditor(null)}
          />
        )}
      />

      <View style={styles.toolbar}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search inventory"
          left={<Search size={17} color={colors.inkTertiary} />}
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <LoadingState label="Loading inventory…" />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <EmptyState
            icon={<Package size={27} color={colors.accentDark} />}
            title={search ? 'No items match' : 'No inventory yet'}
            message={search ? 'Try another search.' : 'Add your first stock item to start tracking.'}
            action={
              search ? undefined : (
                <Button
                  title="Add item"
                  variant="dark"
                  icon={<Plus size={16} color={colors.white} />}
                  onPress={() => openEditor(null)}
                />
              )
            }
          />
        </View>
      ) : (
        <View style={styles.list}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowCopy}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowStock}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => void adjustQuantity(item, -1)}
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${item.name}`}
                  style={({ pressed }) => [styles.stepButton, pressed && styles.stepPressed]}
                >
                  <Minus size={15} color={colors.ink} />
                </Pressable>
                <Pressable
                  onPress={() => void adjustQuantity(item, 1)}
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${item.name}`}
                  style={({ pressed }) => [styles.stepButton, pressed && styles.stepPressed]}
                >
                  <Plus size={15} color={colors.ink} />
                </Pressable>
              </View>
              <IconButton
                label={`Edit ${item.name}`}
                variant="soft"
                icon={<Pencil size={15} color={colors.inkSecondary} />}
                onPress={() => openEditor(item)}
              />
              <IconButton
                label={`Remove ${item.name}`}
                variant="soft"
                icon={<Trash2 size={15} color={colors.danger} />}
                onPress={() => setDeleteTarget(item)}
              />
            </View>
          ))}
          <Text style={styles.countText}>{pluralize(filteredItems.length, 'item')} tracked</Text>
        </View>
      )}

      <SheetModal
        visible={editor.visible}
        onClose={closeEditor}
        title={editor.item ? `Edit ${editor.item.name}` : 'Add inventory item'}
        subtitle="Name, on-hand quantity, and unit."
        footer={(
          <Button
            title={editor.item ? 'Save changes' : 'Add item'}
            size="lg"
            fullWidth
            loading={saving}
            onPress={() => void saveItem()}
          />
        )}
      >
        <View style={styles.form}>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Milk"
            autoCapitalize="words"
          />
          <View style={styles.formRow}>
            <Input
              label="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              keyboardType="numeric"
              containerStyle={styles.formField}
            />
            <Input
              label="Unit"
              value={unit}
              onChangeText={setUnit}
              placeholder="pcs"
              autoCapitalize="none"
              containerStyle={styles.formField}
            />
          </View>
        </View>
      </SheetModal>

      <SheetModal
        visible={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Remove “${deleteTarget?.name ?? ''}”?`}
        subtitle="It will disappear from the inventory list."
        variant="center"
        scroll={false}
        footer={(
          <View style={styles.confirmActions}>
            <Button title="Keep" variant="secondary" onPress={() => setDeleteTarget(null)} style={styles.confirmButton} />
            <Button
              title="Remove"
              variant="danger"
              loading={deleteItem.isPending}
              onPress={() => void confirmDelete()}
              style={styles.confirmButton}
            />
          </View>
        )}
      >
        <Text style={styles.confirmCopy}>This only affects inventory tracking, not orders or the menu.</Text>
      </SheetModal>
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  toolbar: { marginBottom: spacing.lg },
  emptyCard: {
    minHeight: 320,
    borderRadius: radii.xxl,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    ...shadows.level1,
  },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.level1,
  },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { ...typography.headline, color: colors.ink },
  rowStock: { ...typography.caption, color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondarySurface,
  },
  stepPressed: { opacity: 0.6 },
  countText: { ...typography.caption, color: colors.inkTertiary, textAlign: 'center', paddingTop: spacing.xs },
  form: { gap: spacing.lg, paddingBottom: spacing.sm },
  formRow: { flexDirection: 'row', gap: spacing.sm },
  formField: { flex: 1 },
  confirmActions: { flexDirection: 'row', gap: spacing.sm },
  confirmButton: { flex: 1 },
  confirmCopy: { ...typography.body, color: colors.inkSecondary, paddingVertical: spacing.sm },
});
