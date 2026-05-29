import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import type { MonthlyRevenue } from "../types";
import { formatMoneyShort, maxRevenue, monthLabel } from "../domain";

const CHART_HEIGHT = 140;

/** Gráfico de barras verticais do faturamento mês a mês (sem dependência nativa). */
export function MonthlyBars({ series }: Readonly<{ series: MonthlyRevenue[] }>) {
  const { theme } = useTheme();
  const max = maxRevenue(series);

  return (
    <View style={{ gap: spacing.md }}>
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
          const ratio = m.revenue / max;
          const barHeight = Math.max(4, Math.round(ratio * (CHART_HEIGHT - 24)));
          const empty = m.revenue === 0;
          return (
            <View
              key={m.month}
              style={{ flex: 1, alignItems: "center", gap: spacing.xs }}
            >
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {empty ? "" : formatMoneyShort(m.revenue)}
              </Typography>
              <View
                accessibilityLabel={`${monthLabel(m.month)}: ${formatMoneyShort(m.revenue)}`}
                style={{
                  width: "70%",
                  height: barHeight,
                  borderRadius: radii.sm,
                  backgroundColor: empty
                    ? theme.colors.surfaceElevated
                    : theme.colors.primary,
                }}
              />
            </View>
          );
        })}
      </View>
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.xs }}
      >
        {series.map((m) => (
          <Typography
            key={m.month}
            variant="caption"
            color={theme.colors.textSecondary}
            style={{ flex: 1, textAlign: "center" }}
          >
            {monthLabel(m.month)}
          </Typography>
        ))}
      </View>
    </View>
  );
}
