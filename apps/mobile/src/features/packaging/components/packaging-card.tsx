import { formatCurrency } from "../../../shared/utils/format";
import type { Packaging } from "@lucro-caseiro/contracts";
import { Typography, useTheme, spacing, radii, fonts } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

import { typeColor, typeLabel } from "../domain";
import { PackagingAvatar } from "./packaging-avatar";
import { showAlert } from "../../../shared/components/alert-store";

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
  const isDark = theme.mode === "dark";
  const cardBg = isDark ? "rgba(44, 36, 32, 0.55)" : theme.colors.surfaceElevated;
  const border = theme.colors.border;
  const tColor = typeColor(theme, packaging.type);

  const subtitle = packaging.supplier ?? typeLabel(packaging.type);
  const subtitleIcon = packaging.supplier ? "storefront-outline" : "cube-outline";

  function openMenu() {
    showAlert({
      title: packaging.name,
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
      <PackagingAvatar
        name={packaging.name}
        type={packaging.type}
        photoUrl={packaging.photoUrl}
      />

      <Pressable style={{ flex: 1, gap: 6 }} onPress={onPress}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant="bodyBold"
            color={theme.colors.text}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {packaging.name}
          </Typography>
          <View
            style={{
              backgroundColor: `${tColor}26`,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: radii.full,
            }}
          >
            <Typography
              variant="caption"
              color={tColor}
              style={{ fontFamily: fonts.bold }}
            >
              {typeLabel(packaging.type)}
            </Typography>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name={subtitleIcon} size={14} color={theme.colors.textSecondary} />
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            numberOfLines={1}
          >
            {subtitle}
          </Typography>
        </View>
      </Pressable>

      <View style={{ alignItems: "flex-end", gap: spacing.sm }}>
        <Pressable
          onPress={openMenu}
          accessibilityRole="button"
          accessibilityLabel={`Ações de ${packaging.name}`}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 2 })}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={theme.colors.textSecondary}
          />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Typography variant="bodyBold" color={theme.colors.text}>
            {formatCurrency(packaging.unitCost)}
          </Typography>
          <Pressable onPress={onPress} hitSlop={8} accessibilityLabel="Ver detalhes">
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
