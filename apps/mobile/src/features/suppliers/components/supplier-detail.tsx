import { Button, Card, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { openWhatsApp } from "../../../shared/utils/whatsapp";
import { useSupplier } from "../hooks";
import { desktopContained } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";

interface SupplierDetailProps {
  supplierId: string;
  onEditPress?: () => void;
}

function InfoRow({
  icon,
  label,
  value,
  theme,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: { colors: Record<string, string> };
}>) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radii.full,
          backgroundColor: theme.colors.surfaceElevated,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={16} color={theme.colors.textSecondary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="bodyBold">{value}</Typography>
      </View>
    </View>
  );
}

export function SupplierDetail({
  supplierId,
  onEditPress,
}: Readonly<SupplierDetailProps>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const { data: supplier, isLoading, error } = useSupplier(supplierId);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !supplier) {
    return (
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}>
        <Typography variant="body">
          Não foi possível carregar os dados do fornecedor.
        </Typography>
      </View>
    );
  }

  const hasInfo = supplier.phone || supplier.email || supplier.address || supplier.notes;

  return (
    <ScrollView
      contentContainerStyle={[
        {
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing["3xl"],
          gap: spacing.xl,
        },
        desktopContained(isDesktop, 960),
      ]}
    >
      {/* Header */}
      <View style={{ alignItems: "center", gap: spacing.md, paddingTop: spacing.lg }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: radii.full,
            backgroundColor: theme.colors.primaryLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="business" size={36} color={theme.colors.textOnPrimary} />
        </View>
        <Typography variant="h1" style={{ textAlign: "center" }}>
          {supplier.name}
        </Typography>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Editar"
            variant="secondary"
            size="sm"
            onPress={onEditPress ?? (() => {})}
            style={{ borderRadius: radii.lg }}
          />
        </View>
        {supplier.phone && (
          <View style={{ flex: 1 }}>
            <Button
              title="WhatsApp"
              variant="success"
              size="sm"
              onPress={() => {
                void openWhatsApp(supplier.phone!);
              }}
              style={{ borderRadius: radii.lg }}
            />
          </View>
        )}
      </View>

      {/* Info */}
      <Card>
        <View style={{ gap: spacing.sm }}>
          {supplier.phone && (
            <InfoRow
              icon="call-outline"
              label="Telefone"
              value={supplier.phone}
              theme={theme}
            />
          )}
          {supplier.email && (
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={supplier.email}
              theme={theme}
            />
          )}
          {supplier.address && (
            <InfoRow
              icon="location-outline"
              label="Endereço"
              value={supplier.address}
              theme={theme}
            />
          )}
          {supplier.notes && (
            <InfoRow
              icon="document-text-outline"
              label="Observações"
              value={supplier.notes}
              theme={theme}
            />
          )}
          {!hasInfo && (
            <Typography variant="caption">
              Nenhuma informação adicional cadastrada.
            </Typography>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}
