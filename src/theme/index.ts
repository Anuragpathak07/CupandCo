import { colors } from './colors';
import { layout, radii, spacing } from './spacing';
import { shadows } from './shadows';
import { typography } from './typography';

export { colors, type ColorToken } from './colors';
export { layout, radii, spacing } from './spacing';
export { shadows } from './shadows';
export { typography, type TypographyToken } from './typography';

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  layout,
} as const;
