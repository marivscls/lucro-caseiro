import {
  Badge,
  Button,
  Card,
  EmptyState,
  Typography,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useClients } from "../features/clients/hooks";
import { useSales, useUpdateSaleStatus } from "../features/sales/hooks";
import { buildChargeMessage, groupFiados, totalOwed } from "../features/sales/fiado";
import type { FiadoGroup } from "../features/sales/fiado";
import { formatCurrency } from "../shared/utils/format";
import { isValidBrazilPhone } from "../shared/utils/phone";
import { openWhatsApp, openWhatsAppShare } from "../shared/utils/whatsapp";

function dateBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function FiadoGroupCard({
  group,
  onCharge,
  onMarkPaid,
}: Readonly<{
  group: FiadoGroup;
  onCharge: (group: FiadoGroup) => void;
  onMarkPaid: (saleId: string) => void;
}>) {
  const { theme } = useTheme();
  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h3" style={{ flex: 1 }}>
            {group.clientName}
          </Typography>
          <Badge label={formatCurrency(group.total)} variant="warning" />
        </View>

        {group.sales.map((sale) => (
          <View
            key={sale.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 2,
            }}
          >
            <Typography variant="body" color={theme.colors.textSecondary}>
              {dateBR(sale.soldAt)} · {formatCurrency(sale.total)}
            </Typography>
            <Pressable
              onPress={() => onMarkPaid(sale.id)}
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={theme.colors.success}
              />
              <Typography variant="caption" color={theme.colors.success}>
                Recebi
              </Typography>
            </Pressable>
          </View>
        ))}

        <Button
          title="Cobrar no WhatsApp"
          variant="success"
          icon={<Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />}
          onPress={() => onCharge(group)}
        />
      </View>
    </Card>
  );
}

export default function FiadoScreen() {
  const { theme } = useTheme();
  const { data, isLoading, error, refetch } = useSales({ status: "pending" });
  const { data: clientsData } = useClients();
  const updateStatus = useUpdateSaleStatus();

  const sales = data?.items ?? [];
  const groups = groupFiados(sales);
  const grandTotal = totalOwed(sales.filter((s) => s.status === "pending"));

  const phoneById = new Map<string, string>();
  for (const c of clientsData?.items ?? []) {
    if (c.phone) phoneById.set(c.id, c.phone);
  }

  function handleCharge(group: FiadoGroup) {
    const message = buildChargeMessage(group);
    const phone = group.clientId ? phoneById.get(group.clientId) : undefined;
    if (phone && isValidBrazilPhone(phone)) void openWhatsApp(phone, message);
    else void openWhatsAppShare(message);
  }

  function handleMarkPaid(saleId: string) {
    Alert.alert("Recebido?", "Marcar esta venda como paga?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sim, recebi",
        onPress: () => {
          void (async () => {
            try {
              await updateStatus.mutateAsync({ id: saleId, status: "paid" });
              void refetch();
            } catch {
              Alert.alert("Erro", "Não foi possível atualizar. Tente novamente.");
            }
          })();
        },
      },
    ]);
  }

  function renderContent() {
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <EmptyState
          title="Algo deu errado"
          description="Não foi possível carregar os fiados. Tente novamente."
        />
      );
    }
    if (groups.length === 0) {
      return (
        <EmptyState
          title="Ninguém te deve 🎉"
          description="Vendas no fiado em aberto aparecem aqui para você cobrar."
        />
      );
    }
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <Card style={{ backgroundColor: theme.colors.surfaceElevated }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h3">Total a receber</Typography>
            <Typography variant="h2" color={theme.colors.primary}>
              {formatCurrency(grandTotal)}
            </Typography>
          </View>
        </Card>

        {groups.map((group) => (
          <FiadoGroupCard
            key={group.clientId ?? "avulso"}
            group={group}
            onCharge={handleCharge}
            onMarkPaid={handleMarkPaid}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["bottom"]}
    >
      {renderContent()}
    </SafeAreaView>
  );
}
