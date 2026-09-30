import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ArrowRight, CircleAlert, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { isDemoLoginEnabled, isSupabaseConfigured } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography } from '@/theme';
import type { Role } from '@/types';
import { triggerHaptic } from '@/utils/haptics';
import { defaultRouteForRole } from '@/utils/roles';

// Local dev only. Production builds show email + password with no bypass.
const showDemoSection = isDemoLoginEnabled && !isSupabaseConfigured;
const serverMissing = !isSupabaseConfigured && !isDemoLoginEnabled;

const DEMO_ROLES: Role[] = ['BARISTA', 'CASHIER', 'MANAGER', 'OWNER'];

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const loginDemo = useAuthStore((state) => state.loginDemo);
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>('BARISTA');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Redirect href={defaultRouteForRole(user.role)} />;

  const handleSignIn = async () => {
    setError('');
    if (!isSupabaseConfigured) {
      setError('Server not connected. Add your Supabase keys, then rebuild.');
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

  const handleDemo = async (role: Role) => {
    setError('');
    setDemoLoading(true);
    try {
      await loginDemo(role);
      await triggerHaptic('success');
      router.replace(defaultRouteForRole(role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not enter the demo workspace.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.column}>
            <View style={styles.brand}>
              <Image
                source={require('../../assets/images/image.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="Cup & Co logo"
              />
              <Text style={styles.wordmark}>CUP & CO</Text>
              <Text style={styles.tagline}>COFFEE · SMOOTHIE · DESSERTS</Text>
            </View>

            <View style={styles.heading}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your workspace</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Work email</Text>
                <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
                  <Mail size={16} color={colors.inkTertiary} />
                  <TextInput
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (error) setError('');
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    placeholder="you@cupandco.com"
                    placeholderTextColor={colors.inkTertiary}
                    selectionColor={colors.ink}
                    returnKeyType="next"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
                  <Lock size={16} color={colors.inkTertiary} />
                  <TextInput
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      if (error) setError('');
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    textContentType="password"
                    placeholder="Your password"
                    placeholderTextColor={colors.inkTertiary}
                    selectionColor={colors.ink}
                    returnKeyType="go"
                    onSubmitEditing={() => void handleSignIn()}
                    style={styles.input}
                  />
                  <Pressable
                    onPress={() => setShowPassword((visible) => !visible)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    hitSlop={10}
                    style={({ pressed }) => [styles.eye, pressed && styles.eyePressed]}
                  >
                    {showPassword ? (
                      <EyeOff size={17} color={colors.inkSecondary} />
                    ) : (
                      <Eye size={17} color={colors.inkSecondary} />
                    )}
                  </Pressable>
                </View>
              </View>

              {serverMissing ? (
                <Text style={styles.configNote}>
                  Server not connected. This build needs Supabase keys — no demo bypass is available.
                </Text>
              ) : null}

              {error ? (
                <View style={styles.errorRow}>
                  <CircleAlert size={14} color={colors.danger} />
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
                style={styles.cta}
              />

              <Text style={styles.secureNote}>Secure staff access</Text>
            </View>

            {showDemoSection ? (
              <View style={styles.demo}>
                <View style={styles.demoDivider}>
                  <View style={styles.demoLine} />
                  <Text style={styles.demoCaption}>LOCAL DEVELOPMENT</Text>
                  <View style={styles.demoLine} />
                </View>
                <View style={styles.demoRoles}>
                  {DEMO_ROLES.map((role) => {
                    const selected = demoRole === role;
                    return (
                      <Pressable
                        key={role}
                        onPress={() => {
                          setDemoRole(role);
                          void handleDemo(role);
                        }}
                        disabled={demoLoading}
                        accessibilityRole="button"
                        accessibilityLabel={`Continue as ${role.toLowerCase()}`}
                        style={({ pressed }) => [
                          styles.demoRole,
                          selected && styles.demoRoleSelected,
                          pressed && styles.demoPressed,
                        ]}
                      >
                        <Text style={[styles.demoRoleText, selected && styles.demoRoleTextSelected]}>
                          {role.charAt(0) + role.slice(1).toLowerCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
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

const FIELD_HEIGHT = 52;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  column: { width: '100%', maxWidth: 400, alignSelf: 'center', gap: 32 },
  brand: { alignItems: 'center', gap: 10 },
  logo: { width: 64, height: 64 },
  wordmark: { ...typography.headline, fontSize: 17, letterSpacing: 2.5, color: colors.ink },
  tagline: { ...typography.micro, fontSize: 10, letterSpacing: 1.6, color: colors.inkTertiary },
  heading: { alignItems: 'center', gap: 8 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '600', letterSpacing: -0.4, color: colors.ink },
  subtitle: { ...typography.body, fontSize: 15, color: colors.inkSecondary },
  form: { gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: colors.ink },
  inputWrap: {
    minHeight: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E1DA',
    backgroundColor: colors.white,
  },
  inputWrapFocused: { borderColor: colors.ink },
  input: { ...typography.body, flex: 1, color: colors.ink, paddingVertical: 0, fontSize: 15 },
  eye: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  eyePressed: { opacity: 0.55 },
  configNote: { ...typography.footnote, color: colors.pendingText, textAlign: 'center', lineHeight: 18 },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  errorText: { ...typography.footnote, color: colors.danger, flex: 1, lineHeight: 18 },
  cta: { borderRadius: 12, marginTop: 4 },
  secureNote: { ...typography.micro, fontSize: 12, color: colors.inkTertiary, textAlign: 'center' },
  demo: { gap: 12 },
  demoDivider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  demoLine: { flex: 1, height: 1, backgroundColor: '#E4E1DA' },
  demoCaption: { ...typography.micro, fontSize: 10, letterSpacing: 1.2, color: colors.inkTertiary },
  demoRoles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  demoRole: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E1DA',
    backgroundColor: colors.white,
  },
  demoRoleSelected: { borderColor: colors.ink },
  demoPressed: { opacity: 0.6 },
  demoRoleText: { ...typography.subheadline, fontSize: 14, color: colors.inkSecondary },
  demoRoleTextSelected: { color: colors.ink },
});
