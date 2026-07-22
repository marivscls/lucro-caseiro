import type { Pricing } from "@lucro-caseiro/contracts";
import {
  Card,
  EmptyState,
  Typography,
  fontSizes,
  iconSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { FlatList, Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import pricingEmpty from "../../../assets/pricing-empty.png";
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
          <View style={{ flex: 1, minWidth: 0 }}>
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
              Acréscimo sobre o custo
            </Typography>
            <Typography variant="body" color={theme.colors.text}>
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
        <SkeletonList rows={6} />
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
        icon={
          <Image
            source={pricingEmpty}
            resizeMode="contain"
            style={{ width: 146, height: 146 }}
          />
        }
        title="Nenhum cálculo ainda"
        description="Faça uma precificação e toque em 'Salvar cálculo' para ver o histórico aqui."
      />
    );
  } else {
    content = (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
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
            padding: spacing.lg,
          }}
        >
          <Typography variant="h2">Histórico</Typography>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar histórico"
            hitSlop={10}
          >
            <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
              Fechar
            </Typography>
          </Pressable>
        </View>

        {chips.length > 1 ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {chips.map((chip) => {
                const active = filter === chip.key;
                return (
                  <Pressable
                    key={chip.key}
                    onPress={() => setFilter(chip.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      minHeight: 44,
                      justifyContent: "center",
                      paddingHorizontal: spacing.lg,
                      borderRadius: radii.full,
                      backgroundColor: active
                        ? theme.colors.primaryBg
                        : theme.colors.surface,
                    }}
                  >
                    <Typography
                      variant="captionBold"
                      color={
                        active ? theme.colors.primaryStrong : theme.colors.textSecondary
                      }
                    >
                      {chip.label}
                    </Typography>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {content}
      </SafeAreaView>
    </ResponsiveModal>
  );
}
