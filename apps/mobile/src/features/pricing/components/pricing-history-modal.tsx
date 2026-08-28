import type { Pricing } from "@lucro-caseiro/contracts";
import {
  Card,
  Chip,
  EmptyState,
  Typography,
  fontSizes,
  iconSizes,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../../../shared/components/app-icon";
import { ResponsiveModal } from "../../../shared/components/responsive-modal-surface";
import { SkeletonList } from "../../../shared/components/skeleton";
import { formatCurrency } from "../../../shared/utils/format";
import { useAllProducts } from "../../products/hooks";
import { usePricingList } from "../hooks";

export function PricingHistoryButton({ onPress }: Readonly<{ onPress: () => void }>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Histórico"
      hitSlop={10}
      style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 }}
    >
      <AppIcon
        name="time-outline"
        size={iconSizes.sm}
        color={theme.colors.primaryStrong}
      />
      <Typography
        variant="bodyBold"
        color={theme.colors.primaryStrong}
        style={{ fontSize: fontSizes.md }}
      >
        Histórico
      </Typography>
    </Pressable>
  );
}

function PricingHistoryCard({
  item,
  productLabel,
}: Readonly<{ item: Pricing; productLabel: string }>) {
  const { theme } = useTheme();
  const price = item.finalPrice || item.suggestedPrice;
  const markup = item.marginPercent.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  });

  const extra = [
    item.allocationMode === "revenue" ? "Custeio por faturamento" : null,
    item.channelName ? `Canal: ${item.channelName}` : null,
  ].filter(Boolean);

  return (
    <Card variant="elevated" padding="xl">
      <View style={{ gap: spacing.lg }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: spacing.lg,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
            <Typography variant="bodyBold" color={theme.colors.text} numberOfLines={2}>
              {productLabel}
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {new Date(item.createdAt).toLocaleDateString("pt-BR")}
            </Typography>
            {extra.length > 0 ? (
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {extra.join(" · ")}
              </Typography>
            ) : null}
          </View>
          <Typography
            variant="h3"
            color={theme.colors.success}
            style={{ flexShrink: 0, paddingTop: 2 }}
          >
            {formatCurrency(price)}
          </Typography>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: spacing.lg,
            paddingTop: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Custo total
            </Typography>
            <Typography variant="bodyBold" color={theme.colors.text}>
              {formatCurrency(item.totalCost)}
            </Typography>
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Acréscimo
            </Typography>
            <Typography variant="bodyBold" color={theme.colors.text}>
              {markup}%
            </Typography>
          </View>
        </View>
      </View>
    </Card>
  );
}

export function PricingHistoryModal({
  visible,
  onClose,
}: Readonly<{ visible: boolean; onClose: () => void }>) {
  const { theme } = useTheme();
  const { data: products = [] } = useAllProducts();
  const { data, isLoading, error } = usePricingList();
  const [filter, setFilter] = useState<string>("all");

  const productName = (id: string | null) =>
    (id && products.find((product) => product.id === id)?.name) || "Cálculo avulso";
  const all = data?.items ?? [];
  const productIds = [
    ...new Set(all.map((item) => item.productId).filter(Boolean)),
  ] as string[];
  const chips: { key: string; label: string }[] = [{ key: "all", label: "Todos" }];

  for (const id of productIds) chips.push({ key: id, label: productName(id) });
  if (all.some((item) => !item.productId)) {
    chips.push({ key: "none", label: "Cálculo avulso" });
  }

  let filtered = all;
  if (filter === "none") filtered = all.filter((item) => !item.productId);
  else if (filter !== "all") filtered = all.filter((item) => item.productId === filter);

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <View style={{ flex: 1, padding: spacing.xl }}>
        <SkeletonList rows={6} variant="amount" />
      </View>
    );
  } else if (error) {
    content = (
      <EmptyState
        title="Algo deu errado"
        description="Não foi possível carregar o histórico. Tente novamente."
      />
    );
  } else if (all.length === 0) {
    content = (
      <EmptyState
        title="Nenhum cálculo ainda"
        description="Faça uma precificação e toque em 'Salvar cálculo' para ver o histórico aqui."
      />
    );
  } else {
    content = (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing["4xl"],
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        renderItem={({ item }) => (
          <PricingHistoryCard item={item} productLabel={productName(item.productId)} />
        )}
      />
    );
  }

  return (
    <ResponsiveModal
      desktopMaxWidth={1120}
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
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xl,
            gap: spacing.md,
          }}
        >
          <Typography variant="h3" style={{ flex: 1 }} numberOfLines={1}>
            Histórico
          </Typography>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar histórico"
            hitSlop={12}
            style={{ minHeight: 48, justifyContent: "center" }}
          >
            <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
              Fechar
            </Typography>
          </Pressable>
        </View>

        {chips.length > 1 ? (
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.sm,
              paddingBottom: spacing.lg,
              gap: spacing.sm,
              alignItems: "center",
            }}
          >
            {chips.map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                selected={filter === chip.key}
                onPress={() => setFilter(chip.key)}
              />
            ))}
          </ScrollView>
        ) : null}

        {content}
      </SafeAreaView>
    </ResponsiveModal>
  );
}
