import { formatCurrency } from "../../../shared/utils/format";
import type { Packaging } from "@lucro-caseiro/contracts";
import {
  Typography,
  fonts,
  fontSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { displayIngredientName } from "../../../shared/ingredient-image/resolve";
import { isLowStock, typeLabel, typeStripeColor } from "../domain";
import { PackagingAvatar } from "./packaging-avatar";

interface PackagingCardProps {
  readonly packaging: Packaging;
  readonly onPress: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

export function PackagingCard({
  packaging,
  onPress,
  onEdit,
  onDelete,
}: PackagingCardProps) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const displayName = displayIngredientName(packaging.name);
  const stripe = typeStripeColor(packaging.type);
  const lowStock = isLowStock(packaging);
  const stockHint = packaging.supplier?.trim() || null;

  function openMenu() {
    showAlert({
      title: displayName,
      message: "O que você quer fazer?",
      buttons: [
        { text: "Editar", onPress: onEdit },
        { text: "Excluir embalagem", style: "destructive", onPress: onDelete },
        { text: "Cancelar", style: "cancel" },
      ],
    });
  }

  return (
    <View
      style={{
        minHeight: 80,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.white,
        overflow: "hidden",
        flexDirection: "row",
      }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: 4, alignSelf: "stretch", backgroundColor: stripe }}
      />

      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingVertical: spacing.sm,
          paddingLeft: spacing.md,
          paddingRight: spacing.sm,
        }}
      >
        <PackagingAvatar
          name={packaging.name}
          type={packaging.type}
          photoUrl={packaging.photoUrl}
          size={52}
        />

        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalhes de ${displayName}`}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 0,
            gap: 4,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Typography
            variant="bodyBold"
            color={palette.ink}
            numberOfLines={1}
            style={{ fontFamily: fonts.bold, fontSize: fontSizes.md }}
          >
            {displayName}
          </Typography>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: palette.surface,
              paddingHorizontal: spacing.sm,
              paddingVertical: 2,
              borderRadius: radii.full,
            }}
          >
            <Typography
              variant="caption"
              color={palette.ink}
              style={{ fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 }}
            >
              {typeLabel(packaging.type)}
            </Typography>
          </View>
          {lowStock ? (
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: palette.lime,
                borderRadius: radii.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
              }}
            >
              <AppIcon name="alert-circle-outline" size={12} color={palette.ink} />
              <Typography
                variant="caption"
                color={palette.ink}
                style={{ fontFamily: fonts.bold, fontSize: 11, lineHeight: 14 }}
              >
                estoque baixo
              </Typography>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <AppIcon name="cube-outline" size={14} color={palette.muted} />
              <Typography
                variant="caption"
                color={palette.muted}
                numberOfLines={1}
                style={{ fontFamily: fonts.medium, flexShrink: 1 }}
              >
                {stockHint ?? typeLabel(packaging.type)}
              </Typography>
            </View>
          )}
        </Pressable>

        <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
          <Pressable
            onPress={openMenu}
            accessibilityRole="button"
            accessibilityLabel={`Ações de ${displayName}`}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 2 })}
          >
            <AppIcon name="ellipsis-vertical" size={20} color={palette.muted} />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Typography
              variant="bodyBold"
              color={palette.ink}
              style={{ fontFamily: fonts.bold, fontSize: fontSizes.md }}
            >
              {formatCurrency(packaging.unitCost)}
            </Typography>
            <Pressable
              onPress={onPress}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${displayName}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 2 })}
            >
              <AppIcon name="chevron-forward" size={20} color={palette.rose} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
