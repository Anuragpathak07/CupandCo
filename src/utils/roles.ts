import type { Role } from '@/types';

export function defaultRouteForRole(role: Role) {
  switch (role) {
    case 'BARISTA':
      return '/barista';
    case 'CASHIER':
      return '/cashier';
    case 'MANAGER':
    case 'OWNER':
      return '/analytics';
  }
}

const ROUTE_ACCESS: Record<Role, string[]> = {
  BARISTA: ['/cashier', '/barista', '/history', '/inventory', '/settings'],
  CASHIER: ['/cashier', '/barista', '/history', '/inventory', '/settings'],
  MANAGER: ['/barista', '/cashier', '/menu', '/analytics', '/history', '/inventory', '/settings'],
  OWNER: ['/barista', '/cashier', '/menu', '/analytics', '/history', '/inventory', '/settings'],
};

export function canRoleAccess(role: Role, pathname: string) {
  return ROUTE_ACCESS[role].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
