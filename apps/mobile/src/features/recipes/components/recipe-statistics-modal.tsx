import { Card, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { StandardModal } from "../../../shared/components/standard-modal";
import { SkeletonCard } from "../../../shared/components/skeleton";
import { formatCurrency } from "../../../shared/utils/format";
import { RankBars, type RankRow } from "../../insights/components/rank-bars";
import { useAllProducts } from "../../products/hooks";
import { useAllRecipes } from "../hooks";
import { calculateRecipeStatistics } from "../statistics";

function MetricCard({
  label,
  value,
  icon,
}: Readonly<{
  label: string;
  value: string;
  icon: "calculator-outline" | "trending-up-outline";
}>) {
  const { theme } = useTheme();
  return (
    <Card variant="surface" padding="lg" style={{ flex: 1, gap: spacing.sm }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radii.full,
          backgroundColor: theme.colors.primaryBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={20} color={theme.colors.primary} />
      </View>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        {label}
      </Typography>
      <Typography
        variant="moneyLg"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
      >
        {value}
      </Typography>
    </Card>
  );
}

export function RecipeStatisticsModal({
  visible,
  onClose,
}: Readonly<{ visible: boolean; onClose: () => void }>) {
  const { theme } = useTheme();
  const {
    data: recipes,
    isLoading: loadingRecipes,
    isError: recipesError,
  } = useAllRecipes();
  const {
    data: products,
    isLoading: loadingProducts,
    isError: productsError,
  } = useAllProducts();
  const loading = loadingRecipes || loadingProducts;
  const failed = recipesError || productsError;
  const statistics = calculateRecipeStatistics(recipes ?? [], products ?? []);
  const ranking: RankRow[] = statistics.profitability.slice(0, 5).map((item) => ({
    key: item.recipeId,
    label: item.recipeName,
    caption: `${formatCurrency(item.profitPerUnit)} · ${item.marginPercent.toFixed(1)}%`,
    value: item.profitPerUnit,
  }));

  let content: React.ReactNode;
  if (loading) {
    content = (
      <>
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
      </>
    );
  } else if (failed) {
    content = (
      <Card variant="surface" padding="xl" style={{ gap: spacing.sm }}>
        <Typography variant="h3">Não foi possível carregar as estatísticas</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Feche esta janela e tente novamente.
        </Typography>
      </Card>
    );
  } else {
    content = (
      <>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <MetricCard
            label="CUSTO MÉDIO / RECEITA"
            value={formatCurrency(statistics.averageRecipeCost)}
            icon="calculator-outline"
          />
          <MetricCard
            label="MARGEM MÉDIA"
            value={
              statistics.averageMarginPercent === null
                ? "—"
                : `${statistics.averageMarginPercent.toFixed(1)}%`
            }
            icon="trending-up-outline"
          />
        </View>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Margem calculada em {statistics.profitability.length} de {recipes?.length ?? 0}{" "}
          receitas vinculadas a produtos ativos.
        </Typography>

        {ranking.length ? (
          <Card variant="surface" padding="xl" style={{ gap: spacing.lg }}>
            <View style={{ gap: spacing.xs }}>
              <Typography variant="h3">Mais lucrativas</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Lucro por unidade de rendimento e margem sobre o preço de venda. Quando há
                mais de um produto, considera o de maior lucro.
              </Typography>
            </View>
            <RankBars rows={ranking} color={theme.colors.success} />
          </Card>
        ) : (
          <Card variant="surface" padding="xl" style={{ gap: spacing.sm }}>
            <Typography variant="h3">Margem ainda indisponível</Typography>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Vincule uma receita a um produto com preço de venda para calcular lucro e
              margem.
            </Typography>
          </Card>
        )}
      </>
    );
  }

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Estatísticas de receitas"
      subtitle="Custos e margens dos produtos vinculados"
    >
      {content}
    </StandardModal>
  );
}
