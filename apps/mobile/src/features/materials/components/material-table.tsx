import type { Material } from "@lucro-caseiro/contracts";
import { Typography, fonts, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { displayIngredientName } from "../../../shared/ingredient-image/resolve";
import {
  DesktopTable,
  type DesktopTableColumn,
} from "../../../shared/layout/desktop-page";
import {
  currentStockLabel,
  formatCost,
  formatQty,
  getStockStatus,
  materialCategory,
  stockLevelRatio,
} from "../domain";
import { MaterialStockControls, statusPresentation } from "./material-card";

/** Situação do estoque no desktop: selo de 14px + barra até o mínimo. */
function StockStatusCell({ material }: Readonly<{ material: Material }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const status = getStockStatus(material);
  const presentation = statusPresentation(status, palette, theme);
  const progress = `${Math.round(stockLevelRatio(material) * 100)}%` as const;

  return (
    <View style={{ width: "100%", maxWidth: 180, gap: spacing.sm }}>
      <View
        style={{
          alignSelf: "flex-start",
          paddingHorizontal: spacing.md,
          paddingVertical: 2,
          borderRadius: radii.full,
          backgroundColor: presentation.background,
        }}
      >
        <Typography
          variant="desktopMeta"
          color={presentation.color}
          numberOfLines={1}
          style={{ fontFamily: fonts.bold }}
        >
          {presentation.label}
        </Typography>
      </View>
      <View
        style={{
          height: 6,
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

/**
 * Estoque em tabela no desktop (web >= 1024px): material, custo, quantidade,
 * situação e os mesmos botões −/+ do card. A linha abre a edição.
 */
export function MaterialTable({
  materials,
  onMaterialPress,
}: Readonly<{
  materials: readonly Material[];
  onMaterialPress: (material: Material) => void;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);

  const columns: DesktopTableColumn<Material>[] = [
    {
      key: "material",
      title: "Material",
      flex: 2.2,
      render: (material) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            width: "100%",
          }}
        >
          <IngredientAvatar
            name={displayIngredientName(material.name)}
            emoji={material.icon}
            size={44}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="desktopBodyStrong" numberOfLines={1}>
              {displayIngredientName(material.name)}
            </Typography>
            <Typography variant="desktopMeta" numberOfLines={1}>
              {materialCategory(material)}
            </Typography>
          </View>
        </View>
      ),
    },
    {
      key: "cost",
      title: "Custo",
      flex: 1,
      render: (material) => (
        <Typography variant="desktopBody" numberOfLines={1}>
          {material.costPerUnit == null
            ? "Não informado"
            : formatCost(material.costPerUnit, material.unit)}
        </Typography>
      ),
    },
    {
      key: "stock",
      title: "Em estoque",
      flex: 1,
      render: (material) => (
        <View>
          <Typography
            variant="desktopBodyStrong"
            color={palette.wine}
            numberOfLines={1}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {currentStockLabel(material)}
          </Typography>
          <Typography variant="desktopMeta" numberOfLines={1}>
            {material.stockAlertThreshold == null
              ? "Mínimo não definido"
              : `Mínimo ${formatQty(material.stockAlertThreshold)} ${material.unit}`}
          </Typography>
        </View>
      ),
    },
    {
      key: "status",
      title: "Situação",
      flex: 1.1,
      render: (material) => <StockStatusCell material={material} />,
    },
    {
      key: "adjust",
      title: "Ajustar",
      width: 96,
      align: "right",
      render: (material) => <MaterialStockControls material={material} />,
    },
  ];

  return (
    <DesktopTable
      columns={columns}
      rows={materials}
      keyExtractor={(material) => material.id}
      onRowPress={onMaterialPress}
      rowAccessibilityLabel={(material) =>
        `Editar ${displayIngredientName(material.name)}`
      }
    />
  );
}
