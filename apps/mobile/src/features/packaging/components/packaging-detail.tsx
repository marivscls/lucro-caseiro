import type { Packaging } from "@lucro-caseiro/contracts";
import { Button, radii, spacing, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Share, View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { FormActions } from "../../../shared/components/form-layout";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
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
  const isDesktop = useDesktopLayout();
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

      <FormActions style={{ flexGrow: 0, flexBasis: "auto" }}>
        <Button
          title="Compartilhar dados"
          accessibilityLabel={`Compartilhar dados de ${displayName}`}
          icon={
            <AppIcon name="share-outline" size={20} color={theme.colors.textOnPrimary} />
          }
          onPress={share}
        />
      </FormActions>

      <View style={{ alignItems: isDesktop ? "flex-start" : "stretch" }}>
        <Button
          title={isDeleting ? "Excluindo..." : "Excluir embalagem"}
          accessibilityLabel={`Excluir ${displayName}`}
          variant="alertOutline"
          icon={<AppIcon name="trash-outline" size={18} color={theme.colors.alert} />}
          onPress={confirmDelete}
          disabled={isDeleting}
        />
      </View>
    </View>
  );
}
