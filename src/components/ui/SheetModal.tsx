import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '@/theme';

interface SheetModalProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  variant?: 'sheet' | 'center';
  scroll?: boolean;
}

export function SheetModal({
  visible,
  onClose,
  title,
  subtitle,
  footer,
  variant = 'sheet',
  scroll = true,
  children,
}: SheetModalProps) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={variant === 'sheet' ? 'slide' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close dialog"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.positioner, variant === 'center' && styles.positionerCenter]}
        >
          <View
            style={[
              styles.sheet,
              variant === 'center' && styles.sheetCenter,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={19} color={colors.inkSecondary} />
              </Pressable>
            </View>
            <Body
              style={styles.body}
              contentContainerStyle={scroll ? styles.bodyContent : undefined}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </Body>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  positioner: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  positionerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '94%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sheetCenter: {
    borderRadius: radii.xxl,
    maxHeight: '86%',
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    ...typography.title2,
    color: colors.ink,
  },
  subtitle: {
    ...typography.footnote,
    color: colors.inkSecondary,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  closePressed: {
    opacity: 0.6,
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  bodyContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
