import { forwardRef, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  left?: ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, left, containerStyle, style, multiline, ...props },
  ref,
) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          error ? styles.fieldError : undefined,
          props.editable === false && styles.disabled,
        ]}
      >
        {left ? <View style={styles.left}>{left}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.inkTertiary}
          selectionColor={colors.accent}
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.subheadline,
    color: colors.ink,
  },
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  multiline: {
    minHeight: 104,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  disabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.72,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.ink,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 78,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  left: {
    marginRight: spacing.sm,
  },
  error: {
    ...typography.footnote,
    color: colors.danger,
  },
  hint: {
    ...typography.footnote,
    color: colors.inkTertiary,
  },
});
