import type { Packaging } from "@lucro-caseiro/contracts";
import { radii, spacing, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, Share, View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { formatCurrency } from "../../../shared/utils/format";
import { useSupplierName } from "../../suppliers/hooks";
import {
  buildPackagingShareText,
  displayPackagingName,
  typeColor,
  typeLabel,
} from "../domain";
import { PackagingAvatar } from "./packaging-avatar";

interface PackagingDetailProps {
  readonly packaging: Packaging;
  readonly onDelete: () => void;
  readonly isDeleting?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function PackagingDetail({
  packaging,
  onDelete,
  isDeleting,
}: PackagingDetailProps) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const displayName = displayPackagingName(packaging.name);
  const packagingType = typeLabel(packaging.type);
  const tColor = typeColor(theme, packaging.type);
  const supplierName = useSupplierName(packaging.supplierId);
  const supplierDisplay = supplierName ?? packaging.supplier ?? "Não informado";

  function confirmDelete() {
    showAlert({
      title: "Excluir embalagem",
      message: `Tem certeza que deseja excluir “${displayName}”?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: onDelete },
      ],
    });
  }

  function share() {
    void Share.share({ message: buildPackagingShareText(packaging) });
  }

  return (
    <View style={{ flexShrink: 1, gap: spacing.lg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.xs,
        }}
      >
        <PackagingAvatar
          name={packaging.name}
          type={packaging.type}
          photoUrl={packaging.photoUrl}
          size={72}
        />
        <View style={{ flex: 1, minWidth: 0, gap: spacing.sm }}>
          <Typography variant="h2" color={palette.ink} numberOfLines={2}>
            {displayName}
          </Typography>
          <View
            style={{
              alignSelf: "flex-start",
              minHeight: 30,
              paddingHorizontal: spacing.md,
              borderRadius: radii.full,
              backgroundColor: `${tColor}1f`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="captionBold" color={tColor}>
              {packagingType}
            </Typography>
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "stretch",
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.white,
          paddingVertical: spacing.lg,
        }}
      >
        <View
          style={{
            flex: 1,
            minWidth: 0,
            gap: spacing.xs,
            paddingHorizontal: spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <AppIcon name="cash-outline" size={18} color={theme.colors.success} />
            <Typography variant="caption" color={palette.warmGray}>
              Custo por unidade
            </Typography>
          </View>
          <Typography variant="h2" color={theme.colors.success} numberOfLines={1}>
            {formatCurrency(packaging.unitCost)}
          </Typography>
        </View>

        <View style={{ width: 1, backgroundColor: palette.border }} />

        <View
          style={{
            flex: 1,
            minWidth: 0,
            gap: spacing.xs,
            paddingHorizontal: spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <AppIcon name="calendar-outline" size={18} color={palette.rose} />
            <Typography variant="caption" color={palette.warmGray}>
              Cadastrada em
            </Typography>
          </View>
          <Typography variant="bodyBold" color={palette.ink} numberOfLines={1}>
            {formatDate(packaging.createdAt)}
          </Typography>
        </View>
      </View>

      <View
        style={{
          minHeight: 64,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.white,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radii.md,
            backgroundColor: palette.softRose,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name="storefront-outline" size={20} color={palette.wine} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color={palette.warmGray}>
            Fornecedor
          </Typography>
          <Typography variant="bodyBold" color={palette.ink} numberOfLines={2}>
            {supplierDisplay}
          </Typography>
        </View>
      </View>

      <Pressable
        onPress={share}
        accessibilityRole="button"
        accessibilityLabel={`Compartilhar dados de ${displayName}`}
        style={({ pressed }) => ({
          minHeight: 48,
          borderRadius: radii.md,
          backgroundColor: theme.colors.primaryInteractive,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <AppIcon name="share-outline" size={20} color={theme.colors.textOnPrimary} />
        <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
          Compartilhar dados
        </Typography>
      </Pressable>

      <Pressable
        onPress={confirmDelete}
        disabled={isDeleting}
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${displayName}`}
        accessibilityState={{ disabled: isDeleting }}
        style={({ pressed }) => {
          let opacity = 1;
          if (isDeleting) opacity = 0.5;
          else if (pressed) opacity = 0.7;
          return {
            minHeight: 48,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: theme.colors.alert,
            backgroundColor: palette.white,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            opacity,
          };
        }}
      >
        <AppIcon name="trash-outline" size={20} color={theme.colors.alert} />
        <Typography variant="bodyBold" color={theme.colors.alert}>
          {isDeleting ? "Excluindo..." : "Excluir embalagem"}
        </Typography>
      </Pressable>
    </View>
  );
}
