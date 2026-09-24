import { Platform, type TextStyle } from 'react-native';

const systemFont = Platform.select({
  ios: undefined,
  android: 'sans-serif',
  default:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
});

const text = (size: number, lineHeight: number, weight: TextStyle['fontWeight'] = '400'): TextStyle => ({
  fontFamily: systemFont,
  fontSize: size,
  lineHeight,
  fontWeight: weight,
  letterSpacing: size <= 12 ? 0.1 : -0.2,
});

export const typography = {
  hero: text(34, 40, '700'),
  title1: text(28, 34, '700'),
  title2: text(22, 28, '700'),
  title3: text(18, 24, '600'),
  headline: text(16, 21, '600'),
  body: text(16, 23, '400'),
  bodyMedium: text(16, 22, '500'),
  callout: text(15, 20, '500'),
  subheadline: text(14, 19, '500'),
  footnote: text(13, 18, '400'),
  caption: text(12, 16, '500'),
  micro: text(11, 14, '600'),
  mono: {
    ...text(15, 21, '500'),
    fontVariant: ['tabular-nums'],
  },
  button: text(15, 20, '600'),
  overline: {
    ...text(11, 14, '700'),
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
} satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
