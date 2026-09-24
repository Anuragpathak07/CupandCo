import { Platform, type ViewStyle } from 'react-native';

export const shadows = {
  none: {},
  subtle: Platform.select<ViewStyle>({
    web: {
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
      elevation: 1,
    },
  }),
  card: Platform.select<ViewStyle>({
    web: {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 14,
      elevation: 2,
    },
  }),
  floating: Platform.select<ViewStyle>({
    web: {
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 6,
    },
  }),
  level1: Platform.select<ViewStyle>({
    web: {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 14,
      elevation: 2,
    },
  }),
  level2: Platform.select<ViewStyle>({
    web: {
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 6,
    },
  }),
} satisfies Record<string, ViewStyle>;

