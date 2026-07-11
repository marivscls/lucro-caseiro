import type { Material } from "@lucro-caseiro/contracts";
import {
  Typography,
  useTheme,
  spacing,
  radii,
  fonts,
  type Theme,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import {
  currentStockLabel,
  formatCost,
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

  const minusBg = isDark ? "rgba(255,255,255,0.08)" : theme.colors.surface;

  return (
    <View
      style={{
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: cardBg,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      {/* Cabeçalho: avatar + nome + badge + custo */}
      <Pressable
        onPress={onPress}
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
      >
        <IngredientAvatar name={material.name} emoji={material.icon} size={52} />
        <View style={{ flex: 1, gap: 4 }}>
          <Typography
            variant="bodyBold"
            color={theme.colors.text}
            numberOfLines={1}
            style={{ fontSize: 16 }}
          >
            {material.name}
          </Typography>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                backgroundColor: c.bg,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: radii.full,
              }}
            >
              <Typography
                variant="caption"
                color={c.fg}
                style={{ fontFamily: fonts.bold }}
              >
                {badge.label}
              </Typography>
            </View>
            {material.costPerUnit != null ? (
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {formatCost(material.costPerUnit, material.unit)}
              </Typography>
            ) : null}
          </View>
        </View>
      </Pressable>

      {/* Estoque atual + controle */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
          borderTopWidth: 1,
          borderTopColor: border,
          paddingTop: spacing.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Estoque atual
          </Typography>
          <Typography variant="h3" color={stockColor}>
            {currentStockLabel(material)}
          </Typography>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Pressable
            onPress={() => step(-1)}
            accessibilityRole="button"
            accessibilityLabel={`Diminuir ${material.name}`}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: minusBg,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="remove" size={24} color={theme.colors.text} />
          </Pressable>

          <Pressable
            onPress={() => step(1)}
            accessibilityRole="button"
            accessibilityLabel={`Adicionar ${material.name}`}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: radii.md,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="add" size={24} color={theme.colors.textOnPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
