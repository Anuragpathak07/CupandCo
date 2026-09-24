import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radii, shadows, spacing, typography } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[`size_${size}`],
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'dark' ? colors.white : colors.accentDark}
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              styles[`label_${variant}`],
              icon ? styles.labelWithIcon : undefined,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.button,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelWithIcon: {
    marginLeft: spacing.xs,
  },
  size_sm: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  size_md: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    minHeight: 50,
    paddingHorizontal: spacing.xl,
  },
  size_xl: {
    minHeight: 56,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.ink,
    ...shadows.level1,
  },
  secondary: {
    backgroundColor: colors.secondarySurface,
    borderColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.cancelledSoft,
    borderColor: 'transparent',
  },
  dark: {
    backgroundColor: colors.ink,
    ...shadows.level1,
  },
  label_primary: { color: colors.white },
  label_secondary: { color: colors.ink },
  label_ghost: { color: colors.inkSecondary },
  label_danger: { color: colors.danger },
  label_dark: { color: colors.white },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});

