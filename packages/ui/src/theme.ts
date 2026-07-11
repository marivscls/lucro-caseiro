export const colors = {
  // Primary
  primary: "#C4707E",
  primaryLight: "#D4919C",
  primaryDark: "#A85A67",

  // Surfaces - Light
  background: "#FFFAF8",
  surface: "#F7EDE9",
  surfaceElevated: "#FFFFFF",

  // Surfaces - Dark
  backgroundDark: "#1E1814",
  surfaceDark: "#2C2420",
  surfaceElevatedDark: "#3A322D",

  // Text - Light
  text: "#4A3228",
  textSecondary: "#8B7355",
  textOnPrimary: "#FFFFFF",

  // Text - Dark
  textDark: "#F5E1DB",
  textSecondaryDark: "#B8A090",

  // Semantic
  success: "#6BBF96",
  successLight: "#E8F5EE",
  successDark: "#2D5A42",

  alert: "#E07272",
  alertLight: "#FDEAEA",
  alertDark: "#5A2D2D",

  premium: "#D4A054",
  premiumLight: "#FFF3E0",
  premiumDark: "#5A4222",

  // Accent
  lavender: "#B8A9D4",
  lavenderLight: "#F0ECF7",
  blue: "#89A5B5",
  blueLight: "#E8EFF3",
  yellow: "#E8C555",
  yellowLight: "#FFF8E1",

  // Utility
  transparent: "transparent",
  overlay: "rgba(30, 24, 20, 0.5)",
} as const;

export const fontSizes = {
  // Publico inclui idosos: nada abaixo de 13 (xs so para selos/labels curtos).
  xs: 13,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  "2xl": 28,
  "3xl": 36,
  "4xl": 48,
  hero: 64,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
} as const;

/**
 * Token unico de elevacao (design system). Nenhuma tela deve redefinir sombra
 * a mao — usa isto (ou o Card variant="elevated", que ja aplica).
 *
 * Scars: no Android, elevation + fundo translucido vira "caixa branca" (o
 * fundo do elemento elevado deve sempre ser opaco); sombra do Android fica
 * quadrada atras de cantos arredondados se a View tiver overflow:"hidden" —
 * nao combine este token com overflow:"hidden" na mesma View.
 */
export const elevation = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export type ThemeMode = "light" | "dark";

export interface Theme {
  mode: ThemeMode;
  colors: {
    primary: string;
    primaryLight: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textSecondary: string;
    textOnPrimary: string;
    success: string;
    successBg: string;
    alert: string;
    alertBg: string;
    premium: string;
    premiumBg: string;
    lavender: string;
    lavenderBg: string;
    blue: string;
    blueBg: string;
    yellow: string;
    yellowBg: string;
    overlay: string;
  };
}

export const lightTheme: Theme = {
  mode: "light",
  colors: {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    background: colors.background,
    surface: colors.surface,
    surfaceElevated: colors.surfaceElevated,
    text: colors.text,
    textSecondary: colors.textSecondary,
    textOnPrimary: colors.textOnPrimary,
    success: colors.success,
    successBg: colors.successLight,
    // Tons rebaixados p/ contraste >=4.5:1 sobre os fundos claros (WCAG AA).
    alert: "#B04545",
    alertBg: colors.alertLight,
    premium: "#8F6620",
    premiumBg: colors.premiumLight,
    lavender: colors.lavender,
    lavenderBg: colors.lavenderLight,
    blue: colors.blue,
    blueBg: colors.blueLight,
    yellow: "#7E660F",
    yellowBg: colors.yellowLight,
    overlay: colors.overlay,
  },
};

export const darkTheme: Theme = {
  mode: "dark",
  colors: {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    background: colors.backgroundDark,
    surface: colors.surfaceDark,
    surfaceElevated: colors.surfaceElevatedDark,
    text: colors.textDark,
    textSecondary: colors.textSecondaryDark,
    textOnPrimary: colors.textOnPrimary,
    success: colors.success,
    successBg: colors.successDark,
    alert: colors.alert,
    alertBg: colors.alertDark,
    premium: colors.premium,
    premiumBg: colors.premiumDark,
    lavender: colors.lavender,
    lavenderBg: "#332E3D",
    blue: colors.blue,
    blueBg: "#2D363D",
    yellow: colors.yellow,
    yellowBg: "#3D3522",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
};
