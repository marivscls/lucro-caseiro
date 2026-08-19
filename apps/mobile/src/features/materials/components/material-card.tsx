import type { Material } from "@lucro-caseiro/contracts";
import {
  fontSizes,
  fonts,
  radii,
  spacing,
  Typography,
  useTheme,
} from "@lucro-caseiro/ui";
import React from "react";
import { ActivityIndicator, Pressable, View, useWindowDimensions } from "react-native";

import {
  brandScreenPalette,
  type BrandScreenPalette,
} from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { displayIngredientName } from "../../../shared/ingredient-image/resolve";
import {
  currentStockLabel,
  formatCost,
  formatQty,
  getStockStatus,
  materialCategory,
  stockLevelRatio,
  type StockStatus,
} from "../domain";
import { useAdjustMaterial } from "../hooks";

interface MaterialCardProps {
  readonly material: Material;
  readonly onPress?: () => void;
  readonly showDivider?: boolean;
}

function statusPresentation(status: StockStatus, palette: BrandScreenPalette) {
  if (status === "low") {
    return { label: "Estoque baixo", background: palette.softRose, color: palette.rose };
  }
  if (status === "attention") {
    return { label: "Atenção", background: palette.softRose, color: palette.rose };
  }
  return { label: "Em dia", background: `${palette.lime}59`, color: palette.onLime };
}

function QuantityControl({
  material,
  delta,
  pending,
  onPress,
}: Readonly<{
  material: Material;
  delta: -1 | 1;
  pending: boolean;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const disabled = pending || (delta < 0 && material.stockQuantity <= 0);
  const primary = delta > 0;
  const displayName = displayIngredientName(material.name);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${primary ? "Adicionar" : "Diminuir"} estoque de ${displayName}`}
      accessibilityState={{ disabled, busy: pending }}
      style={({ pressed }) => {
        let opacity = 1;
        if (disabled) opacity = 0.42;
        else if (pressed) opacity = 0.72;
        return {
          width: 44,
          height: 44,
          borderRadius: radii.md,
          borderWidth: primary ? 0 : 1,
          borderColor: palette.rose,
          backgroundColor: primary ? palette.rose : palette.white,
          alignItems: "center",
          justifyContent: "center",
          opacity,
        };
      }}
    >
      {pending ? (
        <ActivityIndicator size="small" color={primary ? palette.onWine : palette.wine} />
      ) : (
        <AppIcon
          name={primary ? "add" : "remove"}
          size={24}
          color={primary ? palette.onWine : palette.ink}
          strokeWidth={2.2}
        />
      )}
    </Pressable>
  );
}

function StockStatusBlock({
  material,
  dense = false,
}: Readonly<{ material: Material; dense?: boolean }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const status = getStockStatus(material);
  const presentation = statusPresentation(status, palette);
  const progress = `${Math.round(stockLevelRatio(material) * 100)}%` as const;

  return (
    <View style={{ flex: 1, minWidth: dense ? 58 : 104, gap: 7 }}>
      <View
        style={{
          alignSelf: "flex-start",
          paddingHorizontal: spacing.sm,
          paddingVertical: 5,
          borderRadius: radii.full,
          backgroundColor: presentation.background,
        }}
      >
        <Typography
          variant="caption"
          color={presentation.color}
          numberOfLines={1}
          style={{ fontFamily: fonts.bold, fontSize: 11 }}
        >
          {presentation.label}
        </Typography>
      </View>
      <View
        style={{
          height: 7,
          borderRadius: radii.full,
          backgroundColor: palette.neutral,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: progress,
            height: "100%",
            borderRadius: radii.full,
            backgroundColor: status === "ok" ? palette.lime : palette.rose,
            opacity: status === "attention" ? 0.72 : 1,
          }}
        />
      </View>
    </View>
  );
}

function MaterialIdentity({
  material,
  onPress,
}: Readonly<{ material: Material; onPress?: () => void }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const displayName = displayIngredientName(material.name);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `Editar ${displayName}` : undefined}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        gap: 2,
        opacity: pressed ? 0.68 : 1,
      })}
    >
      <Typography
        variant="bodyBold"
        color={palette.ink}
        numberOfLines={1}
        style={{ fontSize: fontSizes.md, fontFamily: fonts.bold }}
      >
        {displayName}
      </Typography>
      <Typography
        variant="caption"
        color={palette.muted}
        numberOfLines={1}
        style={{ fontSize: 12 }}
      >
        {materialCategory(material)}
      </Typography>
      <Typography
        variant="caption"
        color={palette.muted}
        numberOfLines={1}
        style={{ fontSize: 12 }}
      >
        {material.costPerUnit == null
          ? "Custo não informado"
          : formatCost(material.costPerUnit, material.unit)}
      </Typography>
    </Pressable>
  );
}

function QuantityBlock({ material }: Readonly<{ material: Material }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <View style={{ minWidth: 82, gap: 2 }}>
      <Typography
        variant="h3"
        color={palette.wine}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{ fontSize: 19 }}
      >
        {currentStockLabel(material)}
      </Typography>
      <Typography
        variant="caption"
        color={palette.muted}
        numberOfLines={1}
        style={{ fontSize: 11 }}
      >
        {material.stockAlertThreshold == null
          ? "mín. não definido"
          : `mín. ${formatQty(material.stockAlertThreshold)} ${material.unit}`}
      </Typography>
    </View>
  );
}

export function MaterialCard({
  material,
  onPress,
  showDivider = true,
}: MaterialCardProps) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const { width } = useWindowDimensions();
  const compact = width < 640;
  const ultraCompact = width < 360;
  const displayName = displayIngredientName(material.name);
  const adjust = useAdjustMaterial();
  const pending = adjust.isPending;

  function step(delta: -1 | 1) {
    if (pending || (delta < 0 && material.stockQuantity <= 0)) return;
    adjust.mutate({ id: material.id, delta });
  }

  const controls = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <QuantityControl
        material={material}
        delta={-1}
        pending={pending && adjust.variables?.delta === -1}
        onPress={() => step(-1)}
      />
      <QuantityControl
        material={material}
        delta={1}
        pending={pending && adjust.variables?.delta === 1}
        onPress={() => step(1)}
      />
    </View>
  );

  let compactDetails: React.ReactNode = null;
  if (compact && ultraCompact) {
    compactDetails = (
      <>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.sm,
          }}
        >
          <QuantityBlock material={material} />
          {controls}
        </View>
        <StockStatusBlock material={material} />
      </>
    );
  } else if (compact) {
    compactDetails = (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: spacing.sm,
        }}
      >
        <QuantityBlock material={material} />
        <StockStatusBlock material={material} dense />
        {controls}
      </View>
    );
  }

  return (
    <View
      style={{
        paddingHorizontal: compact ? spacing.md : spacing.lg,
        paddingVertical: spacing.lg,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: palette.border,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <IngredientAvatar name={displayName} emoji={material.icon} size={52} />
        <MaterialIdentity material={material} onPress={onPress} />
        {!compact ? <QuantityBlock material={material} /> : null}
        {!compact ? <StockStatusBlock material={material} /> : null}
        {!compact ? controls : null}
      </View>
      {compactDetails}
    </View>
  );
}
