/**
 * Lucro Caseiro — Design Tokens (v2)
 *
 * Fonte unica da verdade visual do produto (mobile, PWA e desktop).
 * Identidade canonica (ADR-0008): rose quente + Fraunces (display) +
 * Nunito Sans (texto). O app web espelha estes valores via CSS custom
 * properties em `apps/web/src/app/globals.css` — ao mudar algo aqui,
 * atualize la tambem (o cabecalho do globals.css aponta para ca).
 *
 * FILOSOFIA "PROFISSIONAL QUENTE" (principios aprovados em 2026-07-18):
 * O app serve qualquer publico (da confeiteira ao eletricista), entao o
 * rosa e TEMPERO, nunca prato principal — modelo Airbnb: marca rosa, telas
 * neutras. Regras:
 * 1. Canvas neutro quente (background/surface/text) cobre 85-90% da tela.
 * 2. Rosa so tem 4 papeis: (a) ACAO PRIMARIA da tela, (b) estado ativo /
 *    selecao, (c) momentos de marca (logo, saudacao, celebracao), (d) links
 *    e acoes-chave discretas.
 * 3. Cores semanticas carregam significado (verde = dinheiro, ambar =
 *    atencao, vermelho = problema); o rosa nunca compete com elas.
 * 4. Fundos rosados (rose50/100, primaryBg) sao excecao: pill de selecao e
 *    momentos emocionais. Cartoes operacionais sao neutros.
 * 5. Maximo 1 elemento PREENCHIDO de rosa por viewport (a acao primaria).
 *
 * Regras de contraste (publico inclui idosos — WCAG AA):
 * - Texto/icone pequeno sobre fundo: >= 4.5:1.
 * - Variantes `*Strong` sao os tons AA para texto sobre fundos claros.
 * - `primaryInteractive` e o fundo AA (>= 4.5:1 com texto branco) para
 *   botoes cheios; `primary` continua sendo a cor de marca para areas
 *   grandes, icones de destaque e preenchimentos sem texto por cima.
 */

export const colors = {
  // Escala rose (marca). 500 = cor canonica.
  rose50: "#FBF1F3",
  rose100: "#F9E7EA",
  rose200: "#EFC3CB",
  rose300: "#E29AA6",
  rose400: "#D48392",
  rose500: "#C4707E",
  rose600: "#B05765",
  rose700: "#A85A67",
  rose800: "#7A3641",
  rose900: "#5F2B33",

  // Primary (aliases de marca — manter compatibilidade)
  primary: "#C4707E",
  primaryLight: "#D4919C",
  primaryDark: "#A85A67",
  /** Tom AA para texto rose sobre fundos claros (>= 4.5:1). */
  primaryStrong: "#A84857",

  // Surfaces - Light (neutras de verdade: sem matiz rosa — o rosa e sotaque)
  background: "#FAFAF8",
  surface: "#F4F3F1",
  surfaceElevated: "#FFFFFF",

  // Surfaces - Dark
  backgroundDark: "#1B1917",
  surfaceDark: "#272422",
  surfaceElevatedDark: "#33302D",

  // Text - Light
  text: "#292624",
  /** AA (>= 4.5:1) sobre background/surface claros. */
  textSecondary: "#6B6660",
  textOnPrimary: "#FFFFFF",

  // Text - Dark
  textDark: "#F5F4F2",
  textSecondaryDark: "#A8A29E",

  // Semantic — pares base/fundos; os tons de TEXTO AA ficam nos temas.
  success: "#6BBF96",
  successLight: "#E8F5EE",
  successDark: "#2D5A42",
  /** AA para texto sobre successLight. */
  successStrong: "#2F7A56",

  alert: "#E07272",
  alertLight: "#FDEAEA",
  alertDark: "#5A2D2D",

  premium: "#D4A054",
  premiumLight: "#FFF3E0",
  premiumDark: "#5A4222",

  // Accent
  lavender: "#B8A9D4",
  lavenderLight: "#F0ECF7",
  /** AA para texto sobre lavenderLight. */
  lavenderStrong: "#6E5A9E",
  blue: "#89A5B5",
  blueLight: "#E8EFF3",
  /** AA para texto sobre blueLight. */
  blueStrong: "#446E84",
  yellow: "#E8C555",
  yellowLight: "#FFF8E1",

  // Bordas hairline dos containers (padrao canonico flat da home).
  border: "rgba(41, 38, 36, 0.08)",
  borderDark: "rgba(245, 244, 243, 0.11)",

  // Fundo rosado suave (CTAs tracejados, destaques da cor primaria).
  primarySoft: "#F9E7EA",
  primarySoftDark: "#3A2B2F",

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

/** Alturas de linha canonicas por faixa de tamanho. */
export const lineHeights = {
  tight: 1.15,
  snug: 1.3,
  body: 1.5,
} as const;

/**
 * Familias tipograficas oficiais (ADR-0008): Fraunces para display/titulos,
 * Nunito Sans para todo o resto. Os nomes batem com os exports de
 * `@expo-google-fonts/*` carregados no RootLayout do mobile via `useFonts`.
 * Nunca use `fontWeight` junto com estas familias (Android ignora/faz faux
 * bold) — escolha a familia do peso certo.
 */
export const fonts = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  regular: "NunitoSans_400Regular",
  semiBold: "NunitoSans_600SemiBold",
  bold: "NunitoSans_700Bold",
  extraBold: "NunitoSans_800ExtraBold",
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

/** Tamanhos canonicos de icone — nunca use valores fora desta escala. */
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
} as const;

