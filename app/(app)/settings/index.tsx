import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  BellRing,
  Cloud,
  Coffee,
  Database,
  KeyRound,
  LogOut,
  MonitorSmartphone,
  Palette,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  UtensilsCrossed,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { SheetModal } from '@/components/ui/SheetModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SettingsGroup, SettingsRow } from '@/components/ui/SettingsGroup';
import { useToast } from '@/components/ui/Toast';
import { resetMockData } from '@/services/mockData';
import { isSupabaseConfigured } from '@/services/supabase';
import { useRealtimeOrders } from '@/services/orders';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import type { Role } from '@/types';
import { triggerHaptic } from '@/utils/haptics';
import { defaultRouteForRole } from '@/utils/roles';

type RoleOption = {
  role: Role;
  title: string;
  description: string;
  icon: LucideIcon;
};

const roleOptions: RoleOption[] = [
  { role: 'BARISTA', title: 'Barista', description: 'New orders and live queue', icon: Coffee },
  { role: 'CASHIER', title: 'Cashier', description: 'Ordering and customer service', icon: ShoppingBag },
  { role: 'MANAGER', title: 'Manager', description: 'Menu and daily operations', icon: ShieldCheck },
  { role: 'OWNER', title: 'Owner', description: 'Full workspace access', icon: KeyRound },
];

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const dataMode = useAuthStore((state) => state.dataMode);
  const loginDemo = useAuthStore((state) => state.loginDemo);
  const logout = useAuthStore((state) => state.logout);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const realtimeEnabled = useSettingsStore((state) => state.realtimeEnabled);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const setRealtimeEnabled = useSettingsStore((state) => state.setRealtimeEnabled);
  const realtimeStatus = useRealtimeOrders();
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<Role | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const currentRole = roleOptions.find((option) => option.role === user.role) ?? roleOptions[0];

  const switchRole = async (role: Role) => {
    if (role === user.role && dataMode === 'mock') {
      setRolePickerOpen(false);
      return;
    }
    setSwitchingRole(role);
    try {
      await loginDemo(role);
      queryClient.clear();
      await triggerHaptic('selection');
      setRolePickerOpen(false);
      router.replace(defaultRouteForRole(role));
    } finally {
      setSwitchingRole(null);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      queryClient.clear();
      router.replace('/login');
    } catch (error) {
      showToast({ title: 'Could not sign out', message: getErrorMessage(error), tone: 'error' });
      setSigningOut(false);
    }
  };

  const resetDemo = () => {
    resetMockData();
    queryClient.invalidateQueries();
    showToast({ title: 'Demo workspace restored' });
  };

  return (
    <Screen includeTopInset={false}>
      <PageHeader eyebrow="SYSTEM" title="Settings" />

      <View style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
        <View style={styles.profileMark}><Coffee size={18} color={colors.accentDark} /></View>
      </View>

      <View style={styles.groups}>
        <SettingsGroup title="Workspace">
          <SettingsRow
            label="Current role"
            description="Controls navigation and available actions"
            value={currentRole.title}
            icon={<currentRole.icon size={17} color={colors.accentDark} />}
            onPress={() => setRolePickerOpen(true)}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Devices">
          <SettingsRow
            label="Haptic feedback"
            description="Tactile feedback on supported devices"
            icon={<MonitorSmartphone size={17} color={colors.inkSecondary} />}
            right={(
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: colors.borderStrong, true: colors.accent }}
                thumbColor={colors.white}
              />
            )}
          />
          <SettingsRow
            label="Realtime order updates"
            description="Keep the live queue synchronized"
            icon={<Wifi size={17} color={colors.inkSecondary} />}
            right={(
              <Switch
                value={realtimeEnabled}
                onValueChange={setRealtimeEnabled}
                trackColor={{ false: colors.borderStrong, true: colors.accent }}
                thumbColor={colors.white}
              />
            )}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Notifications">
          <SettingsRow
            label="Queue status"
            description={realtimeEnabled ? 'Live updates are enabled' : 'Live updates are paused'}
            icon={<BellRing size={17} color={colors.inkSecondary} />}
            right={(
              <View style={styles.statusValue}>
                <View style={[styles.statusDot, { backgroundColor: realtimeStatus === 'live' ? colors.completed : colors.inkTertiary }]} />
                <Text style={styles.statusValueText}>{realtimeEnabled ? 'Live' : 'Paused'}</Text>
              </View>
            )}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Menu">
          <SettingsRow
            label="Menu management"
            description={user.role === 'MANAGER' || user.role === 'OWNER' ? 'Items, pricing, and availability' : 'Manager access required'}
            icon={<UtensilsCrossed size={17} color={colors.inkSecondary} />}
            onPress={user.role === 'MANAGER' || user.role === 'OWNER' ? () => router.push('/menu') : undefined}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Staff & Permissions">
          <SettingsRow
            label="Role access"
            description="Preview another role in the demo workspace"
            value={currentRole.title}
            icon={<ShieldCheck size={17} color={colors.inkSecondary} />}
            onPress={() => setRolePickerOpen(true)}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Appearance">
          <SettingsRow
            label="CUP & CO theme"
            description="Warm ivory, espresso navy, and champagne gold"
            icon={<Palette size={17} color={colors.inkSecondary} />}
            value="Warm ivory"
            last
          />
        </SettingsGroup>

        <SettingsGroup title="System">
          <SettingsRow
            label="Data connection"
            description={dataMode === 'supabase' ? 'Supabase Auth and PostgreSQL' : 'Local in-memory demo provider'}
            icon={dataMode === 'supabase' ? <Cloud size={17} color={colors.inkSecondary} /> : <Database size={17} color={colors.inkSecondary} />}
            value={isSupabaseConfigured ? 'Configured' : 'Local'}
          />
          {dataMode === 'mock' ? (
            <SettingsRow
              label="Restore demo data"
              description="Reset the local menu and order queue"
              icon={<RotateCcw size={17} color={colors.inkSecondary} />}
              onPress={resetDemo}
            />
          ) : null}
          <SettingsRow
            label="App version"
            description="Cup & Co Operations"
            icon={<Wrench size={17} color={colors.inkSecondary} />}
            value="1.0.0"
          />
          <SettingsRow
            label="Sign out"
            icon={<LogOut size={17} color={colors.danger} />}
            onPress={() => void handleLogout()}
            right={signingOut ? <Text style={styles.signingOut}>Signing out…</Text> : undefined}
            destructive
            last
          />
        </SettingsGroup>
      </View>

      <SheetModal
        visible={rolePickerOpen}
        onClose={() => setRolePickerOpen(false)}
        title="Current role"
        subtitle="Preview the workspace for another role."
        footer={null}
      >
        <View style={styles.roleList}>
          {roleOptions.map(({ role, title, description, icon: Icon }) => {
            const selected = user.role === role && dataMode === 'mock';
            return (
              <Pressable
                key={role}
                onPress={() => void switchRole(role)}
                disabled={switchingRole !== null}
                style={({ pressed }) => [styles.roleRow, selected && styles.roleRowSelected, pressed && styles.roleRowPressed]}
              >
                <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
                  <Icon size={18} color={selected ? colors.white : colors.accentDark} />
                </View>
                <View style={styles.roleCopy}>
                  <Text style={styles.roleName}>{title}</Text>
                  <Text style={styles.roleDescription}>{description}</Text>
                </View>
                {switchingRole === role ? <Text style={styles.switching}>Switching…</Text> : null}
                {selected && switchingRole !== role ? <Text style={styles.current}>Current</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </SheetModal>
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  profileCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  avatarText: { ...typography.headline, color: colors.white, letterSpacing: 0.5 },
  profileCopy: { flex: 1, gap: 3 },
  profileName: { ...typography.headline, color: colors.ink },
  profileEmail: { ...typography.footnote, color: colors.inkSecondary },
  profileMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  groups: { gap: spacing.xl },
  statusValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusValueText: { ...typography.caption, color: colors.inkSecondary },
  signingOut: { ...typography.caption, color: colors.inkSecondary },
  roleList: { borderRadius: radii.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  roleRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  roleRowSelected: { backgroundColor: colors.accentSoft },
  roleRowPressed: { opacity: 0.65 },
  roleIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  roleIconSelected: { backgroundColor: colors.ink },
  roleCopy: { flex: 1, gap: 2 },
  roleName: { ...typography.subheadline, color: colors.ink },
  roleDescription: { ...typography.caption, color: colors.inkSecondary },
  switching: { ...typography.caption, color: colors.accentDark },
  current: { ...typography.caption, color: colors.accentDark },
});
