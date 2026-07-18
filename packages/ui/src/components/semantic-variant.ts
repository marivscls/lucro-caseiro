import { useTheme } from "../theme-context";

/**
 * Taxonomia semantica canonica compartilhada por Badge e Chip.
 * Sempre que um selo/pílula comunicar status, use um destes nomes — nao
 * invente variantes locais nem rederives pares de cor por tela.
 */
export type SemanticVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "premium"
  | "lavender"
  | "primary";

interface SemanticColors {
  bg: string;
  text: string;
}

/** Pares fundo/texto AA de cada variante, derivados do tema ativo. */
export function useSemanticVariantColors(): Record<SemanticVariant, SemanticColors> {
  const { theme } = useTheme();
  return {
    success: { bg: theme.colors.successBg, text: theme.colors.success },
    warning: { bg: theme.colors.yellowBg, text: theme.colors.yellow },
    danger: { bg: theme.colors.alertBg, text: theme.colors.alert },
    info: { bg: theme.colors.blueBg, text: theme.colors.blue },
    neutral: { bg: theme.colors.surface, text: theme.colors.textSecondary },
    premium: { bg: theme.colors.premiumBg, text: theme.colors.premium },
    lavender: { bg: theme.colors.lavenderBg, text: theme.colors.lavender },
    primary: { bg: theme.colors.primaryBg, text: theme.colors.primaryStrong },
  };
}
