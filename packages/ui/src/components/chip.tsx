import React from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";

import { useTheme } from "../theme-context";
import { fonts, fontSizes, radii, spacing } from "../theme";
import {
  useSemanticVariantColors,
  type SemanticVariant,
} from "./semantic-variant";

// Mesma taxonomia semantica do Badge — nao crie nomes locais de variante.
export type ChipVariant = SemanticVariant;

interface ChipProps {
  label: string;
  /** Estado selecionado (preenche com a cor da variante). */
  selected?: boolean;
  /** Tom semantico do estado selecionado (padrao: primary). */
  variant?: ChipVariant;
  onPress?: () => void;
  /** Ícone opcional à esquerda do texto. */
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Pílula selecionável (filtros, formas de pagamento, status). Garante toque
 * mínimo de 44dp e estado de acessibilidade — use no lugar de `Pressable` cru.
 */
export function Chip({
  label,
  selected = false,
  variant = "primary",
  onPress,
  icon,
  disabled = false,
  style,
}: ChipProps) {
  const { theme } = useTheme();
  const semantic = useSemanticVariantColors();

  // Selecionado: `primary` usa o fundo interativo AA (texto branco >= 4.5:1);
  // as demais variantes usam o mesmo par fundo/texto semantico do Badge.
  const bg = selected
    ? variant === "primary"
      ? theme.colors.primaryInteractive
      : semantic[variant].bg
    : theme.colors.surface;
  const fg = selected
    ? variant === "primary"
      ? theme.colors.textOnPrimary
      : semantic[variant].text
    : theme.colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        {
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.lg,
          borderRadius: radii.full,
          backgroundColor: bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <View>{icon}</View> : null}
      <Text style={{ fontSize: fontSizes.sm, fontFamily: fonts.semiBold, color: fg }}>{label}</Text>
    </Pressable>
  );
}
