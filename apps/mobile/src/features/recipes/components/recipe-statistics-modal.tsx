import { Card, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { StandardModal } from "../../../shared/components/standard-modal";
import { SkeletonCard } from "../../../shared/components/skeleton";
import { displayIngredientName } from "../../../shared/ingredient-image/resolve";
import { formatCurrency } from "../../../shared/utils/format";
import { useAllProducts } from "../../products/hooks";
import { useAllRecipes } from "../hooks";
import { calculateRecipeStatistics } from "../statistics";
import { useBusinessCopy } from "../../subscription/business-copy";

function MetricCard({
  label,
  value,
  icon,
  description,
  tone = "neutral",
}: Readonly<{
  label: string;
  value: string;
  description: string;
  tone?: "neutral" | "positive" | "negative";
  icon: "calculator-outline" | "trending-up-outline" | "trending-down-outline";
}>) {
  const { theme } = useTheme();
  const color = {
    neutral: theme.colors.text,
    positive: theme.colors.success,
    negative: theme.colors.alert,
  }[tone];
  return (
    <Card
      variant="surface"
      padding="md"
      style={{ flex: 1, minWidth: 0, gap: spacing.md, borderRadius: radii.lg }}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: spacing.xs,
        }}
      >
        <AppIcon name={icon} size={16} color={theme.colors.textSecondary} />
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {label}
        </Typography>
      </View>
      <View style={{ gap: spacing.xs, marginTop: "auto" }}>
        <Typography
          variant="moneyLg"
          color={color}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {value}
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {description}
        </Typography>
      </View>
    </Card>
  );
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function RecipeStatisticsModal({
  visible,
  onClose,
}: Readonly<{ visible: boolean; onClose: () => void }>) {
  const { theme } = useTheme();
  const experienceCopy = useBusinessCopy();
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
  const ranking = statistics.profitability.slice(0, 5);
  const margin = statistics.averageMarginPercent;
  const marginTone = margin !== null && margin < 0 ? "negative" : "neutral";
  const marginDescription =
    margin === null ? "Sem dados de venda" : "Sobre o preço de venda";

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
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <MetricCard
              label="Custo médio"
              description={`Por ${experienceCopy.formulaNoun}`}
              value={formatCurrency(statistics.averageRecipeCost)}
              icon="calculator-outline"
            />
            <MetricCard
              label="Margem média"
              description={
                margin !== null && margin < 0 ? "Margem negativa" : marginDescription
              }
              value={margin === null ? "—" : formatPercent(margin)}
              tone={margin !== null && margin > 0 ? "positive" : marginTone}
              icon={
                margin !== null && margin < 0
                  ? "trending-down-outline"
                  : "trending-up-outline"
              }
            />
          </View>
          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}
          >
            <AppIcon
              name="information-circle-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Typography
              variant="caption"
              color={theme.colors.textSecondary}
              style={{ flex: 1 }}
            >
              Margem disponível em {statistics.profitability.length} de{" "}
              {recipes?.length ?? 0} {experienceCopy.formulaNounPlural}.
            </Typography>
          </View>
        </View>

        {ranking.length ? (
          <View style={{ gap: spacing.lg }}>
            <View style={{ gap: spacing.xs }}>
              <Typography variant="h3">
                {ranking[0].profitPerUnit > 0
                  ? "Mais lucrativas"
                  : `Resultado por ${experienceCopy.formulaNoun}`}
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Em ordem de lucro por unidade de rendimento.
              </Typography>
            </View>
            <View style={{ gap: spacing.xs }}>
              {ranking.map((item, index) => {
                const isLeader = index === 0 && item.profitPerUnit > 0;
                const marginColor = isLeader
                  ? theme.colors.success
                  : theme.colors.textSecondary;
                let resultColor = theme.colors.text;
                if (item.profitPerUnit < 0) resultColor = theme.colors.alert;
                if (item.profitPerUnit > 0) resultColor = theme.colors.success;
                return (
                  <View
                    key={item.recipeId}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: spacing.md,
                      padding: spacing.md,
                      borderRadius: radii.xl,
                      backgroundColor: isLeader ? theme.colors.successBg : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: radii.sm,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isLeader
                          ? theme.colors.surfaceElevated
                          : theme.colors.surface,
                      }}
                    >
                      <Typography
                        variant="captionBold"
                        color={
                          isLeader ? theme.colors.success : theme.colors.textSecondary
                        }
                      >
                        {index + 1}
                      </Typography>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
                      <Typography variant="bodyBold" style={{ paddingTop: spacing.xs }}>
                        {displayIngredientName(item.recipeName)}
                      </Typography>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          alignItems: "baseline",
                          columnGap: spacing.md,
                          rowGap: spacing.xs,
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="money" color={resultColor}>
                          {formatCurrency(item.profitPerUnit)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={
                            item.marginPercent < 0 ? theme.colors.alert : marginColor
                          }
                          style={{ fontVariant: ["tabular-nums"] }}
                        >
                          {formatPercent(item.marginPercent)} de margem
                        </Typography>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                paddingTop: spacing.md,
              }}
            >
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Considera produtos ativos com preço de venda. Se houver mais de um produto
                por {experienceCopy.formulaNoun}, usa o de maior lucro. A margem é
                calculada sobre o preço de venda.
              </Typography>
            </View>
          </View>
        ) : (
          <Card variant="surface" padding="xl" style={{ gap: spacing.sm }}>
            <Typography variant="h3">Margem ainda indisponível</Typography>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Vincule uma {experienceCopy.formulaNoun} a um produto com preço de venda
              para calcular lucro e margem.
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
      title={`Estatísticas de ${experienceCopy.formulaNounPlural}`}
      subtitle="Acompanhe seus custos e margens"
    >
      {content}
    </StandardModal>
  );
}
