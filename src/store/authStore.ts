import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  fetchUserProfile,
  getStoredSession,
  isSupabaseConfigured,
  signInWithEmail,
  signOutSupabase,
} from '@/services/supabase';
import type { AppUser, DataMode, Role } from '@/types';

const DEMO_USERS: Record<Role, AppUser> = {
  BARISTA: {
    id: 'demo-barista',
    name: 'Alex Rivera',
    email: 'alex@cupandco.demo',
    role: 'BARISTA',
    createdAt: '2025-01-12T09:00:00.000Z',
  },
  CASHIER: {
    id: 'demo-cashier',
    name: 'Maya Chen',
    email: 'maya@cupandco.demo',
    role: 'CASHIER',
    createdAt: '2025-01-10T09:00:00.000Z',
  },
  MANAGER: {
    id: 'demo-manager',
    name: 'Jordan Lee',
    email: 'jordan@cupandco.demo',
    role: 'MANAGER',
    createdAt: '2024-11-03T09:00:00.000Z',
  },
  OWNER: {
    id: 'demo-owner',
    name: 'Sam Bennett',
    email: 'sam@cupandco.demo',
    role: 'OWNER',
    createdAt: '2024-08-21T09:00:00.000Z',
  },
};

interface AuthState {
  user: AppUser | null;
  sessionToken: string | null;
  dataMode: DataMode;
  hydrated: boolean;
  loginDemo: (role: Role) => Promise<void>;
  login: (email: string, password: string) => Promise<AppUser>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      dataMode: isSupabaseConfigured ? 'supabase' : 'mock',
      hydrated: false,

      loginDemo: async (role) => {
        if (isSupabaseConfigured) {
          void signOutSupabase().catch(() => undefined);
        }
        set({
          user: DEMO_USERS[role],
          sessionToken: `demo-${role.toLowerCase()}`,
          dataMode: 'mock',
        });
      },

      login: async (email, password) => {
        const result = await signInWithEmail(email, password);
        set({
          user: result.user,
          sessionToken: result.session.access_token,
          dataMode: 'supabase',
        });
        return result.user;
      },

      restoreSession: async () => {
        try {
          const session = await getStoredSession();
          if (!session) {
            set((state) => ({
              sessionToken: null,
              dataMode: state.user ? 'mock' : isSupabaseConfigured ? 'supabase' : 'mock',
            }));
            return;
          }
          const user = await fetchUserProfile(session.user.id, session.user.email ?? '');
          set({ user, sessionToken: session.access_token, dataMode: 'supabase' });
        } catch (error) {
          console.warn('Could not restore Supabase session:', error);
          set((state) => ({
            user: state.user?.id.startsWith('demo-') ? state.user : null,
            sessionToken: state.user?.id.startsWith('demo-') ? state.sessionToken : null,
            dataMode: state.user?.id.startsWith('demo-') ? 'mock' : isSupabaseConfigured ? 'supabase' : 'mock',
          }));
        }
      },

      logout: async () => {
        const mode = useAuthStore.getState().dataMode;
        if (mode === 'supabase') await signOutSupabase();
        set({
          user: null,
          sessionToken: null,
          dataMode: isSupabaseConfigured ? 'supabase' : 'mock',
        });
      },

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'cupandco-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        sessionToken: state.sessionToken,
        dataMode: state.dataMode,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export function getDemoUser(role: Role) {
  return DEMO_USERS[role];
}
