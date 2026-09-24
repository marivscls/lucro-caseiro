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
    /**
     * Contorno do campo com contraste >= 3:1 no fundo (WCAG 1.4.11): o público
     * inclui pessoas mais velhas, e o campo precisa se ver sem depender do foco.
     */
    border: dark ? "#857E78" : "#928A83",
    borderHover: theme.colors.textSecondary,
    borderFocus: theme.colors.primaryInteractive,
    borderError: theme.colors.alert,
    fieldBg: theme.colors.surfaceElevated,
    fieldBgFocus: theme.colors.surfaceElevated,
    icon: theme.colors.textSecondary,
    placeholder: theme.colors.textSecondary,
    /** Anel de foco no navegador (cor de ação com 15% de opacidade). */
    focusRing: /^#[0-9a-f]{6}$/i.test(theme.colors.primaryInteractive)
      ? `${theme.colors.primaryInteractive}26`
      : "rgba(168, 90, 103, 0.15)",
  };
}
