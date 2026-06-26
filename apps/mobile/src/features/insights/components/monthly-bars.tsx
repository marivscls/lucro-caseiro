import { Typography, useTheme, spacing, radii, type Theme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import type { MonthlyRevenue } from "../types";
import { formatMoneyShort, maxRevenue, monthLabel } from "../domain";

const CHART_HEIGHT = 168;
// Espaço reservado no topo de cada barra para o rótulo de valor não vazar a grade.
const LABEL_HEADROOM = 18;
const STEPS = 4; // linhas de grade: 0, ¼, ½, ¾ e topo

/** Arredonda o teto do eixo para um número "redondo" (200, 500, 1 mil...). */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * pow;
    if (candidate >= value) return candidate;
  }
  return 10 * pow;
}

/** Pílula de estatística do rodapé (maior faturamento, média). */
function StatPill({
  label,
  value,
  tint,
  theme,
}: Readonly<{ label: string; value: string; tint: string; theme: Theme }>) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          theme.mode === "dark" ? "rgba(255,255,255,0.04)" : theme.colors.surface,
        borderRadius: radii.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        gap: 2,
      }}
    >
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ fontSize: 11 }}
      >
        {label}
      </Typography>
      <Typography variant="bodyBold" color={tint} style={{ fontSize: 16 }}>
        {value}
      </Typography>
    </View>
  );
}

/** Gráfico de barras do faturamento mês a mês (grade + rótulos, sem dependência nativa). */
export function MonthlyBars({ series }: Readonly<{ series: MonthlyRevenue[] }>) {
  const { theme } = useTheme();
  const axisMax = niceCeil(maxRevenue(series));
  const gridColor = `${theme.colors.text}14`;
  const labelColor = theme.colors.textSecondary;

  const nonEmpty = series.filter((m) => m.revenue > 0);
  const total = series.reduce((acc, m) => acc + m.revenue, 0);
  const average = nonEmpty.length > 0 ? total / nonEmpty.length : 0;
  const best = series.reduce(
    (acc, m) => (m.revenue > acc.revenue ? m : acc),
    series[0] ?? { month: "", revenue: 0 },
  );

  // Valores das linhas de grade, de cima (axisMax) para baixo (0).
  const gridValues = Array.from({ length: STEPS + 1 }, (_, i) =>
    Math.round((axisMax * (STEPS - i)) / STEPS),
  );

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {/* Eixo Y */}
        <View style={{ height: CHART_HEIGHT, justifyContent: "space-between" }}>
          {gridValues.map((v) => (
            <Typography
              key={v}
              variant="caption"
              color={labelColor}
              style={{ fontSize: 10 }}
            >
              {formatMoneyShort(v)}
            </Typography>
          ))}
        </View>

        {/* Área do gráfico */}
        <View style={{ flex: 1 }}>
          <View style={{ height: CHART_HEIGHT }}>
            {/* Linhas de grade */}
            {gridValues.map((v, i) => (
              <View
                key={v}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: (CHART_HEIGHT / STEPS) * i,
                  height: 1,
                  backgroundColor: gridColor,
                }}
              />
            ))}

            {/* Barras */}
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                flexDirection: "row",
                alignItems: "flex-end",
                gap: spacing.xs,
              }}
            >
              {series.map((m) => {
                const ratio = axisMax > 0 ? m.revenue / axisMax : 0;
                const barHeight =
                  m.revenue > 0
                    ? Math.max(4, ratio * (CHART_HEIGHT - LABEL_HEADROOM))
                    : 0;
                const isBest = m.revenue > 0 && m.month === best.month;
                return (
                  <View
                    key={m.month}
                    style={{
                      flex: 1,
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {m.revenue > 0 && (
                      <Typography
                        variant="caption"
                        color={isBest ? theme.colors.primary : labelColor}
                        numberOfLines={1}
                        style={{
                          fontSize: 10,
                          fontWeight: isBest ? "800" : "600",
                          marginBottom: 2,
                        }}
                      >
                        {formatMoneyShort(m.revenue)}
                      </Typography>
                    )}
                    <View
                      accessibilityLabel={`${monthLabel(m.month)}: ${formatMoneyShort(m.revenue)}`}
                      style={{
                        width: "64%",
                        height: barHeight,
                        borderTopLeftRadius: radii.sm,
                        borderTopRightRadius: radii.sm,
                        backgroundColor: theme.colors.primary,
                        opacity: isBest ? 1 : 0.72,
                      }}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* Rótulos dos meses */}
          <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs }}>
            {series.map((m) => {
              const isBest = m.revenue > 0 && m.month === best.month;
              return (
                <Typography
                  key={m.month}
                  variant="caption"
                  color={isBest ? theme.colors.text : labelColor}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: isBest ? "700" : "400",
                  }}
                >
                  {monthLabel(m.month)}
                </Typography>
              );
            })}
          </View>
        </View>
      </View>

      {/* Rodapé de estatísticas */}
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <StatPill
          label="Maior faturamento"
          value={formatMoneyShort(best.revenue)}
          tint={theme.colors.primary}
          theme={theme}
        />
        <StatPill
          label="Média mensal"
          value={formatMoneyShort(average)}
          tint={theme.colors.text}
          theme={theme}
        />
      </View>
    </View>
  );
}
