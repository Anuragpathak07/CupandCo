import { Coffee } from 'lucide-react-native';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface LogoBrandProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  showSubtitle?: boolean;
  style?: ViewStyle;
}

export function LogoBrand({
  size = 'md',
  variant = 'dark',
  showSubtitle = true,
  style,
}: LogoBrandProps) {
  const isDark = variant === 'dark';
  const iconSize = size === 'lg' ? 28 : size === 'md' ? 22 : 16;
  const boxSize = size === 'lg' ? 52 : size === 'md' ? 42 : 32;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.badge,
          { width: boxSize, height: boxSize },
          isDark ? styles.badgeDark : styles.badgeLight,
        ]}
      >
        <Coffee size={iconSize} color={isDark ? colors.champagneGold : colors.deepNavy} strokeWidth={2.2} />
      </View>
      <View style={styles.textColumn}>
        <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight, size === 'lg' && styles.titleLg]}>
          CUP & CO
        </Text>
        {showSubtitle ? (
          <Text style={[styles.subtitle, isDark ? styles.subtitleDark : styles.subtitleLight]}>
            COFFEE • SMOOTHIE • DESSERTS
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeDark: {
    backgroundColor: colors.deepNavy,
    borderColor: colors.champagneGold,
  },
  badgeLight: {
    backgroundColor: colors.cream,
    borderColor: colors.champagneGold,
  },
  textColumn: {
    gap: 1,
  },
  title: {
    ...typography.headline,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  titleLg: {
    fontSize: 22,
    lineHeight: 26,
  },
  titleDark: {
    color: colors.deepNavy,
  },
  titleLight: {
    color: colors.white,
  },
  subtitle: {
    ...typography.micro,
    letterSpacing: 1.2,
  },
  subtitleDark: {
    color: colors.accentDark,
  },
  subtitleLight: {
    color: colors.champagneGold,
  },
});
