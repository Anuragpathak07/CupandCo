import { useEffect } from 'react';
import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import {
  BarChart3,
  ClipboardList,
  History,
  Settings,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { colors, typography } from '@/theme';
import type { Role } from '@/types';
import { canRoleAccess, defaultRouteForRole } from '@/utils/roles';

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

export default function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showTabLabels = width >= 600;

  useEffect(() => {
    if (user && !canRoleAccess(user.role, pathname)) router.replace('/settings');
  }, [pathname, router, user]);

  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'top',
        sceneStyle: styles.scene,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.inkTertiary,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarLabelPosition: 'below-icon',
        tabBarShowLabel: showTabLabels,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        animation: 'shift',
      }}
    >
      {tabs.map(({ name, label, icon: Icon, roles }) => {
        const enabled = roles.includes(user.role);
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={enabled ? {
              title: label,
              tabBarLabel: label,
              tabBarAccessibilityLabel: label,
              tabBarIcon: ({ color, focused }) => (
                <Icon size={focused ? 23 : 21} color={color} strokeWidth={focused ? 2.35 : 1.9} />
              ),
            } : { href: null }}
          />
        );
      })}
    </Tabs>
  );
}

export function getDefaultTab(role: Role) {
  return defaultRouteForRole(role);
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.canvas },
  tabBar: {
    minHeight: 64,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.scrim,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tabItem: {
    paddingVertical: 3,
  },
  tabLabel: { ...typography.micro, letterSpacing: -0.1 },
});
