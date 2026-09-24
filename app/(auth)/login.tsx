import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isSupabaseConfigured } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { ROLE_LABELS, type Role } from '@/types';
import { triggerHaptic } from '@/utils/haptics';
import { defaultRouteForRole } from '@/utils/roles';

const demoRoles: Role[] = ['BARISTA', 'CASHIER', 'MANAGER', 'OWNER'];

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const login = useAuthStore((state) => state.login);
  const loginDemo = useAuthStore((state) => state.loginDemo);
  const user = useAuthStore((state) => state.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [demoRole, setDemoRole] = useState<Role>('BARISTA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isWide = width >= 900;
  if (user) return <Redirect href={defaultRouteForRole(user.role)} />;

  const handleSignIn = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your work email and password.');
      return;
    }
    setLoading(true);
    try {
      const signedInUser = await login(email, password);
      await triggerHaptic('success');
      router.replace(defaultRouteForRole(signedInUser.role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign in failed.');
      void triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    await loginDemo(demoRole);
    await triggerHaptic('success');
    router.replace(defaultRouteForRole(demoRole));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.shell, isWide && styles.shellWide]}>
            <View style={styles.story}>
              <View style={styles.brandRow}>
                <View style={styles.logoMark} />
                <View>
                  <Text style={styles.brand}>Cup & Co</Text>
                  <Text style={styles.brandCaption}>CAFÉ OPERATIONS</Text>
                </View>
              </View>
              <View style={styles.storyCopy}>
                <Badge label="SERVICE, WITHOUT THE NOISE" tone="amber" />
                <Text style={styles.hero}>A calmer café{`\n`}starts here.</Text>
                <Text style={styles.heroBody}>
                  Orders, menu, and momentum in one focused workspace—designed for the people
                  behind the bar.
                </Text>
              </View>
              <View style={styles.quoteCard}>
                <Text style={styles.quote}>“The queue should feel like a to‑do list, not a problem.”</Text>
                <View style={styles.storeRow}>
                  <Text style={styles.storeText}>Cup & Co · Downtown</Text>
                </View>
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Welcome back</Text>
                <Text style={styles.panelSubtitle}>
                  {isSupabaseConfigured
                    ? 'Sign in with your staff account.'
                    : 'Explore instantly with a local demo role.'}
                </Text>
              </View>

              {isSupabaseConfigured ? (
                <View style={styles.form}>
                  <Input
                    label="Work email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    placeholder="you@cupandco.com"
                  />
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="current-password"
                    textContentType="password"
                    placeholder="Your password"
                    onSubmitEditing={() => void handleSignIn()}
                  />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <Button title="Sign in" onPress={() => void handleSignIn()} loading={loading} size="lg" fullWidth />
                </View>
              ) : (
                <View style={styles.localNote}>
                  <Text style={styles.localNoteText}>
                    Local demo data is active. No account or network connection required.
                  </Text>
                </View>
              )}

              <View style={styles.demoAccess}>
                <View style={styles.demoAccessCopy}>
                  <Text style={styles.demoAccessTitle}>Local demo access</Text>
                  <Text style={styles.demoAccessDescription}>
                    Choose a role to explore the workspace without a Supabase account.
                  </Text>
                </View>
                <View style={styles.demoRoleRow}>
                  {demoRoles.map((role) => {
                    const selected = demoRole === role;
                    return (
                      <Pressable
                        key={role}
                        onPress={() => setDemoRole(role)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        style={({ pressed }) => [
                          styles.demoRole,
                          selected && styles.demoRoleSelected,
                          pressed && styles.demoRolePressed,
                        ]}
                      >
                        <Text style={[styles.demoRoleText, selected && styles.demoRoleTextSelected]}>
                          {ROLE_LABELS[role]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Button
                  title={`Continue as ${ROLE_LABELS[demoRole]}`}
                  onPress={() => void handleDemo()}
                  fullWidth
                  size="lg"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.lg },
  scrollWide: { paddingVertical: spacing.xxl },
  shell: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xxl,
  },
  shellWide: {
    maxWidth: 1120,
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.huge,
  },
  story: { flex: 1, gap: spacing.huge },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoMark: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  brand: { ...typography.title3, color: colors.ink },
  brandCaption: { ...typography.micro, color: colors.inkTertiary, letterSpacing: 1.2 },
  storyCopy: { gap: spacing.md },
  hero: { ...typography.hero, color: colors.ink, fontSize: 46, lineHeight: 52 },
  heroBody: { ...typography.body, color: colors.inkSecondary, maxWidth: 520, fontSize: 17, lineHeight: 25 },
  quoteCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.subtle,
  },
  quote: { ...typography.bodyMedium, color: colors.ink, maxWidth: 500 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  storeText: { ...typography.footnote, color: colors.inkSecondary },
  panel: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
    borderRadius: radii.xxl,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  panelHeader: { gap: spacing.xs },
  panelTitle: { ...typography.title2, color: colors.ink },
  panelSubtitle: { ...typography.footnote, color: colors.inkSecondary },
  form: { gap: spacing.md },
  error: { ...typography.footnote, color: colors.danger },
  localNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
  },
  localNoteText: { ...typography.footnote, color: colors.accentDark, flex: 1 },
  demoAccess: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  demoAccessCopy: { gap: spacing.xxs },
  demoAccessTitle: { ...typography.headline, color: colors.ink },
  demoAccessDescription: { ...typography.footnote, color: colors.inkSecondary },
  demoRoleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  demoRole: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  demoRoleSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  demoRolePressed: { opacity: 0.68 },
  demoRoleText: { ...typography.caption, color: colors.inkSecondary },
  demoRoleTextSelected: { color: colors.white, fontWeight: '600' },
});
