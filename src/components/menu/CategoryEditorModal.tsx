import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SheetModal } from '@/components/ui/SheetModal';
import { colors, radii, spacing, typography } from '@/theme';
import type { MenuCategory } from '@/types';

interface CategoryEditorModalProps {
  visible: boolean;
  category: MenuCategory | null;
  saving: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function CategoryEditorModal(props: CategoryEditorModalProps) {
  if (!props.visible) return null;
  return <CategoryEditorDialog {...props} />;
}

function CategoryEditorDialog({ category, saving, onClose, onSave }: CategoryEditorModalProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }
    onSave(name.trim());
  };

  return (
    <SheetModal
      visible
      onClose={onClose}
      title={category ? 'Rename category' : 'Add category'}
      subtitle="Categories keep the cashier menu organized."
      variant="center"
      scroll={false}
      footer={
        <Button
          title={category ? 'Save category' : 'Add category'}
          fullWidth
          loading={saving}
          onPress={submit}
        />
      }
    >
      <Input
        label="Category name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Seasonal drinks"
        maxLength={50}
        autoFocus
        onSubmitEditing={submit}
        error={error || undefined}
      />
      <View style={styles.note}>
        <Text style={styles.noteText}>Changing a category name won’t affect historical orders.</Text>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  note: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  noteText: { ...typography.footnote, color: colors.inkSecondary },
});
