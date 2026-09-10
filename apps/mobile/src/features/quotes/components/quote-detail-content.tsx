import type { Quote } from "@lucro-caseiro/contracts";
import { Card, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import type { ReactNode } from "react";
import { View } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { formatCurrency } from "../../../shared/utils/format";

export function QuoteDetailContent({
  quote,
  status,
}: Readonly<{ quote: Quote; status: ReactNode }>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();

  return (
    <View style={{ gap: spacing["2xl"] }}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
          <Typography variant="h3" color={pal.ink} style={{ flex: 1, minWidth: 0 }}>
            {quote.title}
          </Typography>
          {status}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <AppIcon name="person-outline" size={16} color={pal.muted} />
          <Typography variant="body" color={pal.muted} style={{ flex: 1 }}>
            {quote.clientName ?? "Sem cliente informado"}
          </Typography>
        </View>
      </View>

      <Card
        padding="lg"
        style={{ backgroundColor: pal.softRose, borderRadius: radii.lg }}
      >
        <View style={{ gap: spacing.xs }}>
          <Typography variant="caption" color={pal.wine}>
            Valor do orçamento
          </Typography>
          <Typography variant="moneyLg" color={pal.wine}>
            {formatCurrency(quote.total)}
          </Typography>
          {quote.validUntil ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                marginTop: spacing.sm,
              }}
            >
              <AppIcon name="calendar-outline" size={16} color={pal.muted} />
              <Typography variant="caption" color={pal.muted} style={{ flex: 1 }}>
                Válido até {quote.validUntil.split("-").reverse().join("/")}
              </Typography>
            </View>
          ) : null}
        </View>
      </Card>

      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: spacing.xs,
          }}
        >
          <Typography variant="bodyBold" color={pal.ink}>
            Itens do orçamento
          </Typography>
          <Typography variant="caption" color={pal.muted}>
            {quote.items.length} {quote.items.length === 1 ? "item" : "itens"}
          </Typography>
        </View>
        {quote.items.map((item, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: spacing.md,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
              <Typography variant="body" color={pal.ink}>
                {item.description}
              </Typography>
              <Typography variant="caption" color={pal.muted}>
                {String(item.quantity).replace(".", ",")} ×{" "}
                {formatCurrency(item.unitPrice)}
              </Typography>
            </View>
            <Typography
              variant="bodyBold"
              color={pal.ink}
              style={{ flexShrink: 0, fontVariant: ["tabular-nums"], textAlign: "right" }}
            >
              {formatCurrency(item.quantity * item.unitPrice)}
            </Typography>
          </View>
        ))}
        {quote.discount > 0 ? (
          <View style={{ gap: spacing.sm, paddingTop: spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <Typography variant="caption">Subtotal</Typography>
              <Typography variant="caption" style={{ fontVariant: ["tabular-nums"] }}>
                {formatCurrency(quote.subtotal)}
              </Typography>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <Typography variant="caption">Desconto</Typography>
              <Typography
                variant="caption"
                color={theme.colors.success}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                − {formatCurrency(quote.discount)}
              </Typography>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <Typography variant="bodyBold">Total</Typography>
              <Typography
                variant="bodyBold"
                color={pal.wine}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatCurrency(quote.total)}
              </Typography>
            </View>
          </View>
        ) : null}
      </View>

      <Card padding="lg" style={{ borderRadius: radii.lg }}>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <AppIcon name="lock-closed-outline" size={16} color={pal.muted} />
            <Typography variant="bodyBold" color={pal.ink} style={{ flex: 1 }}>
              Rentabilidade interna
            </Typography>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}>
            <View style={{ flexGrow: 1, flexBasis: 140, gap: spacing.xs }}>
              <Typography variant="caption">Ganho estimado</Typography>
              <Typography
                variant="money"
                color={
                  quote.estimatedGain >= 0 ? theme.colors.success : theme.colors.alert
                }
              >
                {formatCurrency(quote.estimatedGain)}
              </Typography>
            </View>
            <View style={{ flexGrow: 1, flexBasis: 140, gap: spacing.xs }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: spacing.sm,
                }}
              >
                <Typography variant="caption">Custo</Typography>
                <Typography
                  variant="caption"
                  color={pal.ink}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatCurrency(quote.estimatedCost)}
                </Typography>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: spacing.sm,
                }}
              >
                <Typography variant="caption">Margem</Typography>
                <Typography
                  variant="caption"
                  color={pal.ink}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {quote.estimatedMargin.toFixed(1).replace(".", ",")}%
                </Typography>
              </View>
            </View>
          </View>
          <Typography variant="caption" color={pal.muted}>
            Valores estimados. Visíveis só para você, fora do PDF e do WhatsApp.
          </Typography>
        </View>
      </Card>

      {quote.notes ? (
        <View style={{ gap: spacing.sm }}>
          <Typography variant="bodyBold" color={pal.ink}>
            Observações
          </Typography>
          <Typography variant="body" color={pal.muted}>
            {quote.notes}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}
