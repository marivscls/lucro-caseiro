import { formatCurrency } from "../../../shared/utils/format";
import type { Packaging } from "@lucro-caseiro/contracts";
import { Typography, useTheme, spacing, radii, fonts } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, Share, View } from "react-native";

import { buildPackagingShareText, typeColor, typeLabel } from "../domain";
import { showAlert } from "../../../shared/components/alert-store";
import { useSupplierName } from "../../suppliers/hooks";

interface PackagingDetailProps {
  readonly packaging: Packaging;
  readonly onDelete: () => void;
  readonly isDeleting?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function StatCol({
  icon,
  label,
  value,
}: Readonly<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{ flex: 1, alignItems: "center", gap: 6, paddingHorizontal: spacing.xs }}
    >
      <Ionicons name={icon} size={22} color={theme.colors.primary} />
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        numberOfLines={1}
        style={{ textAlign: "center" }}
      >
        {label}
      </Typography>
      <Typography
        variant="bodyBold"
        color={theme.colors.text}
        numberOfLines={1}
        style={{ textAlign: "center" }}
      >
        {value}
      </Typography>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: Readonly<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
      }}
    >
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <View style={{ flex: 1 }}>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {label}
        </Typography>
        <Typography variant="bodyBold" color={theme.colors.text}>
          {value}
        </Typography>
      </View>
    </View>
  );
}

export function PackagingDetail({
  packaging,
  onDelete,
  isDeleting,
}: PackagingDetailProps) {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";
  const cardBg = isDark ? "rgba(44, 36, 32, 0.55)" : theme.colors.surfaceElevated;
  const border = isDark ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.1)";
  const tColor = typeColor(theme, packaging.type);
  const supplierName = useSupplierName(packaging.supplierId);
  const supplierDisplay = supplierName ?? packaging.supplier ?? "Nenhum";

  function confirmDelete() {
    showAlert({
      title: "Excluir embalagem",
      message: "Tem certeza que deseja excluir esta embalagem?",
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
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing["3xl"],
        gap: spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Typography variant="h1" color={theme.colors.text}>
        {typeLabel(packaging.type)}
      </Typography>

      {/* Card principal */}
      <View
        style={{
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: cardBg,
          padding: spacing.lg,
          gap: spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Tipo
            </Typography>
            <Typography variant="bodyBold" color={theme.colors.text}>
              {typeLabel(packaging.type)}
            </Typography>
          </View>
          <View
            style={{
              backgroundColor: `${tColor}26`,
              paddingHorizontal: 12,
              paddingVertical: 4,
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Custo unitário
          </Typography>
          <Typography variant="money" color={theme.colors.success}>
            {formatCurrency(packaging.unitCost)}
          </Typography>
        </View>
      </View>

      {/* Excluir (topo) */}
      <Pressable
        onPress={confirmDelete}
        disabled={isDeleting}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 52,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: cardBg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="trash-outline" size={20} color={theme.colors.alert} />
        <Typography variant="bodyBold" color={theme.colors.alert}>
          Excluir embalagem
        </Typography>
      </Pressable>

      {/* Resumo */}
      <View style={{ gap: spacing.md }}>
        <Typography variant="bodyBold" color={theme.colors.text}>
          Resumo
        </Typography>
        <View
          style={{
            flexDirection: "row",
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: cardBg,
            paddingVertical: spacing.lg,
          }}
        >
          <StatCol icon="cube-outline" label="Tipo" value={typeLabel(packaging.type)} />
          <View style={{ width: 1, backgroundColor: border }} />
          <StatCol
            icon="pricetag-outline"
            label="Custo unitário"
            value={formatCurrency(packaging.unitCost)}
          />
          <View style={{ width: 1, backgroundColor: border }} />
          <StatCol
            icon="calendar-outline"
            label="Cadastrado"
            value={formatDate(packaging.createdAt)}
          />
        </View>
      </View>

      {/* Informações adicionais */}
      <View style={{ gap: spacing.sm }}>
        <Typography variant="bodyBold" color={theme.colors.text}>
          Informações adicionais
        </Typography>
        <View
          style={{
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: cardBg,
            paddingHorizontal: spacing.lg,
          }}
        >
          <InfoRow icon="storefront-outline" label="Fornecedor" value={supplierDisplay} />
          <View style={{ height: 1, backgroundColor: border }} />
          <InfoRow
            icon="calendar-outline"
            label="Cadastrado em"
            value={formatDate(packaging.createdAt)}
          />
        </View>
      </View>

      {/* Baixar / Compartilhar */}
      <Pressable
        onPress={share}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 56,
          borderRadius: radii.lg,
          backgroundColor: theme.colors.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="share-outline" size={22} color={theme.colors.textOnPrimary} />
        <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
          Baixar / Compartilhar
        </Typography>
      </Pressable>

      {/* Excluir (rodapé) */}
      <Pressable
        onPress={confirmDelete}
        disabled={isDeleting}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 52,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: border,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Typography variant="bodyBold" color={theme.colors.text}>
          Excluir embalagem
        </Typography>
      </Pressable>
    </ScrollView>
  );
}
