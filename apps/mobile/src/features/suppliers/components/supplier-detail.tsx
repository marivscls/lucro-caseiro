import { Button, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React from "react";
import { View } from "react-native";

import { SkeletonCard } from "../../../shared/components/skeleton";
import { openWhatsApp } from "../../../shared/utils/whatsapp";
import { maskPhoneBR } from "../../../shared/utils/phone";
import { useSupplier } from "../hooks";
import { SUPPLIER_CATEGORY_LABELS } from "../domain";
import { SupplierAvatar } from "./supplier-avatar";

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
  icon: AppIconName;
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
        paddingVertical: spacing.md,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: radii.md,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={16} color={theme.colors.textSecondary} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="body" color={theme.colors.text} selectable>
          {value}
        </Typography>
      </View>
    </View>
  );
}

export function SupplierDetail({
  supplierId,
  onEditPress,
}: Readonly<SupplierDetailProps>) {
  const { theme } = useTheme();
  const { data: supplier, isLoading, error } = useSupplier(supplierId);

  if (isLoading) {
    return (
      <View style={{ flexShrink: 1, padding: spacing.xl, gap: spacing.lg }}>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </View>
    );
  }

  if (error || !supplier) {
    return (
      <View style={{ flexShrink: 1, padding: spacing.xl, justifyContent: "center" }}>
        <Typography variant="body">
          Não foi possível carregar os dados do fornecedor.
        </Typography>
      </View>
    );
  }

  const contacts = [
    {
      icon: "call-outline" as const,
      label: "Telefone",
      value:
        supplier.phone &&
        (/^\d{10,11}$/.test(supplier.phone)
          ? maskPhoneBR(supplier.phone)
          : supplier.phone),
    },
    { icon: "mail-outline" as const, label: "Email", value: supplier.email },
    { icon: "location-outline" as const, label: "Endereço", value: supplier.address },
  ].filter((contact) => !!contact.value);

  return (
    <View style={{ flexShrink: 1, gap: spacing.xl }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.lg,
          padding: spacing.lg,
          borderRadius: radii.xl,
          backgroundColor: theme.colors.primaryBg,
        }}
      >
        <SupplierAvatar supplier={supplier} size={64} />
        <View style={{ flex: 1, minWidth: 0, gap: spacing.sm }}>
          <Typography variant="h3" color={theme.colors.text}>
            {supplier.name}
          </Typography>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <Typography variant="caption" color={theme.colors.primaryStrong}>
              {SUPPLIER_CATEGORY_LABELS[supplier.category]}
            </Typography>
            {supplier.isPreferred ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <AppIcon name="star" size={12} color={theme.colors.primaryStrong} />
                <Typography variant="caption" color={theme.colors.primaryStrong}>
                  Preferido
                </Typography>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        {onEditPress ? (
          <View style={{ flex: 1 }}>
            <Button
              title="Editar dados"
              variant="outline"
              size="md"
              icon={
                <AppIcon
                  name="create-outline"
                  size={16}
                  color={theme.colors.primaryStrong}
                />
              }
              onPress={onEditPress}
              style={{ borderRadius: radii.md }}
            />
          </View>
        ) : null}
        {supplier.phone && supplier.hasWhatsApp && (
          <View style={{ flex: 1 }}>
            <Button
              title="WhatsApp"
              variant="success"
              size="md"
              onPress={() => {
                void openWhatsApp(supplier.phone!);
              }}
              style={{ borderRadius: radii.md }}
            />
          </View>
        )}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Typography variant="bodyBold" color={theme.colors.text}>
          Contato
        </Typography>
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: radii.lg,
            paddingHorizontal: spacing.lg,
          }}
        >
          {contacts.map((contact, index) => (
            <View
              key={contact.label}
              style={{
                borderTopWidth: index ? 1 : 0,
                borderTopColor: theme.colors.border,
              }}
            >
              <InfoRow
                icon={contact.icon}
                label={contact.label}
                value={contact.value!}
                theme={theme}
              />
            </View>
          ))}
          {!contacts.length ? (
            <Typography variant="caption" style={{ paddingVertical: spacing.lg }}>
              Adicione telefone, email ou endereço em Editar dados.
            </Typography>
          ) : null}
        </View>
      </View>
      {supplier.purchaseDescription ? (
        <View style={{ gap: spacing.sm }}>
          <Typography variant="bodyBold" color={theme.colors.text}>
            O que você compra aqui
          </Typography>
          <Typography variant="body" color={theme.colors.text} selectable>
            {supplier.purchaseDescription}
          </Typography>
        </View>
      ) : null}
      {supplier.notes ? (
        <View
          style={{
            gap: spacing.sm,
            padding: spacing.lg,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.surface,
          }}
        >
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
            <AppIcon
              name="document-text-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Typography variant="bodyBold" color={theme.colors.text}>
              Observações
            </Typography>
          </View>
          <Typography variant="body" color={theme.colors.text} selectable>
            {supplier.notes}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}
