import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  hapticsEnabled: boolean;
  realtimeEnabled: boolean;
  compactMode: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  setRealtimeEnabled: (enabled: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticsEnabled: true,
      realtimeEnabled: true,
      compactMode: false,
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setRealtimeEnabled: (realtimeEnabled) => set({ realtimeEnabled }),
      setCompactMode: (compactMode) => set({ compactMode }),
    }),
    {
      name: 'cupandco-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
