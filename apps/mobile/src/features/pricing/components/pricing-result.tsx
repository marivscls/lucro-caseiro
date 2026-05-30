import { formatCurrency } from "../../../shared/utils/format";
import { Button, Card, Typography, spacing, radii, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, View } from "react-native";

interface CostBreakdownItem {
  label: string;
  value: number;
  color: string;
}

interface PricingResultProps {
  readonly ingredientCost: number;
  readonly packagingCost: number;
  readonly laborCost: number;
  readonly fixedCostShare: number;
  readonly totalCost: number;
  readonly marginPercent: number;
  readonly suggestedPrice: number;
  readonly profitPerUnit: number;
  readonly onRecalculate: () => void;
  readonly onSave: () => void;
  readonly isSaving: boolean;
}

export function PricingResult({
  ingredientCost,
  packagingCost,
  laborCost,
  fixedCostShare,
  totalCost,
  marginPercent: _marginPercent,
  suggestedPrice,
  profitPerUnit,
  onRecalculate,
  onSave,
  isSaving,
}: PricingResultProps) {
  const { theme } = useTheme();

  const breakdown: CostBreakdownItem[] = [
    { label: "Insumos", value: ingredientCost, color: theme.colors.premium },
    { label: "Embalagem", value: packagingCost, color: theme.colors.blue },
    { label: "Mão de obra", value: laborCost, color: theme.colors.lavender },
    { label: "Custos fixos", value: fixedCostShare, color: theme.colors.alert },
  ];

  const monthlyUnits = 200;
  const monthlyRevenue = suggestedPrice * monthlyUnits;
  const monthlyProfit = profitPerUnit * monthlyUnits;
  const profitMarginDisplay =
    totalCost > 0 ? Math.round((profitPerUnit / suggestedPrice) * 100) : 0;

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        gap: spacing.xl,
      }}
    >
      {/* Serif title */}
      <View style={{ gap: spacing.xs }}>
        <Typography variant="h1">Resultado do Cálculo</Typography>
        <Typography variant="body">
          Baseado nos valores informados para o seu produto
        </Typography>
      </View>

      {/* Suggested price hero card */}
      <Card
        style={{
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: theme.colors.successBg,
          paddingVertical: spacing["3xl"],
        }}
      >
        <Typography variant="caption" color={theme.colors.success}>
          Preço sugerido
        </Typography>
        <Typography variant="moneyHero" color={theme.colors.success}>
          {formatCurrency(suggestedPrice)}
        </Typography>
      </Card>

      {/* Cost composition */}
      <Card style={{ gap: spacing.lg }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h3">Composição</Typography>
          <Typography variant="caption">
            {formatCurrency(totalCost)} (
            {totalCost > 0 ? Math.round((totalCost / suggestedPrice) * 100) : 0}%)
          </Typography>
        </View>

        {/* Stacked bar */}
        <View
          style={{
            flexDirection: "row",
            height: 24,
            borderRadius: radii.full,
            overflow: "hidden",
          }}
        >
          {breakdown.map((item) => {
            const widthPercent = totalCost > 0 ? (item.value / totalCost) * 100 : 0;
            if (widthPercent === 0) return null;
            return (
              <View
                key={item.label}
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: item.color,
                }}
              />
            );
          })}
        </View>

        {/* Legend */}
        {breakdown.map((item) => (
          <View
            key={item.label}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: radii.full,
                  backgroundColor: item.color,
                }}
              />
              <Typography variant="caption">{item.label}</Typography>
            </View>
            <Typography variant="caption">{formatCurrency(item.value)}</Typography>
          </View>
        ))}
      </Card>

      {/* Profit margin card */}
      <Card
        style={{
          gap: spacing.sm,
          backgroundColor: theme.colors.successBg,
        }}
      >
        <Typography variant="caption" color={theme.colors.success}>
          Margem de Lucro
        </Typography>
        <Typography variant="label" color={theme.colors.success}>
          LUCRO POR UNIDADE
        </Typography>
        <Typography variant="moneyLg" color={theme.colors.success}>
          {formatCurrency(profitPerUnit)}
        </Typography>
      </Card>

      {/* Monthly projection */}
      <Card style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Ionicons name="trending-up" size={20} color={theme.colors.premium} />
          <Typography variant="h3">Projeção mensal</Typography>
        </View>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Estimativa vendendo {monthlyUnits} unidades por mês
        </Typography>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: radii.lg,
              padding: spacing.lg,
              gap: spacing.xs,
            }}
          >
            <Typography variant="label">FATURAMENTO</Typography>
            <Typography variant="money" color={theme.colors.text}>
              {formatCurrency(monthlyRevenue)}
            </Typography>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: radii.lg,
              padding: spacing.lg,
              gap: spacing.xs,
            }}
          >
            <Typography variant="label">LUCRO LÍQUIDO</Typography>
            <Typography variant="money" color={theme.colors.success}>
              {formatCurrency(monthlyProfit)}
            </Typography>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Margem sobre o preço
          </Typography>
          <Typography variant="bodyBold" color={theme.colors.success}>
            {profitMarginDisplay}%
          </Typography>
        </View>
      </Card>

      {/* Actions */}
      <View style={{ gap: spacing.md }}>
        <Button title="Salvar cálculo" onPress={onSave} loading={isSaving} size="lg" />
        <Button title="Recalcular" variant="outline" onPress={onRecalculate} size="lg" />
      </View>
    </ScrollView>
  );
}
