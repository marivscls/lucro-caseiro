import type { Pricing } from "@lucro-caseiro/contracts";
import { Card, EmptyState, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PricingCalculator } from "../features/pricing/components/pricing-calculator";
import { usePricingHistory } from "../features/pricing/hooks";
import { useProducts } from "../features/products/hooks";

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function PricingHistoryModal({
  visible,
  onClose,
}: Readonly<{ visible: boolean; onClose: () => void }>) {
  const { theme } = useTheme();
  const { data: productsData } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { data: history, isLoading } = usePricingHistory(selectedProductId ?? "");

  const products = productsData?.items ?? [];

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
          <Typography variant="h2">Historico</Typography>
          <Pressable onPress={onClose}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Fechar
            </Typography>
          </Pressable>
        </View>

        {/* Product selector */}
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
          <Typography variant="caption" style={{ marginBottom: spacing.sm }}>
            Selecione um produto
          </Typography>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={products}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: spacing.sm }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedProductId(item.id)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: 20,
                  backgroundColor:
                    selectedProductId === item.id
                      ? theme.colors.primary
                      : theme.colors.surface,
                }}
              >
                <Typography
                  variant="caption"
                  color={
                    selectedProductId === item.id
                      ? theme.colors.textOnPrimary
                      : theme.colors.textSecondary
                  }
                >
                  {item.name}
                </Typography>
              </Pressable>
            )}
          />
        </View>

        {/* History list */}
        {!selectedProductId && (
          <EmptyState
            title="Selecione um produto"
            description="Escolha um produto acima para ver o historico de precificacao"
          />
        )}

        {selectedProductId && isLoading && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {selectedProductId && !isLoading && (!history || history.length === 0) && (
          <EmptyState
            title="Nenhum calculo encontrado"
            description="Nenhuma precificacao registrada para este produto"
          />
        )}

        {selectedProductId && !isLoading && history && history.length > 0 && (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
            renderItem={({ item }: { item: Pricing }) => (
              <Card>
                <View style={{ gap: spacing.sm }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="caption">
                      {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                    </Typography>
                    <Typography variant="h3" color={theme.colors.success}>
                      {formatCurrency(item.suggestedPrice)}
                    </Typography>
                  </View>
                  <View style={{ flexDirection: "row", gap: spacing.lg }}>
                    <View>
                      <Typography variant="caption">Custo total</Typography>
                      <Typography variant="body">
                        {formatCurrency(item.totalCost)}
                      </Typography>
                    </View>
                    <View>
                      <Typography variant="caption">Margem</Typography>
                      <Typography variant="body">{item.marginPercent}%</Typography>
                    </View>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function PricingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
        }}
      >
        <Pressable
          onPress={() => setShowHistory(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            padding: spacing.sm,
          }}
        >
          <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
          <Typography variant="caption" color={theme.colors.primary}>
            Historico
          </Typography>
        </Pressable>
      </View>

      <PricingCalculator
        onSave={() => {
          Alert.alert("Calculo salvo!", "Sua precificacao foi salva com sucesso.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        }}
      />

      <PricingHistoryModal visible={showHistory} onClose={() => setShowHistory(false)} />
    </SafeAreaView>
  );
}
