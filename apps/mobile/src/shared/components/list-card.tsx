import React from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Badge,
  Card,
  Typography,
  useTheme,
  radii,
  spacing,
  type BadgeVariant,
} from "@lucro-caseiro/ui";

/**
 * Container canônico de "lista em card" do app. Padroniza a hierarquia visual:
 * cabeçalho (ícone opcional + título + selo/ação), separador horizontal ponta a
 * ponta e itens (`ListCardItem`) com separadores que tocam as bordas do card.
 *
 * O padding interno é fixo (`spacing.lg`) para que os separadores "vazem" até
 * as bordas via margem negativa — não exponha padding por fora.
 */
const CONTENT_PADDING = spacing.lg;

interface ListCardProps {
  title: string;
  /** Texto auxiliar sob o título (contexto da lista). */
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Cor do ícone (padrão: primary). */
  iconColor?: string;
  /** Fundo do quadrado do ícone (padrão: primaryBg). */
  iconBg?: string;
  /** Selo à direita do título (ex.: contagem de itens). */
  badge?: string;
  badgeVariant?: BadgeVariant;
  /** Ação discreta à direita (ex.: "Ver todos"). Sem `onAction`, é decorativa
   * (use quando o card inteiro já é clicável via `onPress`). */
  actionLabel?: string;
  onAction?: () => void;
  onPress?: () => void;
  variant?: "surface" | "elevated";
  style?: ViewStyle;
  /** Linhas da lista — use `ListCardItem` para os separadores ponta a ponta. */
  children: React.ReactNode;
  /** Rodapé com separador ponta a ponta (ex.: expansor "Ver todos os N"). */
  footer?: React.ReactNode;
}

interface ListCardActionProps {
  label: string;
  onAction?: () => void;
}

/** Ação discreta do cabeçalho ("Ver todos ›"); sem `onAction`, é só visual. */
function ListCardAction({ label, onAction }: Readonly<ListCardActionProps>) {
  const { theme } = useTheme();
  const content = (
    <>
      <Typography variant="caption" color={theme.colors.primary}>
        {label}
      </Typography>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.primaryLight} />
    </>
  );
  const rowStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  };
  if (!onAction) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable onPress={onAction} accessibilityRole="button" style={rowStyle}>
      {content}
    </Pressable>
  );
}

export function ListCard({
  title,
  subtitle,
  icon,
  iconColor,
  iconBg,
  badge,
  badgeVariant = "neutral",
  actionLabel,
  onAction,
  onPress,
  variant = "surface",
  style,
  children,
  footer,
}: Readonly<ListCardProps>) {
  const { theme } = useTheme();

  return (
    <Card variant={variant} padding="lg" onPress={onPress} style={style}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        {icon ? (
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: radii.md,
              backgroundColor: iconBg ?? theme.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={icon} size={18} color={iconColor ?? theme.colors.primary} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Typography variant="h3">{title}</Typography>
          {subtitle ? (
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {subtitle}
            </Typography>
          ) : null}
        </View>
        {badge ? <Badge label={badge} variant={badgeVariant} /> : null}
        {actionLabel ? <ListCardAction label={actionLabel} onAction={onAction} /> : null}
      </View>

      {/* Separador do cabeçalho: ponta a ponta (margem negativa = padding do card) */}
      <View
        style={{
          height: 1,
          backgroundColor: theme.colors.border,
          marginHorizontal: -CONTENT_PADDING,
          marginTop: spacing.md,
        }}
      />

      {children}

      {footer ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            marginHorizontal: -CONTENT_PADDING,
            paddingHorizontal: CONTENT_PADDING,
            marginTop: spacing.xs,
            paddingTop: spacing.sm,
          }}
        >
          {footer}
        </View>
      ) : null}
    </Card>
  );
}

interface ListCardItemProps {
  /** O primeiro item da lista não tem separador superior. */
  first?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

/** Linha de um `ListCard`; o separador superior vai de ponta a ponta do card. */
export function ListCardItem({
  first = false,
  style,
  children,
}: Readonly<ListCardItemProps>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        !first && {
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          marginHorizontal: -CONTENT_PADDING,
          paddingHorizontal: CONTENT_PADDING,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
