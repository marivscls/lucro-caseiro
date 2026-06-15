import type { Material } from "@lucro-caseiro/contracts";
import { Typography, useTheme, spacing, radii, type Theme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import {
  currentStockLabel,
  formatCost,
  formatQty,
  isLowStock,
  stockBadge,
  type StockTone,
} from "../domain";
import { useAdjustMaterial } from "../hooks";

interface MaterialCardProps {
  readonly material: Material;
  readonly onPress?: () => void;
}

function toneColors(theme: Theme, tone: StockTone): { bg: string; fg: string } {
  if (tone === "warn") return { bg: theme.colors.premiumBg, fg: theme.colors.premium };
  if (tone === "danger") return { bg: theme.colors.alertBg, fg: theme.colors.alert };
  return { bg: theme.colors.successBg, fg: theme.colors.success };
}

export function MaterialCard({ material, onPress }: MaterialCardProps) {
  const { theme } = useTheme();
  const adjust = useAdjustMaterial();
  const badge = stockBadge(material);
  const c = toneColors(theme, badge.tone);
  const isDark = theme.mode === "dark";
  const low = isLowStock(material) || material.stockQuantity <= 0;

  const cardBg = isDark ? "rgba(44, 36, 32, 0.55)" : theme.colors.surfaceElevated;
  const border = isDark ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.1)";
  const stockColor = low ? theme.colors.alert : theme.colors.success;

  const step = (delta: number) => adjust.mutate({ id: material.id, delta });

  return (
    <View
      style={{
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: cardBg,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
      }}
    >
      <IngredientAvatar name={material.name} size={52} />

      <Pressable style={{ flex: 1, gap: 6 }} onPress={onPress}>
        <Typography
          variant="bodyBold"
          color={theme.colors.text}
          numberOfLines={1}
          style={{ fontSize: 16 }}
        >
          {material.name}
        </Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              backgroundColor: c.bg,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: radii.full,
            }}
          >
            <Typography variant="caption" color={c.fg} style={{ fontWeight: "700" }}>
              {badge.label}
            </Typography>
          </View>
          {material.costPerUnit != null ? (
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {formatCost(material.costPerUnit, material.unit)}
            </Typography>
          ) : null}
        </View>
        <Typography variant="caption" color={stockColor}>
          Estoque atual: {currentStockLabel(material)}
        </Typography>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Pressable
          onPress={() => step(-1)}
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${material.name}`}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="remove" size={22} color={theme.colors.text} />
        </Pressable>

        <View style={{ minWidth: 44, alignItems: "center" }}>
          <Typography
            variant="bodyBold"
            color={theme.colors.text}
            style={{ fontSize: 22, lineHeight: 26 }}
          >
            {formatQty(material.stockQuantity)}
          </Typography>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {material.unit}
          </Typography>
        </View>

        <Pressable
          onPress={() => step(1)}
          accessibilityRole="button"
          accessibilityLabel={`Adicionar ${material.name}`}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: radii.md,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="add" size={22} color={theme.colors.textOnPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
