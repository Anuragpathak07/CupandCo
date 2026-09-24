import { forwardRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react-native';
import {
  Pressable,
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
  clearButtonMode?: 'never' | 'while-editing';
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, left, containerStyle, style, multiline, value, onChangeText, clearButtonMode, onFocus, onBlur, ...props },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          isFocused && styles.fieldFocused,
          error ? styles.fieldError : undefined,
          props.editable === false && styles.disabled,
        ]}
      >
        {left ? <View style={styles.left}>{left}</View> : null}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.inkTertiary}
          selectionColor={colors.accent}
          multiline={multiline}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          {...props}
        />
        {clearButtonMode === 'while-editing' && value ? (
          <Pressable
            onPress={() => onChangeText?.('')}
            hitSlop={6}
            accessibilityLabel="Clear text"
            style={styles.clearButton}
          >
            <X size={14} color={colors.inkTertiary} />
          </Pressable>
        ) : null}
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
    fontWeight: '500',
  },
  field: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.secondarySurface,
    paddingHorizontal: spacing.md,
  },
  fieldFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.secondarySurface,
    opacity: 0.65,
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
    marginRight: spacing.xs,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
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

