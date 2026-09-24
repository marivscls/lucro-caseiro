import { radii, spacing } from "./theme";
import type { Theme } from "./theme";

/**
 * Padrão único de campo de formulário (celular e computador): caixa de 48 px,
 * raio 12, borda visível e foco na cor de ação. Usado pelo `Input` e pelos
 * campos do app (`TextField`, `SelectField`, `ChoiceField`).
 */
export const fieldMetrics = {
  height: 48,
  multilineHeight: 112,
  radius: radii.md,
  paddingX: spacing.lg,
  iconSize: 20,
  /** Rótulo → campo. */
  labelGap: spacing.sm,
  /** Entre campos de uma seção. */
  fieldGap: spacing.xl,
} as const;

export function fieldColors(theme: Theme) {
  const dark = theme.mode === "dark";
  return {
    /** Mais firme que a hairline dos cartões, para o campo se destacar no fundo branco. */
    border: dark ? "rgba(245, 244, 243, 0.2)" : "#D8D2CC",
    borderHover: theme.colors.textSecondary,
    borderFocus: theme.colors.primaryInteractive,
    borderError: theme.colors.alert,
    fieldBg: theme.colors.surface,
    fieldBgFocus: theme.colors.surfaceElevated,
    icon: theme.colors.textSecondary,
    placeholder: theme.colors.textSecondary,
    /** Anel de foco no navegador (cor de ação com 15% de opacidade). */
    focusRing: /^#[0-9a-f]{6}$/i.test(theme.colors.primaryInteractive)
      ? `${theme.colors.primaryInteractive}26`
      : "rgba(168, 90, 103, 0.15)",
  };
}
