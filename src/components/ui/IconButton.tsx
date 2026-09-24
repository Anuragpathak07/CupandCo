import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii } from '@/theme';

interface IconButtonProps {
  icon: ReactNode;
  onPress: () => void;
  label: string;
  disabled?: boolean;
  variant?: 'plain' | 'soft' | 'danger';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  label,
  disabled = false,
  variant = 'soft',
  size = 'md',
  style,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        styles[`size_${size}`],
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  size_sm: { width: 34, height: 34, borderRadius: radii.sm },
  size_md: { width: 42, height: 42 },
  plain: { backgroundColor: 'transparent' },
  soft: { backgroundColor: colors.surfaceMuted },
  danger: { backgroundColor: colors.cancelledSoft },
  pressed: { opacity: 0.62 },
  disabled: { opacity: 0.35 },
});
