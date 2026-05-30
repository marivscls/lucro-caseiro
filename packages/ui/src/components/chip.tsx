import React from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";

import { useTheme } from "../theme-context";
import { fontSizes, radii, spacing } from "../theme";

interface ChipProps {
  label: string;
  /** Estado selecionado (preenche com a cor primária). */
  selected?: boolean;
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
  onPress,
  icon,
  disabled = false,
  style,
}: ChipProps) {
  const { theme } = useTheme();
  const bg = selected ? theme.colors.primary : theme.colors.surface;
  const fg = selected ? theme.colors.textOnPrimary : theme.colors.textSecondary;

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
      <Text style={{ fontSize: fontSizes.sm, fontWeight: "600", color: fg }}>{label}</Text>
    </Pressable>
  );
}
