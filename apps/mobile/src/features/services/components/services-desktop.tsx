/**
 * Peças de Serviços no desktop (web >= 1024px). Estado e regras continuam em
 * `app/services.tsx`; aqui só a apresentação: filtros legíveis, cartões em
 * grade e estado vazio em cartão.
 */
import type { Service } from "@lucro-caseiro/contracts";
import {
  Button,
  Typography,
  radii,
  spacing,
  useTheme,
  type BadgeVariant,
} from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import {
  DesktopCard,
  desktopActionButton,
  desktopCardStyle,
} from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import {
  calculateStoredServicePricing,
  serviceCategoryLabel,
  serviceHasCostData,
  serviceMarginPercent,
} from "../domain";

type Theme = ReturnType<typeof useTheme>["theme"];

function badgeColors(theme: Theme, variant: BadgeVariant): { bg: string; fg: string } {
  switch (variant) {
    case "success":
      return { bg: theme.colors.successBg, fg: theme.colors.success };
    case "warning":
      return { bg: theme.colors.premiumBg, fg: theme.colors.premium };
    case "danger":
      return { bg: theme.colors.alertBg, fg: theme.colors.alert };
    case "info":
      return { bg: theme.colors.blueBg, fg: theme.colors.blue };
    default:
      return { bg: theme.colors.surface, fg: theme.colors.textSecondary };
  }
}

/** Selo de 14px (o `Badge` do celular usa 12px). */
function DesktopBadge({
  label,
  variant,
}: Readonly<{ label: string; variant: BadgeVariant }>) {
  const { theme } = useTheme();
  const colors = badgeColors(theme, variant);
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderRadius: radii.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
      }}
    >
      <Typography variant="desktopMeta" color={colors.fg} numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
}

/** Filtro de 48px com texto de 16px e contagem de 14px. */
export function ServiceFilterPill({
  label,
  count,
  selected,
  onPress,
}: Readonly<{ label: string; count: number; selected: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count}`}
      accessibilityState={{ selected }}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => {
        let borderColor: string = theme.colors.border;
        if (hovered) borderColor = theme.colors.textSecondary;
        if (selected) borderColor = palette.wineFill;
        return {
          minHeight: 48,
          paddingHorizontal: spacing.lg,
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor,
          backgroundColor: selected ? palette.wineFill : palette.white,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.85 : 1,
        };
      }}
    >
      <Typography
        variant="desktopBodyStrong"
        color={selected ? palette.onWine : palette.ink}
        numberOfLines={1}
      >
        {label}
      </Typography>
      <Typography
        variant="desktopMeta"
        color={selected ? palette.onWine : palette.warmGray}
        numberOfLines={1}
      >
        {count}
      </Typography>
    </Pressable>
  );
}

/**
 * Cartão de serviço na grade do desktop. O rodapé (custo e sugerido) fica
 * colado embaixo para alinhar entre cartões da mesma linha.
 */
export function ServiceDesktopCard({
  service,
  health,
  durationLabel,
  onPress,
}: Readonly<{
  service: Service;
  health: { label: string; variant: BadgeVariant };
  durationLabel: string;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const pricing = calculateStoredServicePricing(service);
  const hasCostData = serviceHasCostData(service);
  const margin = serviceMarginPercent(service);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver detalhes de ${service.name}`}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        desktopCardStyle(theme, { padding: 0 }),
        {
          flex: 1,
          overflow: "hidden",
          borderColor: hovered ? theme.colors.textSecondary : theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={{ flex: 1, padding: spacing["2xl"], gap: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography variant="desktopMeta" color={palette.rose} numberOfLines={1}>
              {serviceCategoryLabel(service)}
            </Typography>
            <Typography variant="desktopCardTitle" color={palette.ink} numberOfLines={2}>
              {service.name}
            </Typography>
          </View>
          <AppIcon name="chevron-forward" size={20} color={palette.warmGray} />
        </View>
        {service.description ? (
          <Typography variant="desktopBody" numberOfLines={2}>
            {service.description}
          </Typography>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <DesktopBadge
            label={service.active ? "Disponível" : "Pausado"}
            variant={service.active ? "success" : "neutral"}
          />
          <DesktopBadge label={health.label} variant={health.variant} />
        </View>
        <View style={{ flex: 1 }} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <AppIcon name="time-outline" size={18} color={palette.warmGray} />
            <Typography variant="desktopBody">{durationLabel}</Typography>
          </View>
          <Typography
            variant="desktopCardTitle"
            color={service.defaultPrice == null ? palette.warmGray : palette.wine}
            numberOfLines={1}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {service.defaultPrice == null
              ? "Valor combinado"
              : formatCurrency(service.defaultPrice)}
          </Typography>
        </View>
      </View>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          flexDirection: "row",
          minHeight: 72,
        }}
      >
        {hasCostData ? (
          <>
            <View
              style={{
                flex: 1,
                minWidth: 0,
                paddingHorizontal: spacing["2xl"],
                paddingVertical: spacing.md,
              }}
            >
              <Typography variant="desktopMeta">Custo</Typography>
              <Typography variant="desktopBodyStrong" numberOfLines={1}>
                {formatCurrency(pricing.totalCost)}
              </Typography>
            </View>
            <View
              style={{
                flex: 1.4,
                minWidth: 0,
                borderLeftWidth: 1,
                borderLeftColor: theme.colors.border,
                paddingHorizontal: spacing["2xl"],
                paddingVertical: spacing.md,
              }}
            >
              <Typography variant="desktopMeta">
                {margin == null ? "Sugerido" : `Sugerido · margem ${margin}%`}
              </Typography>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
              >
                <Typography variant="desktopBodyStrong" numberOfLines={1}>
                  {formatCurrency(pricing.suggestedPrice)}
                </Typography>
                <AppIcon name="trending-up" size={18} color={palette.limeText} />
              </View>
            </View>
          </>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              paddingHorizontal: spacing["2xl"],
              paddingVertical: spacing.md,
            }}
          >
            <Typography variant="desktopMeta">
              Adicione os custos para ver o preço sugerido e a margem.
            </Typography>
          </View>
        )}
      </View>
    </Pressable>
  );
}

/** Estado vazio do desktop: cartão tracejado na coluna. */
export function ServicesDesktopEmpty({
  title,
  description,
  actionLabel,
  onAction,
}: Readonly<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <DesktopCard style={{ borderStyle: "dashed", alignItems: "flex-start" }}>
      <AppIcon name="briefcase-outline" size={28} color={theme.colors.textSecondary} />
      <View style={{ gap: spacing.xs, maxWidth: 640 }}>
        <Typography variant="desktopCardTitle">{title}</Typography>
        <Typography variant="desktopBody">{description}</Typography>
      </View>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={desktopActionButton} />
      ) : null}
    </DesktopCard>
  );
}
