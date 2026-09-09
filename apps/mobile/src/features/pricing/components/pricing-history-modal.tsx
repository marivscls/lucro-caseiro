import type { Pricing } from "@lucro-caseiro/contracts";
import {
  Card,
  Button,
  EmptyState,
  Typography,
  fontSizes,
  iconSizes,
  spacing,
  radii,
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
import { displayProductName } from "../../products/display";
import { useBrandScreenPalette } from "../../../shared/brand-palette";

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
        color={theme.colors.textSecondary}
      />
      <Typography
        variant="bodyBold"
        color={theme.colors.text}
        style={{ fontSize: fontSizes.sm }}
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
  const palette = useBrandScreenPalette();
  const price = item.finalPrice || item.suggestedPrice;
  const markup = item.marginPercent.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  });

  const extra = [
    item.allocationMode === "revenue" ? "Custeio por faturamento" : null,
    item.channelName ? `Canal: ${item.channelName}` : null,
  ].filter(Boolean);

  return (
    <Card
      padding="md"
      style={{
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
      }}
    >
      <View style={{ gap: spacing.md }}>
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
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            alignItems: "center",
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Preço sugerido
            </Typography>
            <Typography
              variant="moneyLg"
              color={palette.wine}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {formatCurrency(price)}
            </Typography>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Custo total: {formatCurrency(item.totalCost)}
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Acréscimo: {markup}%
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
  const palette = useBrandScreenPalette();
  const { data: products = [] } = useAllProducts();
  const { data, isLoading, error, refetch } = usePricingList();
  const [filter, setFilter] = useState<string>("all");

  const productName = (id: string | null) => {
    if (!id) return "Cálculo avulso";
    const name = products.find((product) => product.id === id)?.name;
    return name ? displayProductName(name) : "Produto indisponível";
  };
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
        action={
          <Button
            title="Tentar novamente"
            variant="ghost"
            onPress={() => void refetch()}
          />
        }
      />
    );
  } else if (all.length === 0) {
    content = (
      <EmptyState
        title="Nenhum cálculo ainda"
        description="Faça uma precificação e toque em 'Salvar cálculo sugerido' para ver o histórico aqui."
      />
    );
  } else {
    content = (
      <FlatList
        key={filter}
        style={{ flex: 1, minHeight: 0 }}
        showsVerticalScrollIndicator={false}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing["4xl"],
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <EmptyState
            title="Nenhum cálculo neste filtro"
            description="Escolha outro produto ou veja todos os cálculos."
          />
        }
        renderItem={({ item }) => (
          <PricingHistoryCard item={item} productLabel={productName(item.productId)} />
        )}
      />
    );
  }

  return (
    <ResponsiveModal
      desktopMaxWidth={760}
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, minHeight: 0, backgroundColor: theme.colors.background }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant="h3">Histórico</Typography>
            <Typography variant="caption">Cálculos de precificação salvos</Typography>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar histórico"
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: radii.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppIcon name="close" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        {chips.length > 1 ? (
          <ScrollView
            horizontal
            style={{ flexGrow: 0, flexShrink: 0 }}
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: spacing.md,
              gap: spacing.sm,
              alignItems: "center",
            }}
          >
            {chips.map((chip) => (
              <Pressable
                key={chip.key}
                accessibilityRole="button"
                accessibilityLabel={chip.label}
                accessibilityState={{ selected: filter === chip.key }}
                onPress={() => setFilter(chip.key)}
                style={({ pressed }) => ({
                  minHeight: 44,
                  maxWidth: 220,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: filter === chip.key ? palette.wine : theme.colors.border,
                  backgroundColor:
                    filter === chip.key || pressed
                      ? theme.colors.surface
                      : theme.colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Typography
                  variant={filter === chip.key ? "captionBold" : "caption"}
                  color={filter === chip.key ? palette.wine : theme.colors.textSecondary}
                  numberOfLines={1}
                >
                  {chip.label}
                </Typography>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {content}
      </SafeAreaView>
    </ResponsiveModal>
  );
}
