import { formatCurrency } from "../../../shared/utils/format";
import {
  Button,
  Card,
  Typography,
  fonts,
  spacing,
  radii,
  useTheme,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React from "react";
import { ScrollView, View } from "react-native";

import { desktopSplitLayout, pageGutter } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { useBusinessCopy } from "../../subscription/business-copy";

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
  icon: AppIconName;
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
      <AppIcon name={icon} size={Math.round(size * 0.56)} color={color} />
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
  readonly onCreateProduct?: () => void;
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
  monthlyUnits = 0,
  onRecalculate,
  onSave,
  onCreateProduct,
  isSaving,
}: PricingResultProps) {
  const { theme } = useTheme();
  const experienceCopy = useBusinessCopy();
  const isDesktop = useDesktopLayout();
  const split = desktopSplitLayout(isDesktop);

  const priceToCharge = finalPrice ?? suggestedPrice;
  const hasFees = feesPercent > 0;

  const breakdown: CostBreakdownItem[] = [
    {
      label: capitalize(experienceCopy.materialNounPlural),
      value: ingredientCost,
      color: theme.colors.premium,
    },
    {
      label: capitalize(experienceCopy.packagingNoun),
      value: packagingCost,
      color: theme.colors.blue,
    },
    { label: "Mão de obra", value: laborCost, color: theme.colors.lavender },
    { label: "Custos fixos", value: fixedCostShare, color: theme.colors.alert },
  ];

  const monthlyRevenue = priceToCharge * monthlyUnits;
  const monthlyProfit = profitPerUnit * monthlyUnits;
  const profitMarginDisplay =
    suggestedPrice > 0 ? Math.round((profitPerUnit / suggestedPrice) * 100) : 0;
  const priceScenarios = [
    { label: "10% abaixo", price: suggestedPrice * 0.9 },
    { label: "Preço calculado", price: suggestedPrice },
    { label: "10% acima", price: suggestedPrice * 1.1 },
  ].map((scenario) => {
    const gain = scenario.price - totalCost;
    const margin = scenario.price > 0 ? (gain / scenario.price) * 100 : 0;
    return { ...scenario, gain, margin };
  });

  return (
    <ScrollView
      contentContainerStyle={[
        {
          paddingVertical: spacing.xl,
          gap: spacing.xl,
          ...pageGutter(isDesktop),
        },
        split.outer,
      ]}
    >
      <View style={{ gap: spacing.xs }}>
        <Typography variant="h1">Estimativa de preço</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Calculada somente com os valores que você informou. Confira as premissas antes
          de usar este preço.
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
          {hasFees ? "Estimativa com taxas" : "Preço estimado"}
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
            <Typography variant="h3">O que entrou no cálculo</Typography>
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
                <Typography variant="body">
                  {item.value > 0 ? formatCurrency(item.value) : "Não incluído"}
                </Typography>
                {item.value > 0 ? (
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
                      style={{ fontFamily: fonts.bold }}
                    >
                      {pct}%
                    </Typography>
                  </View>
                ) : null}
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
          <Typography variant="bodyBold" color={theme.colors.success}>
            Lucro estimado
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

      <Card style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <IconCircle
            icon="swap-horizontal-outline"
            tint={theme.colors.blueBg}
            color={theme.colors.blue}
          />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant="h3">Compare antes de decidir</Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Simulação sobre o preço base, sem alterar seus dados
            </Typography>
          </View>
        </View>

        {priceScenarios.map((scenario) => {
          const selected = scenario.label === "Preço calculado";
          return (
            <View
              key={scenario.label}
              style={{
                alignItems: "center",
                backgroundColor: selected
                  ? theme.colors.primaryBg
                  : theme.colors.surfaceElevated,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                borderRadius: radii.lg,
                borderWidth: 1,
                flexDirection: "row",
                gap: spacing.md,
                padding: spacing.md,
              }}
            >
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Typography
                  variant="bodyBold"
                  color={selected ? theme.colors.primaryStrong : theme.colors.text}
                >
                  {scenario.label}
                </Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Ganho {formatCurrency(scenario.gain)} · margem{" "}
                  {scenario.margin.toFixed(1).replace(".", ",")}%
                </Typography>
              </View>
              <Typography variant="money" color={theme.colors.text}>
                {formatCurrency(scenario.price)}
              </Typography>
            </View>
          );
        })}

        <Typography variant="caption" color={theme.colors.textSecondary}>
          Baixar o preço não reduz seus custos: a diferença sai diretamente do ganho por
          unidade.
        </Typography>
      </Card>

      {/* Monthly projection: só existe quando a pessoa informou a produção. */}
      {monthlyUnits > 0 ? (
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
              <Typography
                variant="label"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                LUCRO ESTIMADO
              </Typography>
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
      ) : null}

      {/* Actions */}
      <View
        style={{
          gap: spacing.md,
          flexDirection: isDesktop ? "row" : "column",
          alignItems: isDesktop ? "center" : "stretch",
          flexWrap: "wrap",
        }}
      >
        {onCreateProduct ? (
          <Button
            title={`Salvar e criar ${experienceCopy.productNoun}`}
            onPress={onCreateProduct}
            loading={isSaving}
            size="lg"
            style={
              isDesktop
                ? { minHeight: 48, minWidth: 220, paddingHorizontal: spacing.xl }
                : undefined
            }
          />
        ) : null}
        <Button
          title="Salvar somente o cálculo"
          variant={onCreateProduct ? "outline" : "primary"}
          onPress={onSave}
          loading={isSaving}
          size="lg"
          style={
            isDesktop
              ? { minHeight: 48, minWidth: 200, paddingHorizontal: spacing.xl }
              : undefined
          }
        />
        <Button
          title="Recalcular"
          variant="ghost"
          onPress={onRecalculate}
          size="lg"
          style={
            isDesktop
              ? { minHeight: 48, minWidth: 160, paddingHorizontal: spacing.xl }
              : undefined
          }
        />
      </View>
    </ScrollView>
  );
}

function capitalize(value: string): string {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}
