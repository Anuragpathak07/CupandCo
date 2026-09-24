import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, shadows, spacing, typography } from '@/theme';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastOptions {
  title: string;
  message?: string;
  tone?: ToastTone;
}

interface ToastState extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (toast: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((options: ToastOptions) => {
    setToast({ ...options, id: Date.now() });
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const tone = toast?.tone ?? 'info';
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? CircleAlert : Info;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.springify().damping(18)}
          exiting={FadeOutUp.duration(180)}
          style={[styles.viewport, { top: insets.top + spacing.sm, pointerEvents: 'none' }]}
        >
          <View style={styles.toast}>
            <View style={[styles.icon, styles[`icon_${tone}`]]}>
              <Icon size={18} color={tone === 'success' ? colors.completed : tone === 'error' ? colors.danger : colors.progress} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{toast.title}</Text>
              {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
            </View>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider.');
  return context;
}

export function ToastDismissButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel="Dismiss notification">
      <X size={17} color={colors.inkTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    zIndex: 100,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 430,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.floating,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  icon_success: { backgroundColor: colors.completedSoft },
  icon_error: { backgroundColor: colors.cancelledSoft },
  icon_info: { backgroundColor: colors.progressSoft },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.subheadline,
    color: colors.ink,
  },
  message: {
    ...typography.footnote,
    color: colors.inkSecondary,
  },
});
