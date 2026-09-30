import { useEffect } from 'react';
import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import {
  BarChart3,
  ClipboardList,
  History,
  Settings,
  ShoppingBag,
  UtensilsCrossed,
  LogOut,
  UserCog,
  type LucideIcon,
} from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useAuthStore } from '@/store/authStore';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import type { Role } from '@/types';
import { canRoleAccess, defaultRouteForRole } from '@/utils/roles';
import { triggerHaptic } from '@/utils/haptics';

type TabConfig = {
  name: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

const tabs: TabConfig[] = [
  { name: 'barista', label: 'Orders', icon: ClipboardList, roles: ['BARISTA', 'CASHIER', 'MANAGER', 'OWNER'] },
  { name: 'cashier', label: 'New order', icon: ShoppingBag, roles: ['BARISTA', 'CASHIER', 'MANAGER', 'OWNER'] },
  { name: 'menu', label: 'Menu', icon: UtensilsCrossed, roles: ['MANAGER', 'OWNER'] },
  { name: 'analytics', label: 'Insights', icon: BarChart3, roles: ['MANAGER', 'OWNER'] },
  { name: 'history', label: 'History', icon: History, roles: ['BARISTA', 'CASHIER', 'MANAGER', 'OWNER'] },
  { name: 'settings', label: 'Settings', icon: Settings, roles: ['BARISTA', 'CASHIER', 'MANAGER', 'OWNER'] },
];

function FloatingNavBar({ userRole }: { userRole: Role }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const showLabels = width >= 540;
  const logout = useAuthStore((state) => state.logout);

  // Filter allowed tabs based on role
  const visibleTabs = tabs.filter((t) => t.roles.includes(userRole));

  const handleLogout = async () => {
    await triggerHaptic('selection');
    await logout();
    router.replace('/login');
  };

  const handleSwitchUser = async () => {
    await triggerHaptic('selection');
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.navWrapper}>
      <View style={styles.navContainer}>
        {visibleTabs.map((tab) => {
          const isActive = pathname.startsWith(`/${tab.name}`);
          const Icon = tab.icon;

          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                router.push(`/${tab.name}` as any);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              style={({ pressed }) => [
                styles.navItem,
                !showLabels && styles.navItemIconOnly,
                isActive && styles.navItemActive,
                pressed && !isActive && styles.navItemPressed,
              ]}
            >
              <Icon
                size={20}
                color={isActive ? colors.accentDark : colors.inkSecondary}
                strokeWidth={isActive ? 2.3 : 1.8}
              />
              {showLabels ? (
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {tab.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}

        {/* Switch User / Logout Button */}
        <Pressable
          onPress={handleSwitchUser}
          accessibilityRole="button"
          accessibilityLabel="Switch user or sign out"
          style={({ pressed }) => [
            styles.navItem,
            !showLabels && styles.navItemIconOnly,
            pressed && styles.navItemPressed,
            styles.navItemLogout,
          ]}
        >
          <LogOut size={20} color={colors.danger} strokeWidth={2} />
          {showLabels ? (
            <Text style={[styles.navLabel, styles.navLabelLogout]}>Switch</Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

export default function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && user && !canRoleAccess(user.role, pathname)) router.replace('/settings');
  }, [hydrated, pathname, router, user]);

  // While restoring the session, render nothing (AuthProvider already shows
  // a splash). Once hydrated, unauthenticated users are always bounced to login.
  if (!hydrated) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={styles.appWrapper}>
      <Tabs
        tabBar={(props) => <FloatingNavBar {...props} userRole={user.role} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: 'top',
          sceneStyle: styles.scene,
          animation: 'fade',
        }}
      >
        {tabs.map(({ name, label, roles }) => {
          const enabled = roles.includes(user.role);
          return (
            <Tabs.Screen
              key={name}
              name={name}
              options={enabled ? { title: label } : { href: null }}
            />
          );
        })}
      </Tabs>
    </View>
  );
}

export function getDefaultTab(role: Role) {
  return defaultRouteForRole(role);
}

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scene: {
    backgroundColor: colors.canvas,
  },
  navWrapper: {
    position: Platform.OS === 'web' ? ('sticky' as any) : 'relative',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 24 : 18,
    paddingBottom: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.canvas,
    zIndex: 1000,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
    borderRadius: radii.pill,
    backgroundColor: Platform.select({
      web: 'rgba(255, 255, 255, 0.90)',
      default: colors.surface,
    }) as string,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.level2,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }
      : {}),
  },
  navItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  navItemIconOnly: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  navItemActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  navItemPressed: {
    opacity: 0.7,
  },
  navLabel: {
    ...typography.caption,
    fontSize: 14,
    color: colors.inkSecondary,
    fontWeight: '500',
  },
  navLabelActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  navItemLogout: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  navLabelLogout: {
    color: colors.danger,
    fontWeight: '600',
  },
});



