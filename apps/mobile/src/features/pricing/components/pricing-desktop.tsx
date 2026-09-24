/**
 * Lateral da precificação no desktop (web >= 1024px): prévia do custo de uma
 * unidade nas etapas 1 e 2. Na etapa 3 a lateral mostra o `PricingSummary`.
 */
import type { CreatePricing } from "@lucro-caseiro/contracts";
import { MAX_MONEY } from "@lucro-caseiro/contracts";
import { Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { desktopCardStyle } from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import { evaluateSalePrice, pricingQuote } from "../calc";
import { moneyValue } from "../use-pricing-draft";

export function PricingCostPreview({
  productName,
  rows,
}: Readonly<{
  productName?: string;
  rows: readonly { label: string; value: number }[];
}>) {
  const { theme } = useTheme();
  const safe = rows.map((row) => ({
    ...row,
    value: Number.isFinite(row.value) && row.value > 0 ? row.value : 0,
  }));
  const total = safe.reduce((sum, row) => sum + row.value, 0);

  return (
    <View
      accessibilityLabel={`Custo de uma unidade: ${formatCurrency(total)}`}
      style={[desktopCardStyle(theme, { padding: 0 }), { overflow: "hidden" }]}
    >
      <View
        style={{
          paddingHorizontal: spacing["2xl"],
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          gap: 2,
        }}
      >
        <Typography variant="desktopCardTitle">Custo de uma unidade</Typography>
        <Typography variant="desktopMeta" numberOfLines={2}>
          {productName ?? "Cálculo sem produto cadastrado"}
        </Typography>
      </View>
      <View style={{ paddingHorizontal: spacing["2xl"], gap: spacing.sm }}>
        {safe.map((row) => (
          <View
            key={row.label}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <Typography variant="desktopBody" style={{ flex: 1, minWidth: 0 }}>
              {row.label}
            </Typography>
            <Typography
              variant="desktopBodyStrong"
              color={row.value > 0 ? undefined : theme.colors.textSecondary}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatCurrency(row.value)}
            </Typography>
          </View>
        ))}
      </View>
      <View
        style={{
          marginTop: spacing.lg,
          paddingHorizontal: spacing["2xl"],
          paddingVertical: spacing.xl,
          backgroundColor: theme.colors.surface,
          gap: spacing.xs,
        }}
      >
        <Typography variant="desktopMetricLabel">Total por unidade</Typography>
        <Typography
          variant="desktopTotal"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatCurrency(total)}
        </Typography>
        <Typography variant="desktopMeta">
          O preço sugerido aparece na etapa 3, depois de definir seu ganho.
        </Typography>
      </View>
    </View>
  );
}

/**
 * Etapa 3: preço sugerido (ou o preço simulado), ganho e margem, sempre à
 * vista ao lado do formulário. Mesmas contas do `PricingSummary`.
 */
export function PricingResultPreview({
  input,
  alternative,
  productName,
  message,
}: Readonly<{
  input?: CreatePricing;
  alternative: string;
  productName?: string;
  message?: string;
}>) {
  const { theme } = useTheme();
  if (!input) {
    return (
      <View style={[desktopCardStyle(theme), { gap: spacing.sm }]}>
        <Typography variant="desktopCardTitle">Seu preço começa pelos custos</Typography>
        <Typography variant="desktopBody">{message}</Typography>
      </View>
    );
  }
  const quote = pricingQuote(input);
  const suggested = Math.ceil((quote.finalPrice - 1e-9) * 100) / 100;
  const simulated = alternative.trim() ? moneyValue(alternative) : null;
  const price = simulated ?? suggested;
  const valid = Number.isFinite(price) && price > 0 && price <= MAX_MONEY;
  const result = evaluateSalePrice(input, valid ? price : 0);
  const loss = result.profit < 0;

  return (
    <View
      accessibilityLabel={`Preço sugerido: ${formatCurrency(suggested)}`}
      style={[desktopCardStyle(theme, { padding: 0 }), { overflow: "hidden" }]}
    >
      <View
        style={{
          paddingHorizontal: spacing["2xl"],
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
          gap: 2,
        }}
      >
        <Typography variant="desktopMetricLabel">
          {simulated === null ? "Preço sugerido por unidade" : "Preço simulado"}
        </Typography>
        <Typography
          variant="desktopTotal"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatCurrency(valid ? price : 0)}
        </Typography>
        <Typography variant="desktopMeta" numberOfLines={2}>
          {simulated === null
            ? (productName ?? "Cálculo sem produto cadastrado")
            : `Sugerido: ${formatCurrency(suggested)}`}
        </Typography>
      </View>
      <View
        style={{
          paddingHorizontal: spacing["2xl"],
          paddingVertical: spacing.lg,
          backgroundColor: loss ? theme.colors.alertBg : theme.colors.successBg,
          gap: 2,
        }}
      >
        <Typography variant="desktopMetricLabel">
          {loss ? "Prejuízo estimado" : "Ganho estimado por unidade"}
        </Typography>
        <Typography
          variant="desktopMetric"
          color={loss ? theme.colors.alert : theme.colors.success}
        >
          {formatCurrency(result.profit)}
        </Typography>
        <Typography variant="desktopMeta">
          {result.margin.toFixed(1).replace(".", ",")}% sobre o preço de venda
        </Typography>
      </View>
    </View>
  );
}
