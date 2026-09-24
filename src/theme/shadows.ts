import { Platform, type ViewStyle } from 'react-native';

export const shadows = {
  none: {},
  subtle: Platform.select<ViewStyle>({
    web: {
      boxShadow: '0 1px 2px rgba(28, 28, 30, 0.04)',
    },
    default: {
      shadowColor: '#1C1C1E',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
  }),
  card: Platform.select<ViewStyle>({
    web: {
      boxShadow: '0 8px 30px rgba(28, 28, 30, 0.06)',
    },
    default: {
      shadowColor: '#1C1C1E',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 16,
      elevation: 3,
    },
  }),
  floating: Platform.select<ViewStyle>({
    web: {
      boxShadow: '0 18px 50px rgba(28, 28, 30, 0.14)',
    },
    default: {
      shadowColor: '#1C1C1E',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 28,
      elevation: 10,
    },
  }),
} satisfies Record<string, ViewStyle>;
