import {
  Badge,
  Button,
  Card,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import React from "react";
import { ActivityIndicator, Linking, ScrollView, View } from "react-native";

import { useSales } from "../../sales/hooks";
import { useClient } from "../hooks";

interface ClientDetailProps {
  clientId: string;
  onEditPress?: () => void;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function openWhatsApp(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  void Linking.openURL(`https://wa.me/${number}`);
}

function InfoRow({
  label,
  value,
  theme,
}: Readonly<{
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
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {({ Telefone: "T", Endereco: "E", Aniversario: "A" } as Record<string, string>)[
            label
          ] ?? "N"}
        </Typography>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="bodyBold">{value}</Typography>
      </View>
    </View>
  );
}

export function ClientDetail({ clientId, onEditPress }: Readonly<ClientDetailProps>) {
  const { theme } = useTheme();
  const { data: client, isLoading, error } = useClient(clientId);
  const { data: salesData } = useSales({ clientId });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !client) {
    return (
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}>
        <Typography variant="body">
          Nao foi possivel carregar os dados do cliente.
        </Typography>
      </View>
    );
  }

  const initial = client.name.charAt(0).toUpperCase();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing["3xl"],
        gap: spacing.xl,
      }}
    >
      {/* Avatar and name header */}
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
          <Typography variant="display" color={theme.colors.textOnPrimary}>
            {initial}
          </Typography>
        </View>
        <View style={{ alignItems: "center", gap: spacing.xs }}>
          <Typography variant="h1">{client.name}</Typography>
          <Typography variant="caption">
            cliente desde{" "}
            {client.createdAt ? new Date(client.createdAt).getFullYear() : "hoje"}
          </Typography>
        </View>

        {client.tags.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {client.tags.map((tag) => (
              <Badge key={tag} label={tag} variant="lavender" />
            ))}
          </View>
        )}
      </View>

      {/* Contact actions */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        {client.phone && (
          <View style={{ flex: 1 }}>
            <Button
              title="Editar cliente"
              variant="secondary"
              size="sm"
              onPress={onEditPress ?? (() => {})}
              style={{ borderRadius: radii.lg }}
            />
          </View>
        )}
        {client.phone && (
          <View style={{ flex: 1 }}>
            <Button
              title="WhatsApp"
              variant="success"
              size="sm"
              onPress={() => openWhatsApp(client.phone!)}
              style={{ borderRadius: radii.lg }}
            />
          </View>
        )}
      </View>

      {/* Phone display */}
      {client.phone && (
        <Card>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body">{client.phone}</Typography>
            <Typography variant="caption" color={theme.colors.primary}>
              WhatsApp
            </Typography>
          </View>
        </Card>
      )}

      {/* Total spent */}
      <Card variant="elevated">
        <View
          style={{ alignItems: "center", paddingVertical: spacing.md, gap: spacing.xs }}
        >
          <Typography variant="label">TOTAL GASTO</Typography>
          <Typography variant="moneyLg">{formatCurrency(client.totalSpent)}</Typography>
        </View>
      </Card>

      {/* Info card */}
      <Card>
        <View style={{ gap: spacing.sm }}>
          {client.phone && (
            <InfoRow label="Telefone" value={client.phone} theme={theme} />
          )}
          {client.address && (
            <InfoRow label="Endereco" value={client.address} theme={theme} />
          )}
          {client.birthday && (
            <InfoRow
              label="Aniversario"
              value={formatDate(client.birthday)}
              theme={theme}
            />
          )}
          {client.notes && (
            <InfoRow label="Observacoes" value={client.notes} theme={theme} />
          )}
          {!client.phone && !client.address && !client.birthday && !client.notes && (
            <Typography variant="caption">
              Nenhuma informacao adicional cadastrada.
            </Typography>
          )}
        </View>
      </Card>

      {/* Purchase history */}
      <Card>
        <View style={{ gap: spacing.md }}>
          <Typography variant="h3">Historico de compras</Typography>
          {!salesData?.items.length ? (
            <Typography variant="caption">
              Este cliente ainda nao fez nenhuma compra.
            </Typography>
          ) : (
            salesData.items.slice(0, 10).map((sale) => (
              <View
                key={sale.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.surface,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Typography variant="bodyBold">
                    {sale.items?.[0]?.productName ?? "Venda"}
                    {(sale.items?.length ?? 0) > 1
                      ? ` +${(sale.items?.length ?? 1) - 1}`
                      : ""}
                  </Typography>
                  <Typography variant="caption">
                    {new Date(sale.soldAt).toLocaleDateString("pt-BR")}
                  </Typography>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Typography variant="bodyBold" color={theme.colors.success}>
                    {formatCurrency(sale.total)}
                  </Typography>
                  <Badge
                    label={
                      (
                        {
                          paid: "Pago",
                          pending: "Pendente",
                          cancelled: "Cancelado",
                        } as Record<string, string>
                      )[sale.status] ?? sale.status
                    }
                    variant={
                      (
                        {
                          paid: "success",
                          pending: "warning",
                          cancelled: "danger",
                        } as Record<string, "success" | "warning" | "danger">
                      )[sale.status] ?? "danger"
                    }
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </Card>
    </ScrollView>
  );
}
