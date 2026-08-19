import { useTheme, type Theme } from "@lucro-caseiro/ui";

/**
 * Paleta editorial das telas recentes (vinho / rosa / lima).
 * No modo claro mantém as cores da referência; no escuro troca
 * superfícies e textos pelos tokens do tema para contraste AA.
 */
const LIGHT = {
  wine: "#4A2332",
  rose: "#B65F72",
  lime: "#DCE86A",
  offWhite: "#FAF8F6",
  ink: "#24181E",
  softRose: "#F5E5E8",
  surface: "#F5F3F1",
  muted: "#6D6266",
  white: "#FFFFFF",
  border: "#EADADD",
  limeText: "#747D00",
} as const;

export function brandScreenPalette(theme: Theme) {
  const light = theme.mode === "light";
  return {
    /** Texto/ícone vinho sobre superfícies da tela. */
    wine: light ? LIGHT.wine : theme.colors.primaryLight,
    /** Preenchimento vinho (hero, chip ativo, FAB). */
    wineFill: LIGHT.wine,
    rose: light ? LIGHT.rose : theme.colors.primaryInteractive,
    lime: LIGHT.lime,
    limeText: light ? LIGHT.limeText : LIGHT.lime,
    /** Texto sobre lima (sempre escuro — lima não muda). */
    onLime: LIGHT.wine,
    offWhite: light ? LIGHT.offWhite : theme.colors.background,
    background: light ? LIGHT.offWhite : theme.colors.background,
    ink: light ? LIGHT.ink : theme.colors.text,
    softRose: light ? LIGHT.softRose : theme.colors.primaryBg,
    surface: light ? LIGHT.surface : theme.colors.surface,
    neutral: light ? LIGHT.surface : theme.colors.surface,
    muted: light ? LIGHT.muted : theme.colors.textSecondary,
    warmGray: light ? LIGHT.muted : theme.colors.textSecondary,
    /** Superfície de card. */
    white: light ? LIGHT.white : theme.colors.surfaceElevated,
    /** Texto/ícone sobre wineFill. */
    onWine: LIGHT.white,
    border: light ? LIGHT.border : theme.colors.border,
    overlay: theme.colors.overlay,
  };
}

export type BrandScreenPalette = ReturnType<typeof brandScreenPalette>;

export function useBrandScreenPalette(): BrandScreenPalette {
  const { theme } = useTheme();
  return brandScreenPalette(theme);
}
