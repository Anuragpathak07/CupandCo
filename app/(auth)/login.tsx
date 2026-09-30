import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  Coffee,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Store,
  WifiOff,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
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

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LogoBrand } from '@/components/ui/LogoBrand';
import { isDemoLoginEnabled, isSupabaseConfigured } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import type { Role } from '@/types';
import { triggerHaptic } from '@/utils/haptics';
import { defaultRouteForRole } from '@/utils/roles';

type RoleMeta = { role: Role; title: string; blurb: string; icon: LucideIcon };

const ROLE_OPTIONS: RoleMeta[] = [
  { role: 'BARISTA', title: 'Barista', blurb: 'Live queue & prep', icon: Coffee },
  { role: 'CASHIER', title: 'Cashier', blurb: 'Checkout & guests', icon: ShoppingBag },
  { role: 'MANAGER', title: 'Manager', blurb: 'Menu & floor', icon: ShieldCheck },
  { role: 'OWNER', title: 'Owner', blurb: 'Insights & all', icon: KeyRound },
];

const HIGHLIGHTS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ClipboardList, title: 'One calm queue', body: 'Pending, in-progress and completed in a single glance.' },
  { icon: Zap, title: 'Built for the rush', body: 'Two-tap ordering, instant status, realtime sync.' },
  { icon: ShieldCheck, title: 'Role-checked access', body: 'Your staff account opens exactly your workspace.' },
];

