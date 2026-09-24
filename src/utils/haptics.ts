import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';

type HapticType = 'selection' | 'success' | 'warning' | 'error';

export async function triggerHaptic(type: HapticType = 'selection') {
  if (Platform.OS === 'web' || !useSettingsStore.getState().hapticsEnabled) return;
  try {
    switch (type) {
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        await Haptics.selectionAsync();
    }
  } catch {
    // Haptics are optional on web and some Android devices.
  }
}
