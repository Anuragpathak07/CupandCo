import { Platform, type TextStyle } from 'react-native';

const systemFont = Platform.select({
  ios: '-apple-system, SF Pro Display, SF Pro Text',
  android: 'Roboto, sans-serif',
  default:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", "Segoe UI", sans-serif',
});

const text = (size: number, lineHeight: number, weight: TextStyle['fontWeight'] = '400'): TextStyle => ({
  fontFamily: systemFont,
  fontSize: size,
  lineHeight,
  fontWeight: weight,
  letterSpacing: size >= 28 ? -0.5 : size >= 20 ? -0.3 : size <= 13 ? 0 : -0.1,
});

export const typography = {
  largeTitle: text(34, 40, '700'),
  hero: text(34, 40, '700'),
  title: text(22, 28, '600'),
  title1: text(34, 40, '700'),
  title2: text(22, 28, '600'),
  title3: text(19, 24, '600'),
  headline: text(17, 22, '600'),
  body: text(15, 21, '400'),
  bodyMedium: text(15, 21, '500'),
  callout: text(15, 20, '500'),
  subheadline: text(15, 20, '500'),
  footnote: text(13, 17, '400'),
  caption: text(13, 17, '500'),
  micro: text(12, 15, '500'),
  mono: {
    ...text(15, 21, '500'),
    fontVariant: ['tabular-nums'],
  },
  button: text(15, 20, '600'),
  overline: {
    ...text(12, 16, '600'),
    letterSpacing: 1.0,
    textTransform: 'uppercase' as const,
  },
} satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;

