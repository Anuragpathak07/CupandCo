import { StyleSheet, Text, View, Switch, type SwitchProps } from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface SwitchRowProps extends Omit<SwitchProps, 'value'> {
  label: string;
  description: string;
  value: boolean;
}

export function SwitchRow({ label, description, value, onValueChange }: SwitchRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E9E9EA', true: colors.completed }}
        thumbColor={colors.white}
        ios_backgroundColor="#E9E9EA"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.subheadline,
    color: colors.ink,
  },
  description: {
    ...typography.footnote,
    color: colors.inkSecondary,
  },
});

