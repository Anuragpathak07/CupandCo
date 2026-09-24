import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { defaultRouteForRole } from '@/utils/roles';

export default function IndexScreen() {
  const user = useAuthStore((state) => state.user);
  return <Redirect href={user ? defaultRouteForRole(user.role) : '/login'} />;
}
