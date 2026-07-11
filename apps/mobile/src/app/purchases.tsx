import {
  Badge,
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
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import purchasesEmpty from "../assets/purchases-empty.png";
import { CreatePurchaseForm } from "../features/purchases/components/create-purchase-form";
import { PurchaseCard } from "../features/purchases/components/purchase-card";
import { pendingTotal } from "../features/purchases/domain";
import {
  useDeletePurchase,
  usePayPurchase,
  usePurchases,
} from "../features/purchases/hooks";
import { showAlert } from "../shared/components/alert-store";
import { isProfilePremiumActive, useProfile } from "../features/subscription/hooks";
import { usePaywall } from "../shared/hooks/use-paywall";
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
  const { data: profile } = useProfile();
  const isPremium = isProfilePremiumActive(profile);
  const showPaywall = usePaywall((s) => s.show);
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
          icon={
            <Image
              source={purchasesEmpty}
              resizeMode="contain"
              style={{ width: 146, height: 146 }}
            />
          }
          title="Nenhuma compra aqui"
          description="Registre sua primeira compra de fornecedor para acompanhar suas contas a pagar e o caixa."
          action={<Button title="Registrar compra" onPress={openCreate} />}
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

  function openCreate() {
    if (!isPremium) {
      showPaywall("purchases");
      return;
    }
    setShowCreate(true);
  }

  if (!isPremium) {
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
            style={{ flex: 1 }}
          >
            Compras
          </Typography>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <PurchasesPremiumGate onUnlock={() => showPaywall("purchases")} />
        </ScrollView>
      </SafeAreaView>
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
          style={{ flex: 1 }}
        >
          Compras
        </Typography>
        <Pressable
          onPress={openCreate}
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
          <Typography variant="money" color={theme.colors.text}>
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
              style={{ flex: 1, fontSize: 24 }}
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

/**
 * Tela de apresentação pra quem não tem o plano Profissional: explica o que
 * Compras faz + CTA de upgrade, sem exibir o formulário (que não salvaria).
 */
function PurchasesPremiumGate({ onUnlock }: Readonly<{ onUnlock: () => void }>) {
  const { theme } = useTheme();
  const benefits = [
    "Registre tudo que compra dos fornecedores em um só lugar.",
    "Acompanhe as contas a pagar sem esquecer nenhuma data.",
    "Cada compra paga já lança a saída certa no seu caixa.",
  ];

  return (
    <View
      style={{
        backgroundColor: theme.colors.surfaceElevated,
        borderColor: theme.colors.primary,
        borderWidth: 1,
        borderRadius: radii.xl,
        gap: spacing.md,
        padding: spacing.xl,
      }}
    >
      <Badge label="Recurso Profissional" variant="premium" />
      <Typography variant="h2" color={theme.colors.text}>
        Compras de fornecedor organizadas
      </Typography>
      <Typography variant="body" color={theme.colors.textSecondary}>
        Registre o que você compra dos fornecedores e acompanhe contas a pagar e caixa
        automaticamente.
      </Typography>
      {benefits.map((benefit) => (
        <View
          key={benefit}
          style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}
        >
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.premium} />
          <Typography
            variant="body"
            color={theme.colors.text}
            style={{ flex: 1, lineHeight: 20 }}
          >
            {benefit}
          </Typography>
        </View>
      ))}
      <Button
        title="Desbloquear no Profissional"
        icon={<Ionicons name="lock-open-outline" size={20} color="#FFFFFF" />}
        onPress={onUnlock}
      />
    </View>
  );
}
