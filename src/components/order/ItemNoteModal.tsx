import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SheetModal } from '@/components/ui/SheetModal';
import { colors, radii, spacing, typography } from '@/theme';
import type { MenuItem } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface ItemNoteModalProps {
  item: MenuItem | null;
  visible: boolean;
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

const suggestions = ['Extra hot', 'Oat milk', 'Half sweet', 'On the side'];

export function ItemNoteModal(props: ItemNoteModalProps) {
  if (!props.visible || !props.item) return null;
  return <ItemNoteDialog {...props} />;
}

function ItemNoteDialog({ item, initialNote, onClose, onSave }: ItemNoteModalProps) {
  const [note, setNote] = useState(initialNote);

  return (
    <SheetModal
      visible
      onClose={onClose}
      title={`Note for ${item?.name ?? 'item'}`}
      subtitle="Keep it short and prep-friendly."
      footer={<Button title="Save note" fullWidth size="lg" onPress={() => onSave(note)} />}
    >
      {item ? (
        <View style={styles.summary}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        </View>
      ) : null}
      <Input
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Oat milk, half sweet"
        multiline
        maxLength={120}
        autoFocus
      />
      <View style={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            title={suggestion}
            variant="secondary"
            size="sm"
            onPress={() => setNote(suggestion)}
          />
        ))}
      </View>
      <Text style={styles.tip}>Item notes print only on this line and never change the saved price.</Text>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  name: { ...typography.subheadline, color: colors.ink },
  price: { ...typography.subheadline, color: colors.inkSecondary, fontVariant: ['tabular-nums'] },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  tip: { ...typography.footnote, color: colors.inkTertiary, marginTop: spacing.lg },
});
