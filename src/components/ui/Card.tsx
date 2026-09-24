import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '@/theme';

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ children, style, onPress, padded = true, elevated = false }: CardProps) {
  const content = [styles.base, padded && styles.padded, elevated && styles.elevated, style];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [content, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }
  return <View style={content}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  padded: {
    padding: spacing.lg,
  },
  elevated: {
    ...shadows.card,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.992 }],
  },
});
