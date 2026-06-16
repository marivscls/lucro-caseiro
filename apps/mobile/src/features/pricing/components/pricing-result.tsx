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

/** Círculo de ícone tintado (cabeçalhos de seção). */
function IconCircle({
  icon,
  tint,
  color,
  size = 32,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  color: string;
  size?: number;
}>) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.full,
        backgroundColor: tint,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={Math.round(size * 0.56)} color={color} />
    </View>
  );
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
  readonly feesPercent?: number;
  readonly feesAmount?: number;
  readonly finalPrice?: number;
  readonly monthlyUnits?: number;
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
  feesPercent = 0,
  feesAmount = 0,
  finalPrice,
  monthlyUnits = 200,
  onRecalculate,
  onSave,
  isSaving,
}: PricingResultProps) {
  const { theme } = useTheme();

  const priceToCharge = finalPrice ?? suggestedPrice;
  const hasFees = feesPercent > 0;

  const breakdown: CostBreakdownItem[] = [
    { label: "Insumos", value: ingredientCost, color: theme.colors.premium },
    { label: "Embalagem", value: packagingCost, color: theme.colors.blue },
    { label: "Mão de obra", value: laborCost, color: theme.colors.lavender },
    { label: "Custos fixos", value: fixedCostShare, color: theme.colors.alert },
  ];

  const monthlyRevenue = priceToCharge * monthlyUnits;
  const monthlyProfit = profitPerUnit * monthlyUnits;
  const profitMarginDisplay =
    suggestedPrice > 0 ? Math.round((profitPerUnit / suggestedPrice) * 100) : 0;

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
          {hasFees ? "Preço final (com taxas)" : "Preço sugerido"}
        </Typography>
        <Typography
          variant="moneyHero"
          color={theme.colors.success}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {formatCurrency(priceToCharge)}
        </Typography>
        {hasFees && (
          <Typography variant="caption" color={theme.colors.success}>
            Base {formatCurrency(suggestedPrice)} + {feesPercent}% de taxas (
            {formatCurrency(feesAmount)})
          </Typography>
        )}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <IconCircle
              icon="pie-chart-outline"
              tint={`${theme.colors.primary}26`}
              color={theme.colors.primary}
            />
            <Typography variant="h3">Composição</Typography>
          </View>
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
        {breakdown.map((item) => {
          const pct =
            suggestedPrice > 0 ? Math.round((item.value / suggestedPrice) * 100) : 0;
          return (
            <View
              key={item.label}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: radii.full,
                    backgroundColor: item.color,
                  }}
                />
                <Typography variant="body">{item.label}</Typography>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <Typography variant="body">{formatCurrency(item.value)}</Typography>
                <View
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                    borderRadius: radii.sm,
                    backgroundColor: `${item.color}26`,
                  }}
                >
                  <Typography
                    variant="caption"
                    color={item.color}
                    style={{ fontWeight: "700" }}
                  >
                    {pct}%
                  </Typography>
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      {/* Profit margin card */}
      <Card
        style={{
          gap: spacing.md,
          backgroundColor: theme.colors.successBg,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <IconCircle
            icon="trending-up"
            tint={`${theme.colors.success}33`}
            color={theme.colors.success}
          />
          <Typography
            variant="bodyBold"
            color={theme.colors.success}
            style={{ fontSize: 16 }}
          >
            Margem de lucro
          </Typography>
        </View>
        <View style={{ flexDirection: "row", gap: spacing.lg }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant="caption" color={theme.colors.success}>
              Lucro por unidade
            </Typography>
            <Typography
              variant="moneyLg"
              color={theme.colors.success}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {formatCurrency(profitPerUnit)}
            </Typography>
          </View>
          <View style={{ width: 1, backgroundColor: `${theme.colors.success}40` }} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant="caption" color={theme.colors.success}>
              Margem sobre o preço
            </Typography>
            <Typography
              variant="moneyLg"
              color={theme.colors.success}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {profitMarginDisplay}%
            </Typography>
          </View>
        </View>
      </Card>

      {/* Monthly projection */}
      <Card style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <IconCircle
            icon="trending-up"
            tint={theme.colors.premiumBg}
            color={theme.colors.premium}
          />
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
            <Typography
              variant="money"
              color={theme.colors.text}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
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
            <Typography
              variant="money"
              color={theme.colors.success}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
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
