import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import type { MonthlyRevenue } from "../types";
import { formatMoneyShort, maxRevenue, monthLabel } from "../domain";

const CHART_HEIGHT = 150;

/** Gráfico de barras verticais do faturamento mês a mês (sem dependência nativa). */
export function MonthlyBars({ series }: Readonly<{ series: MonthlyRevenue[] }>) {
  const { theme } = useTheme();
  const max = maxRevenue(series);
  const emptyBar = `${theme.colors.primary}1f`;

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          height: CHART_HEIGHT,
          gap: spacing.xs,
        }}
      >
        {series.map((m) => {
          const ratio = max > 0 ? m.revenue / max : 0;
          const barHeight = Math.max(6, Math.round(ratio * (CHART_HEIGHT - 28)));
          const empty = m.revenue === 0;
          const isMax = !empty && m.revenue === max;
          return (
            <View
              key={m.month}
              style={{ flex: 1, alignItems: "center", gap: spacing.xs }}
            >
              <Typography
                variant="caption"
                color={isMax ? theme.colors.primary : theme.colors.textSecondary}
                style={{ fontSize: 11, fontWeight: isMax ? "800" : "400" }}
              >
                {empty ? "" : formatMoneyShort(m.revenue)}
              </Typography>
              <View
                accessibilityLabel={`${monthLabel(m.month)}: ${formatMoneyShort(m.revenue)}`}
                style={{
                  width: "62%",
                  height: barHeight,
                  borderTopLeftRadius: radii.md,
                  borderTopRightRadius: radii.md,
                  borderBottomLeftRadius: 4,
                  borderBottomRightRadius: 4,
                  backgroundColor: empty ? emptyBar : theme.colors.primary,
                  opacity: empty || isMax ? 1 : 0.78,
                }}
              />
            </View>
          );
        })}
      </View>

      {/* Linha de base */}
      <View style={{ height: 1, backgroundColor: `${theme.colors.text}14` }} />

      <View
        style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.xs }}
      >
        {series.map((m) => {
          const isMax = m.revenue > 0 && m.revenue === max;
          return (
            <Typography
              key={m.month}
              variant="caption"
              color={isMax ? theme.colors.text : theme.colors.textSecondary}
              style={{ flex: 1, textAlign: "center", fontWeight: isMax ? "700" : "400" }}
            >
              {monthLabel(m.month)}
            </Typography>
          );
        })}
      </View>
    </View>
  );
}
