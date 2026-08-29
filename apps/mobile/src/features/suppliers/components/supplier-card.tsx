import type { SupplierOverviewItem } from "@lucro-caseiro/contracts";
import { Typography, fonts, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, useWindowDimensions, View } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { formatCurrency } from "../../../shared/utils/format";
import { SUPPLIER_CATEGORY_LABELS } from "../domain";
import { SupplierAvatar } from "./supplier-avatar";

interface SupplierCardProps {
  supplier: SupplierOverviewItem;
  onPress: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onReorder: () => void;
  onWhatsApp: () => void;
  onToggleFollowUp: () => void;
  onToggleRestock: () => void;
}

const CATEGORY_COLORS = {
  supplies: "#B65F72",
  packaging: "#79539A",
  food: "#5F7D22",
  other: "#A85A20",
} as const;

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" })
    .format(new Date(`${value}T12:00:00`))
    .replace(".", "");
}

function StatusChip({
  label,
  tone,
}: Readonly<{ label: string; tone: "lime" | "rose" | "neutral" }>) {
  const { theme } = useTheme();
  const palette = useBrandScreenPalette();
  let colors = { background: "#F5F3F1", foreground: "#5F5559" };
  if (tone === "lime") colors = { background: "#F2F5CD", foreground: "#5A620B" };
  if (tone === "rose") colors = { background: "#F5E5E8", foreground: "#9B4055" };
  if (theme.mode === "dark") {
    if (tone === "lime")
      colors = { background: palette.lime, foreground: palette.onLime };
    else if (tone === "rose") {
      colors = { background: palette.softRose, foreground: palette.rose };
    } else {
      colors = { background: palette.surface, foreground: palette.muted };
    }
  }
  return (
    <View
      style={{
        borderRadius: radii.sm,
        backgroundColor: colors.background,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Typography
        variant="caption"
        color={colors.foreground}
        style={{ fontFamily: fonts.semiBold }}
      >
        {label}
      </Typography>
    </View>
  );
}

export function SupplierCard(props: Readonly<SupplierCardProps>) {
  const { supplier } = props;
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const compactFooter = width <= 430;
  const canWhatsApp = supplier.hasWhatsApp && !!supplier.phone;
  let footerAction: React.ReactNode = null;
  if (supplier.lastPurchase) {
    footerAction = (
      <Pressable
        onPress={props.onReorder}
        accessibilityRole="button"
        accessibilityLabel={`Comprar novamente de ${supplier.name}`}
        style={({ pressed }) => ({
          minHeight: 44,
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Typography
          variant="caption"
          color={theme.colors.primaryStrong}
          style={{ fontFamily: fonts.bold }}
        >
          Comprar novamente
        </Typography>
      </Pressable>
    );
  } else if (canWhatsApp) {
    footerAction = (
      <Pressable
        onPress={props.onWhatsApp}
        accessibilityRole="button"
        accessibilityLabel={`Falar com ${supplier.name} no WhatsApp`}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <AppIcon name="logo-whatsapp" size={24} color={theme.colors.primaryStrong} />
      </Pressable>
    );
  }

  function openMenu() {
    showAlert({
      title: supplier.name,
      message: "O que você quer fazer?",
      buttons: [
        { text: "Ver detalhes", onPress: props.onPress },
        { text: "Editar fornecedor", onPress: props.onEdit },
        ...(canWhatsApp
          ? [{ text: "Falar no WhatsApp", onPress: props.onWhatsApp }]
          : []),
        {
          text: supplier.needsFollowUp ? "Remover pendência" : "Marcar para falar",
          onPress: props.onToggleFollowUp,
        },
        {
          text: supplier.restockSoon ? "Remover reposição" : "Marcar para repor",
          onPress: props.onToggleRestock,
        },
        { text: "Arquivar fornecedor", onPress: props.onArchive },
        {
          text: "Excluir fornecedor",
          style: "destructive" as const,
          onPress: props.onDelete,
        },
        { text: "Cancelar", style: "cancel" as const },
      ],
    });
  }

  return (
    <View
      style={[
        {
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
          overflow: "hidden",
        },
        theme.shadows.sm,
      ]}
    >
      <Pressable
        onPress={props.onPress}
        accessibilityRole="button"
        accessibilityLabel={`Ver fornecedor ${supplier.name}`}
        style={({ pressed }) => ({ padding: spacing.lg, opacity: pressed ? 0.82 : 1 })}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
          <SupplierAvatar supplier={supplier} size={64} />
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Typography variant="h3" numberOfLines={1}>
              {supplier.name}
            </Typography>
            <Typography
              variant="caption"
              color={CATEGORY_COLORS[supplier.category]}
              style={{ fontFamily: fonts.bold }}
            >
              {SUPPLIER_CATEGORY_LABELS[supplier.category].toLocaleUpperCase("pt-BR")}
            </Typography>
            <Typography
              variant="body"
              color={theme.colors.textSecondary}
              numberOfLines={2}
            >
              {supplier.purchaseDescription || "Sem descrição do que é comprado"}
            </Typography>
          </View>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              openMenu();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Ações de ${supplier.name}`}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              marginTop: -8,
              marginRight: -8,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.55 : 1,
            })}
          >
            <AppIcon name="ellipsis-vertical" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        {supplier.isPreferred ||
        supplier.hasOpenOrder ||
        supplier.needsFollowUp ||
        supplier.restockSoon ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.sm,
              marginLeft: 64 + spacing.md,
              marginTop: spacing.sm,
            }}
          >
            {supplier.isPreferred ? <StatusChip label="★ Preferido" tone="lime" /> : null}
            {supplier.hasOpenOrder ? (
              <StatusChip label="Pedido aberto" tone="lime" />
            ) : null}
            {supplier.needsFollowUp ? (
              <StatusChip label="Falar com fornecedor" tone="rose" />
            ) : null}
            {supplier.restockSoon ? (
              <StatusChip label="Repor em breve" tone="neutral" />
            ) : null}
          </View>
        ) : null}
      </Pressable>

      <View
        style={{
          minHeight: 56,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          flexDirection: compactFooter ? "column" : "row",
          alignItems: compactFooter ? "stretch" : "center",
          gap: spacing.sm,
        }}
      >
        <View
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        >
          <AppIcon name="calendar-outline" size={18} color={theme.colors.textSecondary} />
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{ flex: 1 }}
            numberOfLines={1}
          >
            {supplier.lastPurchase
              ? `Última compra: ${formatShortDate(supplier.lastPurchase.purchasedAt)}`
              : "Sem compras recentes"}
          </Typography>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: compactFooter ? "space-between" : "flex-end",
            gap: spacing.md,
          }}
        >
          {supplier.lastPurchase ? (
            <Typography variant="money" color={theme.colors.text}>
              {formatCurrency(supplier.lastPurchase.amount)}
            </Typography>
          ) : null}
          {footerAction}
        </View>
      </View>
    </View>
  );
}
