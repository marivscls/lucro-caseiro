import { formatCurrency } from "../shared/utils/format";
import type { Pricing } from "@lucro-caseiro/contracts";
import {
  Card,
  EmptyState,
  Typography,
  spacing,
  radii,
  useTheme,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PricingCalculator } from "../features/pricing/components/pricing-calculator";
import { usePricingList } from "../features/pricing/hooks";
import { showAlert } from "../shared/components/alert-store";
import { useProducts } from "../features/products/hooks";

function PricingHistoryCard({
  item,
  productLabel,
}: Readonly<{ item: Pricing; productLabel: string }>) {
  const { theme } = useTheme();
  const price = item.finalPrice || item.suggestedPrice;
  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold" color={theme.colors.text} numberOfLines={1}>
              {productLabel}
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {new Date(item.createdAt).toLocaleDateString("pt-BR")}
            </Typography>
          </View>
          <Typography variant="h3" color={theme.colors.success}>
            {formatCurrency(price)}
          </Typography>
        </View>
        <View style={{ flexDirection: "row", gap: spacing.xl }}>
          <View>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Custo total
            </Typography>
            <Typography variant="body" color={theme.colors.text}>
              {formatCurrency(item.totalCost)}
            </Typography>
          </View>
          <View>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Margem
            </Typography>
            <Typography variant="body" color={theme.colors.text}>
              {item.marginPercent}%
            </Typography>
          </View>
        </View>
      </View>
    </Card>
  );
}

function PricingHistoryModal({
  visible,
  onClose,
}: Readonly<{ visible: boolean; onClose: () => void }>) {
  const { theme } = useTheme();
  const { data: productsData } = useProducts();
  const { data, isLoading, error } = usePricingList();
  // "all" | "none" (cálculo avulso) | <productId>
  const [filter, setFilter] = useState<string>("all");

  const products = productsData?.items ?? [];
  const productName = (id: string | null) =>
    (id && products.find((p) => p.id === id)?.name) || "Cálculo avulso";

  const all = data?.items ?? [];

  const productIds = [
    ...new Set(all.map((c) => c.productId).filter(Boolean)),
  ] as string[];
  const chips: { key: string; label: string }[] = [{ key: "all", label: "Todos" }];
  for (const id of productIds) chips.push({ key: id, label: productName(id) });
  if (all.some((c) => !c.productId)) {
    chips.push({ key: "none", label: "Cálculo avulso" });
  }

  let visible2 = all;
  if (filter === "none") visible2 = all.filter((c) => !c.productId);
  else if (filter !== "all") visible2 = all.filter((c) => c.productId === filter);

  function renderBody() {
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
          description="Não foi possível carregar o histórico. Tente novamente."
        />
      );
    }
    if (all.length === 0) {
      return (
        <EmptyState
          title="Nenhum cálculo ainda"
          description="Faça uma precificação e toque em 'Salvar cálculo' para ver o histórico aqui."
        />
      );
    }
    return (
      <FlatList
        data={visible2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
        renderItem={({ item }) => (
          <PricingHistoryCard item={item} productLabel={productName(item.productId)} />
        )}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: spacing.lg,
          }}
        >
          <Typography variant="h2">Histórico</Typography>
          <Pressable onPress={onClose} hitSlop={10}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Fechar
            </Typography>
          </Pressable>
        </View>

        {/* Filtro por produto (aparece só quando há mais de uma opção) */}
        {chips.length > 1 && (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {chips.map((c) => {
                const active = filter === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setFilter(c.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.full,
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.colors.surface,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color={
                        active ? theme.colors.textOnPrimary : theme.colors.textSecondary
                      }
                      style={{ fontWeight: "700" }}
                    >
                      {c.label}
                    </Typography>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {renderBody()}
      </SafeAreaView>
    </Modal>
  );
}

export default function PricingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
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
          variant="h2"
          color={theme.colors.text}
          style={{ flex: 1, fontSize: 22, fontWeight: "800" }}
        >
          Precificação
        </Typography>
        <Pressable
          onPress={() => setShowHistory(true)}
          accessibilityRole="button"
          accessibilityLabel="Histórico"
          hitSlop={10}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
          <Typography
            variant="bodyBold"
            color={theme.colors.primary}
            style={{ fontSize: 16 }}
          >
            Histórico
          </Typography>
        </Pressable>
      </View>

      <PricingCalculator
        onSave={() => {
          showAlert({
            title: "Cálculo salvo!",
            message: "Sua precificação foi salva com sucesso.",
            buttons: [{ text: "OK", onPress: () => router.back() }],
          });
        }}
      />

      <PricingHistoryModal visible={showHistory} onClose={() => setShowHistory(false)} />
    </SafeAreaView>
  );
}
