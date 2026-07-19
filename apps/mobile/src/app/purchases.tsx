import {
  Badge,
  Button,
  EmptyState,
  iconSizes,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import type { Purchase } from "@lucro-caseiro/contracts";
import { AppIcon } from "../shared/components/app-icon";
import { Stack } from "expo-router";
import React, { useRef, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import purchasesEmpty from "../assets/purchases-empty.png";
import { CreatePurchaseForm } from "../features/purchases/components/create-purchase-form";
import { PurchaseCard } from "../features/purchases/components/purchase-card";
import { pendingTotal, sortPurchasesPendingFirst } from "../features/purchases/domain";
import {
  useDeletePurchase,
  usePayPurchase,
  usePurchases,
} from "../features/purchases/hooks";
import { showAlert } from "../shared/components/alert-store";
import { useProfile } from "../features/subscription/hooks";
import { usePaywall } from "../shared/hooks/use-paywall";
import { alertError } from "../shared/utils/alerts";
import { formatCurrency } from "../shared/utils/format";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { ScreenHeader } from "../shared/components/screen-header";
import { SkeletonList } from "../shared/components/skeleton";

type Filter = "all" | "pending" | "paid";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "A pagar" },
  { value: "paid", label: "Pagas" },
];

export default function PurchasesScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const { data: profile } = useProfile();
  const isPremium =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "purchases");
  const showPaywall = usePaywall((s) => s.show);
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const payingIdRef = useRef<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingIdRef = useRef<string | null>(null);

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
            if (deletingIdRef.current) return;
            deletingIdRef.current = id;
            setDeletingId(id);
            deletePurchase
              .mutateAsync(id)
              .catch(() => alertError("Não foi possível excluir a compra."))
              .finally(() => {
                deletingIdRef.current = null;
                setDeletingId(null);
              });
          },
        },
      ],
    });
  }

  function pay(id: string) {
    // A ref trava de forma sincrona, antes de o React renderizar o estado novo.
    // Assim, um toque nunca dispara pagamentos de dois cards em sequencia.
    if (payingIdRef.current) return;
    payingIdRef.current = id;
    setPayingId(id);
    payPurchase
      .mutateAsync(id)
      .then((paid) => {
        if (paid.id !== id || paid.paymentStatus !== "paid") {
          throw new Error("A API não confirmou a compra selecionada.");
        }
      })
      .catch(() => alertError("Não foi possível marcar a compra como paga."))
      .finally(() => {
        payingIdRef.current = null;
        setPayingId(null);
      });
  }

  const items = sortPurchasesPendingFirst(data?.items ?? []);

  function renderList() {
    if (isLoading) {
      return (
        <View style={{ flex: 1, padding: spacing.xl }}>
          <SkeletonList rows={6} />
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
          action={
            <Button title="Registrar compra" variant="outline" onPress={openCreate} />
          }
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
            onEdit={() => setEditingPurchase(p)}
            onDelete={() => confirmDelete(p.id)}
            isPaying={payingId === p.id}
            payDisabled={payingId !== null}
            isDeleting={deletingId === p.id}
            deleteDisabled={deletingId !== null}
            editDisabled={payingId !== null || deletingId !== null}
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
        {!isDesktop && <ScreenHeader title="Compras" style={{ gap: spacing.sm }} />}

        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xl }}
        >
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
      <ScreenHeader
        title="Compras"
        hideBack={isDesktop}
        style={{ gap: spacing.sm }}
        right={
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
              backgroundColor: theme.colors.primaryInteractive,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <AppIcon name="add" size={iconSizes.md} color={theme.colors.textOnPrimary} />
          </Pressable>
        }
      />

      {/* Resumo: a pagar */}
      <View
        style={{
          marginHorizontal: spacing.lg,
          marginTop: spacing.xl,
          marginBottom: spacing.sm,
          padding: spacing.lg,
          borderRadius: radii.xl,
          backgroundColor: theme.colors.yellowBg,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <AppIcon name="time-outline" size={24} color={theme.colors.yellow} />
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
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                minHeight: 44,
                paddingHorizontal: spacing.lg,
                borderRadius: radii.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? theme.colors.primaryBg : theme.colors.surface,
              }}
            >
              <Typography
                variant="bodyBold"
                color={active ? theme.colors.primaryStrong : theme.colors.textSecondary}
              >
                {f.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      {/* Lista */}
      <View style={{ flex: 1 }}>{renderList()}</View>

      {/* Modal: criar */}
      {showCreate ? (
        <CreatePurchaseForm
          visible
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      ) : null}
      {editingPurchase ? (
        <CreatePurchaseForm
          visible
          purchase={editingPurchase}
          onClose={() => setEditingPurchase(null)}
          onSuccess={() => setEditingPurchase(null)}
        />
      ) : null}
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
        borderColor: theme.colors.premium,
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
          <AppIcon name="checkmark-circle" size={20} color={theme.colors.premium} />
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
        variant="premium"
        icon={
          <AppIcon
            name="lock-open-outline"
            size={20}
            color={theme.colors.textOnPrimary}
          />
        }
        onPress={onUnlock}
      />
    </View>
  );
}
