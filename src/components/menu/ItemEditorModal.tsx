import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SheetModal } from '@/components/ui/SheetModal';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { colors, radii, spacing, typography } from '@/theme';
import type { MenuCategory, MenuItem, MenuMutationInput } from '@/types';
import { CategoryPill } from './CategoryPill';

interface ItemEditorModalProps {
  visible: boolean;
  item: MenuItem | null;
  categories: MenuCategory[];
  saving: boolean;
  onClose: () => void;
  onSave: (input: MenuMutationInput) => void;
}

export function ItemEditorModal(props: ItemEditorModalProps) {
  if (!props.visible) return null;
  return <ItemEditorDialog {...props} />;
}

function ItemEditorDialog({
  item,
  categories,
  saving,
  onClose,
  onSave,
}: ItemEditorModalProps) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item ? item.price.toFixed(2) : '');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? '');
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [error, setError] = useState('');

  const canSave = useMemo(
    () => name.trim().length > 0 && Number.isFinite(Number(price)) && Number(price) >= 0 && Boolean(categoryId),
    [categoryId, name, price],
  );

  const handleSave = () => {
    if (!canSave) {
      setError('Add a name, category, and valid non-negative price.');
      return;
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      price: Number(Number(price).toFixed(2)),
      categoryId,
      isAvailable,
      imageUrl: item?.imageUrl ?? null,
    });
  };

  return (
    <SheetModal
      visible
      onClose={onClose}
      title={item ? 'Edit menu item' : 'Add menu item'}
      subtitle={item ? 'Existing orders keep their original price snapshot.' : 'Create an item for the cashier menu.'}
      footer={
        <Button
          title={item ? 'Save changes' : 'Add item'}
          size="lg"
          fullWidth
          loading={saving}
          disabled={categories.length === 0}
          onPress={handleSave}
        />
      }
    >
      {categories.length === 0 ? (
        <View style={styles.noCategories}>
          <Text style={styles.noCategoriesTitle}>Create a category first</Text>
          <Text style={styles.noCategoriesBody}>Every menu item needs a category before it can be added.</Text>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.categorySection}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
              {categories.map((category) => (
                <CategoryPill
                  key={category.id}
                  label={category.name}
                  selected={categoryId === category.id}
                  onPress={() => setCategoryId(category.id)}
                />
              ))}
            </ScrollView>
          </View>
          <Input label="Item name" value={name} onChangeText={setName} placeholder="e.g. Honey Cortado" maxLength={80} autoFocus />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Short, useful description"
            multiline
            maxLength={180}
          />
          <Input
            label="Price"
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
            inputMode="decimal"
            left={<Text style={styles.currency}>$</Text>}
          />
          <View style={styles.switchCard}>
            <SwitchRow
              label="Available to order"
              description="Turn this off to sell out an item without deleting it."
              value={isAvailable}
              onValueChange={setIsAvailable}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  categorySection: { gap: spacing.xs },
  label: { ...typography.subheadline, color: colors.ink },
  categories: { gap: spacing.xs, paddingBottom: spacing.xs },
  currency: { ...typography.headline, color: colors.inkSecondary },
  switchCard: { paddingHorizontal: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surfaceMuted },
  error: { ...typography.footnote, color: colors.danger },
  noCategories: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.pendingSoft, gap: spacing.xs },
  noCategoriesTitle: { ...typography.headline, color: colors.accentDark },
  noCategoriesBody: { ...typography.footnote, color: colors.accentDark },
});
