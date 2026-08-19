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
  /** Contagem opcional à direita (filtros de lista). */
  count?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Pílula selecionável (filtros, formas de pagamento, status). Garante toque
 * mínimo de 44dp e estado de acessibilidade — use no lugar de `Pressable` cru.
 * Filtros de lista passam `count` para o badge circular; opções de formulário
 * omitem o badge e reutilizam o mesmo visual.
 */
export function Chip({
  label,
  selected = false,
  variant = "primary",
  onPress,
  icon,
  count,
  disabled = false,
  style,
}: ChipProps) {
  const { theme } = useTheme();
  const semantic = useSemanticVariantColors();
  const showCount = count != null;

  // Selecionado: `primary` usa o rosa de marca do filtro de lista; as demais
  // variantes usam o mesmo par fundo/texto semantico do Badge.
  let bg = theme.colors.surfaceElevated;
  let fg = theme.colors.text;
  let borderColor = theme.colors.border;
  if (selected && variant === "primary") {
    bg = theme.colors.primaryInteractive;
    fg = theme.colors.textOnPrimary;
    borderColor = theme.colors.primaryInteractive;
  } else if (selected) {
    bg = semantic[variant].bg;
    fg = semantic[variant].text;
    borderColor = semantic[variant].bg;
  }
  const badgeBg = selected ? "rgba(255,255,255,0.22)" : theme.colors.surface;
  const accessibilityLabel = showCount ? `${label}, ${count}` : label;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        {
          minHeight: 44,
          flexGrow: 0,
          flexShrink: 0,
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor,
          backgroundColor: bg,
          overflow: "visible",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <View>{icon}</View> : null}
      <Text
        style={{
          flexShrink: 0,
          fontSize: fontSizes.sm,
          fontFamily: fonts.semiBold,
          color: fg,
        }}
      >
        {label}
      </Text>
      {showCount ? (
        <View
          style={{
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            paddingHorizontal: 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: badgeBg,
          }}
        >
          <Text
            style={{
              fontSize: fontSizes.xs,
              fontFamily: fonts.bold,
              color: fg,
            }}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Fileira de filtros de lista: quebra linha em vez de cortar o último chip. */
export function FilterChipRow({
  children,
  style,
}: Readonly<{ children: React.ReactNode; style?: ViewStyle }>) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "flex-start",
          alignContent: "flex-start",
          width: "100%",
          gap: spacing.sm,
          overflow: "visible",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