// Production login: email + password only. The role comes from the staff
// directory (public.users.role) — it is never picked on this screen.
// Demo picker renders only for local dev when EXPO_PUBLIC_ENABLE_DEMO_LOGIN=true.
const showDemoSection = isDemoLoginEnabled && !isSupabaseConfigured;
const serverMissing = !isSupabaseConfigured && !isDemoLoginEnabled;

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const login = useAuthStore((state) => state.login);
  const loginDemo = useAuthStore((state) => state.loginDemo);
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>('BARISTA');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const isWide = width >= 960;
  if (user) return <Redirect href={defaultRouteForRole(user.role)} />;

  const handleSignIn = async () => {
    setError('');
    if (!isSupabaseConfigured) {
      setError(
        'Server not connected. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then rebuild.',
      );
      return;
    }
    if (!email.trim() || !password) {
      setError('Enter your work email and password to continue.');
      return;
    }
    setLoading(true);
    try {
      const signedInUser = await login(email.trim(), password);
      await triggerHaptic('success');
      router.replace(defaultRouteForRole(signedInUser.role));
    } catch (caught) {
      setError(caught instanceof Error ? friendlyAuthError(caught.message) : 'Sign in failed. Please try again.');
      void triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await loginDemo(demoRole);
      await triggerHaptic('success');
      router.replace(defaultRouteForRole(demoRole));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not enter the demo workspace.');
    } finally {
      setDemoLoading(false);
    }
  };

  const selectedMeta = ROLE_OPTIONS.find((o) => o.role === demoRole) ?? ROLE_OPTIONS[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View pointerEvents="none" style={styles.washGold} />
          <View pointerEvents="none" style={styles.washNavy} />

          <View style={[styles.shell, isWide && styles.shellWide]}>
            {/* Story panel */}
            <View style={styles.story}>
              <View style={styles.storyTop}>
                <LogoBrand variant="light" size="md" />
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Downtown · Open</Text>
                </View>
              </View>

              <View style={styles.storyCopy}>
                <View style={styles.eyebrowRow}>
                  <View style={styles.eyebrowLine} />
                  <Text style={styles.eyebrow}>CAFÉ OPERATIONS</Text>
                </View>
                <Text style={styles.hero}>A calmer café{'\n'}starts here.</Text>
                <Text style={styles.heroBody}>
                  Sign in with your staff account — your role opens your workspace automatically.
                </Text>
              </View>

              <View style={styles.highlights}>
                {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
                  <View key={title} style={styles.highlightRow}>
                    <View style={styles.highlightIcon}>
                      <Icon size={17} color={colors.champagneGold} strokeWidth={2} />
                    </View>
                    <View style={styles.highlightCopy}>
                      <Text style={styles.highlightTitle}>{title}</Text>
                      <Text style={styles.highlightBody}>{body}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.statsCard}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>4m</Text>
                  <Text style={styles.statLabel}>Avg prep</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>Live</Text>
                  <Text style={styles.statLabel}>Queue sync</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <View style={styles.storeRow}>
                    <Store size={13} color={colors.champagneGold} />
                    <Text style={styles.statValue}>Downtown</Text>
                  </View>
                  <Text style={styles.statLabel}>Cup & Co · Flagship</Text>
                </View>
              </View>
            </View>

            {/* Sign-in panel */}
            <View style={styles.panel}>
              <View style={styles.panelEyebrowRow}>
                <View style={styles.panelEyebrowBadge}>
                  <Lock size={12} color={colors.accentDark} strokeWidth={2.4} />
                  <Text style={styles.panelEyebrow}>STAFF SIGN IN</Text>
                </View>
                <View style={styles.panelSecure}>
                  <ShieldCheck size={13} color={colors.completedText} />
                  <Text style={styles.panelSecureText}>Secured</Text>
                </View>
              </View>

              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Welcome back</Text>
                <Text style={styles.panelSubtitle}>
                  Enter your work email and password. Your role — barista, cashier, manager or owner — decides
                  where you land.
                </Text>
              </View>

              {serverMissing ? (
                <View style={styles.configBanner}>
                  <WifiOff size={15} color={colors.pendingText} />
                  <Text style={styles.configText}>
                    Server not connected. This production build needs Supabase keys — no demo bypass is available.
                  </Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <Input
                  label="Work email"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (error) setError('');
                  }}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="you@cupandco.com"
                  left={<Mail size={16} color={colors.inkTertiary} />}
                  returnKeyType="next"
                />
                <View style={styles.passwordWrap}>
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (error) setError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    textContentType="password"
                    placeholder="Your password"
                    left={<Lock size={16} color={colors.inkTertiary} />}
                    returnKeyType="go"
                    onSubmitEditing={() => void handleSignIn()}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    hitSlop={8}
                    style={({ pressed }) => [styles.eyeButton, pressed && styles.eyePressed]}
                  >
                    {showPassword ? (
                      <EyeOff size={17} color={colors.inkSecondary} />
                    ) : (
                      <Eye size={17} color={colors.inkSecondary} />
                    )}
                  </Pressable>
                </View>

                {error ? (
                  <View style={styles.errorBanner}>
                    <CircleAlert size={15} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Button
                  title="Sign in to workspace"
                  onPress={() => void handleSignIn()}
                  loading={loading}
                  size="lg"
                  fullWidth
                  icon={<ArrowRight size={17} color={colors.white} />}
                />

                <View style={styles.secureRow}>
                  <ShieldCheck size={13} color={colors.inkTertiary} />
                  <Text style={styles.secureText}>Supabase Auth · role-checked access · sign-out anytime</Text>
                </View>
              </View>

              {showDemoSection ? (
                <View style={styles.demoAccess}>
                  <View style={styles.demoDivider}>
                    <View style={styles.demoLine} />
                    <Text style={styles.demoDividerText}>LOCAL DEV ONLY</Text>
                    <View style={styles.demoLine} />
                  </View>
                  <View style={styles.roleGrid}>
                    {ROLE_OPTIONS.map(({ role, title, blurb, icon: Icon }) => {
                      const selected = demoRole === role;
                      return (
                        <Pressable
                          key={role}
                          onPress={() => {
                            setDemoRole(role);
                            if (error) setError('');
                            void triggerHaptic('selection');
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          style={({ pressed }) => [
                            styles.roleCard,
                            selected && styles.roleCardSelected,
                            pressed && styles.rolePressed,
                          ]}
                        >
                          <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
                            <Icon size={18} color={selected ? colors.white : colors.accentDark} strokeWidth={2.1} />
                          </View>
                          <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>{title}</Text>
                          <Text style={[styles.roleBlurb, selected && styles.roleBlurbSelected]}>{blurb}</Text>
                          {selected ? <View style={styles.roleCheckDot} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                  <Button
                    title={`Continue as ${selectedMeta.title} (dev)`}
                    onPress={() => void handleDemo()}
                    loading={demoLoading}
                    size="lg"
                    fullWidth
                    variant="secondary"
                  />
                </View>
              ) : null}
            </View>
          </View>

          <Text style={styles.footer}>CUP & CO · SERVICE, WITHOUT THE NOISE</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function friendlyAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password. Check and try again.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first, then sign in.';
  if (/awaiting a role|not present in the.*staff directory/i.test(message)) return message;
  return message;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  scrollWide: { paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xxl },
  washGold: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(197, 160, 89, 0.14)',
  },
  washNavy: {
    position: 'absolute',
    bottom: -140,
    left: -110,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(28, 28, 30, 0.06)',
  },
  shell: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: spacing.lg },
  shellWide: { maxWidth: 1080, flexDirection: 'row', alignItems: 'stretch', gap: spacing.xl },
  story: {
    flex: 1.08,
    borderRadius: 28,
    backgroundColor: colors.deepNavy,
    padding: spacing.xl,
    gap: spacing.xl,
    overflow: 'hidden',
    ...shadows.floating,
  },
  storyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(197,160,89,0.35)',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34C759' },
  liveText: { ...typography.caption, color: colors.cream, fontSize: 12 },
  storyCopy: { gap: spacing.sm },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  eyebrowLine: { width: 22, height: 2, borderRadius: 1, backgroundColor: colors.champagneGold },
  eyebrow: { ...typography.overline, color: colors.champagneGold, fontSize: 11 },
  hero: { ...typography.hero, color: colors.white, fontSize: 42, lineHeight: 46 },
  heroBody: { ...typography.body, color: 'rgba(250,249,245,0.72)', fontSize: 15, lineHeight: 23, maxWidth: 460 },
  highlights: { gap: spacing.sm },
  highlightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  highlightIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(197,160,89,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(197,160,89,0.3)',
  },
  highlightCopy: { flex: 1, gap: 2 },
  highlightTitle: { ...typography.subheadline, color: colors.white, fontSize: 14 },
  highlightBody: { ...typography.footnote, color: 'rgba(250,249,245,0.62)', lineHeight: 18 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  stat: { flex: 1, gap: 2, alignItems: 'flex-start' },
  statValue: { ...typography.headline, color: colors.white, fontSize: 16 },
  statLabel: { ...typography.micro, color: 'rgba(250,249,245,0.55)', fontSize: 11 },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: spacing.sm },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  panel: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
  },
  panelEyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
  },
  panelEyebrow: { ...typography.overline, color: colors.accentDark, fontSize: 11 },
  panelSecure: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  panelSecureText: { ...typography.caption, color: colors.completedText, fontSize: 12 },
  panelHeader: { gap: spacing.xs },
  panelTitle: { ...typography.title1, color: colors.ink, fontSize: 30, lineHeight: 34 },
  panelSubtitle: { ...typography.body, color: colors.inkSecondary, fontSize: 14, lineHeight: 20 },
  configBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.pendingSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,149,0,0.3)',
  },
  configText: { ...typography.footnote, color: colors.pendingText, flex: 1, lineHeight: 18 },
  form: { gap: spacing.md },
  passwordWrap: { position: 'relative' },
  eyeButton: {
    position: 'absolute',
    right: 6,
    top: 30,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyePressed: { opacity: 0.6, backgroundColor: colors.surfaceMuted },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.cancelledSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.25)',
  },
  errorText: { ...typography.footnote, color: colors.cancelledText, flex: 1, lineHeight: 18 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 2 },
  secureText: { ...typography.micro, color: colors.inkTertiary, fontSize: 11, textAlign: 'center' },
  demoAccess: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  demoDivider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  demoLine: { flex: 1, height: 1, backgroundColor: colors.border },
  demoDividerText: { ...typography.micro, color: colors.inkTertiary, letterSpacing: 1 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  roleCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 150,
    padding: spacing.md,
    gap: 6,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  roleCardSelected: { backgroundColor: colors.ink, borderColor: colors.champagneGold, ...shadows.level1 },
  rolePressed: { opacity: 0.85 },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  roleIconSelected: { backgroundColor: 'rgba(197,160,89,0.25)', borderWidth: 1, borderColor: 'rgba(197,160,89,0.5)' },
  roleTitle: { ...typography.subheadline, color: colors.ink, fontSize: 14 },
  roleTitleSelected: { color: colors.white },
  roleBlurb: { ...typography.micro, color: colors.inkSecondary, fontSize: 11 },
  roleBlurbSelected: { color: 'rgba(250,249,245,0.65)' },
  roleCheckDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.champagneGold,
  },
  footer: { ...typography.micro, color: colors.inkTertiary, letterSpacing: 1.4, textAlign: 'center', marginTop: spacing.lg, fontSize: 10 },
});