export type ThemeMode = "light" | "dark";

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ThemeOverrides {
  primary: string;
  primaryLight?: string;
  primaryDark?: string;
  primaryStrong?: string;
  primaryInteractive?: string;
  primarySoft?: string;
  primarySoftDark?: string;
  background?: string;
  surface?: string;
  backgroundDark?: string;
  surfaceDark?: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: {
    primary: string;
    primaryLight: string;
    /** Texto/icone rose AA sobre fundos claros ou escuros. */
    primaryStrong: string;
    /** Fundo AA (texto branco >= 4.5:1) para botoes cheios. */
    primaryInteractive: string;
    primaryBg: string;
    border: string;
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
  /** Elevacao canonica: sm = cards sutis, md = cards elevados/FAB, lg = modais. */
  shadows: {
    sm: ShadowStyle;
    md: ShadowStyle;
    lg: ShadowStyle;
  };
}

const lightShadows: Theme["shadows"] = {
  sm: {
    shadowColor: "#4A3228",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: "#4A3228",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: "#4A3228",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
};

const darkShadows: Theme["shadows"] = {
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 6,
  },
};

export const lightTheme: Theme = {
  mode: "light",
  colors: {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    primaryStrong: colors.primaryStrong,
    primaryInteractive: colors.rose700,
    primaryBg: colors.primarySoft,
    border: colors.border,
    background: colors.background,
    surface: colors.surface,
    surfaceElevated: colors.surfaceElevated,
    text: colors.text,
    textSecondary: colors.textSecondary,
    textOnPrimary: colors.textOnPrimary,
    // Tons rebaixados p/ contraste >=4.5:1 sobre os fundos claros (WCAG AA).
    success: colors.successStrong,
    successBg: colors.successLight,
    alert: "#B04545",
    alertBg: colors.alertLight,
    premium: "#8F6620",
    premiumBg: colors.premiumLight,
    lavender: colors.lavenderStrong,
    lavenderBg: colors.lavenderLight,
    blue: colors.blueStrong,
    blueBg: colors.blueLight,
    yellow: "#7E660F",
    yellowBg: colors.yellowLight,
    overlay: colors.overlay,
  },
  shadows: lightShadows,
};

export const darkTheme: Theme = {
  mode: "dark",
  colors: {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    primaryStrong: colors.primaryLight,
    primaryInteractive: colors.rose700,
    primaryBg: colors.primarySoftDark,
    border: colors.borderDark,
    background: colors.backgroundDark,
    surface: colors.surfaceDark,
    surfaceElevated: colors.surfaceElevatedDark,
    text: colors.textDark,
    textSecondary: colors.textSecondaryDark,
    textOnPrimary: colors.textOnPrimary,
    // Tons clareados p/ contraste >=4.5:1 sobre os fundos semanticos escuros.
    success: "#8FD4B0",
    successBg: colors.successDark,
    alert: "#E88F8F",
    alertBg: colors.alertDark,
    premium: "#E0B273",
    premiumBg: colors.premiumDark,
    lavender: colors.lavender,
    lavenderBg: "#332E3D",
    blue: colors.blue,
    blueBg: "#2D363D",
    yellow: colors.yellow,
    yellowBg: "#3D3522",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
  shadows: darkShadows,
};

export function buildThemes(overrides?: ThemeOverrides): {
  light: Theme;
  dark: Theme;
} {
  if (!overrides) return { light: lightTheme, dark: darkTheme };

  const primaryLight = overrides.primaryLight ?? overrides.primary;
  const primaryStrong =
    overrides.primaryStrong ?? overrides.primaryDark ?? overrides.primary;
  const primaryInteractive =
    overrides.primaryInteractive ?? overrides.primaryDark ?? overrides.primary;

  return {
    light: {
      ...lightTheme,
      colors: {
        ...lightTheme.colors,
        primary: overrides.primary,
        primaryLight,
        primaryStrong,
        primaryInteractive,
        primaryBg: overrides.primarySoft ?? lightTheme.colors.primaryBg,
        background: overrides.background ?? lightTheme.colors.background,
        surface: overrides.surface ?? lightTheme.colors.surface,
      },
    },
    dark: {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        primary: overrides.primary,
        primaryLight,
        primaryStrong: overrides.primaryLight ?? primaryStrong,
        primaryInteractive,
        primaryBg: overrides.primarySoftDark ?? darkTheme.colors.primaryBg,
        background: overrides.backgroundDark ?? darkTheme.colors.background,
        surface: overrides.surfaceDark ?? darkTheme.colors.surface,
      },
    },
  };
}
