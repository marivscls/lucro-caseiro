import {
  Button,
  Chip,
  EmptyState,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreatePurchaseForm } from "../features/purchases/components/create-purchase-form";
import { PurchaseCard } from "../features/purchases/components/purchase-card";
import { pendingTotal } from "../features/purchases/domain";
import {
  useDeletePurchase,
  usePayPurchase,
  usePurchases,
} from "../features/purchases/hooks";
import { showAlert } from "../shared/components/alert-store";
import { alertError } from "../shared/utils/alerts";
import { formatCurrency } from "../shared/utils/format";

type Filter = "all" | "pending" | "paid";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "A pagar" },
  { value: "paid", label: "Pagas" },
];

export default function PurchasesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, error } = usePurchases(
    filter === "all" ? undefined : { status: filter },
  );
  // "A pagar" total sempre visível, independente do filtro atual.
  const pendingQuery = usePurchases({ status: "pending" });
  const toPay = pendingTotal(pendingQuery.data?.items ?? []);

  const payPurchase = usePayPurchase();
  const deletePurchase = useDeletePurchase();

  function confirmDelete(id: string) {
    showAlert({
      title: "Excluir compra",
      message: "Tem certeza que deseja excluir esta compra?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            deletePurchase
              .mutateAsync(id)
              .catch(() => alertError("Não foi possível excluir a compra."));
          },
        },
      ],
    });
  }

  function pay(id: string) {
    payPurchase
      .mutateAsync(id)
      .catch(() => alertError("Não foi possível marcar a compra como paga."));
  }

  const items = data?.items ?? [];

  function renderList() {
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
          description="Não foi possível carregar suas compras. Tente novamente."
        />
      );
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon={<Ionicons name="cart-outline" size={48} color={theme.colors.primary} />}
          title="Nenhuma compra aqui"
          description="Registre o que você compra dos fornecedores para acompanhar suas contas a pagar e o caixa."
          action={<Button title="Registrar compra" onPress={() => setShowCreate(true)} />}
        />
      );
    }
    return (
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing["3xl"],
          gap: spacing.md,
        }}
      >
        {items.map((p) => (
          <PurchaseCard
            key={p.id}
            purchase={p}
            onPay={() => pay(p.id)}
            onDelete={() => confirmDelete(p.id)}
            isPaying={payPurchase.isPending}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={10}
          style={{ width: 32, height: 40, justifyContent: "center" }}
        >
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </Pressable>
        <Typography
          variant="h1"
          color={theme.colors.text}
          numberOfLines={1}
          style={{ flex: 1, fontSize: 26, fontWeight: "800" }}
        >
          Compras
        </Typography>
        <Pressable
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          accessibilityLabel="Nova compra"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: radii.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="add" size={26} color={theme.colors.textOnPrimary} />
        </Pressable>
      </View>

      {/* Resumo: a pagar */}
      <View
        style={{
          marginHorizontal: spacing.lg,
          marginBottom: spacing.sm,
          padding: spacing.lg,
          borderRadius: radii.xl,
          backgroundColor: theme.colors.yellowBg,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <Ionicons name="time-outline" size={24} color={theme.colors.yellow} />
        <View style={{ flex: 1 }}>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Total a pagar
          </Typography>
          <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 22 }}>
            {formatCurrency(toPay)}
          </Typography>
        </View>
      </View>

      {/* Filtros */}
      <View
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.sm,
        }}
      >
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            selected={filter === f.value}
            onPress={() => setFilter(f.value)}
          />
        ))}
      </View>

      {/* Lista */}
      <View style={{ flex: 1 }}>{renderList()}</View>

      {/* Modal: criar */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              gap: spacing.md,
            }}
          >
            <Pressable
              onPress={() => setShowCreate(false)}
              accessibilityLabel="Fechar"
              hitSlop={10}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </Pressable>
            <Typography
              variant="h1"
              color={theme.colors.text}
              style={{ flex: 1, fontSize: 24, fontWeight: "800" }}
            >
              Nova compra
            </Typography>
          </View>
          <CreatePurchaseForm onSuccess={() => setShowCreate(false)} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
