export const colors = {
  // Brand palette
  deepNavy: "#1C1C1E",
  coffeeNavy: "#1C1C1E",
  champagneGold: "#C5A059",
  warmGold: "#C5A059",
  cream: "#FAF9F5",
  white: "#FFFFFF",
  charcoal: "#1C1C1E",
  mutedGray: "#706F6E",

  // Core Surface & Canvas Tokens
  canvas: "#FAF9F5",
  background: "#FAF9F5",
  surface: "#FFFFFF",
  secondarySurface: "#F2F1EC",
  surfaceMuted: "#F2F1EC",
  surfacePressed: "#E8E7E2",

  // Typography & Content
  ink: "#1C1C1E",
  inkSecondary: "#6E6E73",
  inkTertiary: "#98989D",
  textPrimary: "#1C1C1E",
  textSecondary: "#6E6E73",

  // Accent (Muted desaturated gold)
  accent: "#C5A059",
  accentSoft: "rgba(197, 160, 89, 0.12)",
  accentDark: "#A88438",
  primary: "#1C1C1E",

  // Borders & Separators
  border: "#E5E5EA",
  borderSubtle: "rgba(0, 0, 0, 0.05)",
  borderStrong: "#D1D1D6",

  // Semantic Pills & Badges
  completed: "#34C759",
  completedSoft: "rgba(52, 199, 89, 0.12)",
  completedText: "#248A3D",

  pending: "#FF9500",
  pendingSoft: "rgba(255, 149, 0, 0.12)",
  pendingText: "#C67600",

  progress: "#007AFF",
  progressSoft: "rgba(0, 122, 255, 0.12)",
  progressText: "#0051A8",

  cancelled: "#FF3B30",
  cancelledSoft: "rgba(255, 59, 48, 0.10)",
  cancelledText: "#D70015",

  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  danger: "#FF3B30",

  // Layering & Transparency
  overlay: "rgba(0, 0, 0, 0.40)",
  scrim: "rgba(250, 249, 245, 0.82)",
  frostedGlass: "rgba(255, 255, 255, 0.76)",
  black: "#000000",
  shadow: "rgba(0, 0, 0, 0.06)",
};

export type ColorToken = keyof typeof colors;

