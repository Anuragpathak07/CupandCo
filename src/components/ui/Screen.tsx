import type { PropsWithChildren, ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/theme';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  includeTopInset?: boolean;
}

export function Screen({
  children,
  scroll = true,
  footer,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  includeTopInset = true,
}: ScreenProps) {
  return (
    <SafeAreaView
      edges={includeTopInset ? ['top', 'left', 'right'] : ['left', 'right', 'bottom']}
      style={styles.safeArea}
    >
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        >
          <View style={styles.content}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.flexContent, contentContainerStyle]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  flexContent: {
    flex: 1,
  },
});
