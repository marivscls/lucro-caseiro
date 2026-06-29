import { Ionicons } from "@expo/vector-icons";
import { Typography, useTheme, spacing, radii, type Theme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

import { formatMoney, formatMoneyShort, maxRevenue, monthLabel } from "../domain";
import type { MonthlyRevenue } from "../types";

const WINDOWS = [3, 6, 12] as const;
const CHART_HEIGHT = 268;
const BAR_HEADROOM = 16;
const STEPS = 4;
const MONTH_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * pow;
    if (candidate >= value) return candidate;
  }
  return 10 * pow;
}

function monthName(key: string): string {
  const month = Number(key.split("-")[1]);
  return MONTH_FULL[month - 1] ?? key;
}

function monthWithYear(key: string): string {
  const [year] = key.split("-");
  return `${monthName(key)} de ${year}`;
}

function periodDelta(series: MonthlyRevenue[]): number | null {
  if (series.length < 2) return null;
  const midpoint = Math.floor(series.length / 2);
  const previous = series.slice(0, midpoint).reduce((acc, m) => acc + m.revenue, 0);
  const current = series.slice(midpoint).reduce((acc, m) => acc + m.revenue, 0);
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function CompactWindowSelector({
  months,
  onChange,
}: Readonly<{ months: number; onChange?: (months: number) => void }>) {
  const { theme } = useTheme();
  const selectedIndex = WINDOWS.indexOf(months as (typeof WINDOWS)[number]);
  const nextWindow = WINDOWS[(selectedIndex + 1) % WINDOWS.length] ?? 12;

  return (
    <Pressable
      onPress={() => onChange?.(nextWindow)}
      accessibilityRole="button"
      accessibilityLabel={`Últimos ${months} meses`}
      accessibilityHint="Toque para alternar o período do gráfico"
      style={({ pressed }) => ({
        minHeight: 46,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        borderWidth: 1,
        borderColor:
          theme.mode === "dark" ? "rgba(245,225,219,0.18)" : "rgba(74,50,40,0.16)",
        borderRadius: radii.md,
        paddingHorizontal: spacing.lg,
        backgroundColor:
          theme.mode === "dark" ? "rgba(30,24,20,0.44)" : "rgba(255,250,248,0.58)",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Typography
        variant="bodyBold"
        color={theme.colors.text}
        numberOfLines={1}
        style={{ fontSize: 15 }}
      >
        Últimos {months} meses
      </Typography>
      <Ionicons name="chevron-down" size={18} color={theme.colors.text} />
    </Pressable>
  );
}

function StatPanel({
  icon,
  label,
  value,
  caption,
  tint,
  theme,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  caption: string;
  tint: string;
  theme: Theme;
}>) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${tint}24`,
          borderWidth: 1,
          borderColor: `${tint}3f`,
        }}
      >
        <Ionicons name={icon} size={25} color={tint} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          style={{ fontSize: 15 }}
        >
          {label}
        </Typography>
        <Typography
          variant="moneyLg"
          color={tint}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.62}
          style={{ fontSize: 28, fontWeight: "800" }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ fontSize: 14 }}
        >
          {caption}
        </Typography>
      </View>
    </View>
  );
}

export function MonthlyBars({
  series,
  windowMonths = 12,
  onWindowChange,
}: Readonly<{
  series: MonthlyRevenue[];
  windowMonths?: number;
  onWindowChange?: (months: number) => void;
}>) {
  const { theme } = useTheme();
  const axisMax = niceCeil(maxRevenue(series));
  const gridColor =
    theme.mode === "dark" ? "rgba(245,225,219,0.16)" : "rgba(74,50,40,0.14)";
  const labelColor = theme.colors.textSecondary;
  const nonEmpty = series.filter((m) => m.revenue > 0);
  const total = series.reduce((acc, m) => acc + m.revenue, 0);
  const average = nonEmpty.length > 0 ? total / nonEmpty.length : 0;
  const best = series.reduce(
    (acc, m) => (m.revenue > acc.revenue ? m : acc),
    series[0] ?? { month: "", revenue: 0 },
  );
  const active = [...series].reverse().find((m) => m.revenue > 0) ?? best;
  const delta = periodDelta(series);
  const deltaColor =
    delta == null || delta >= 0 ? theme.colors.success : theme.colors.alert;
  const panelBg =
    theme.mode === "dark" ? "rgba(31,26,23,0.92)" : "rgba(255,250,248,0.94)";
  const insetBg =
    theme.mode === "dark" ? "rgba(39,31,27,0.72)" : "rgba(247,237,233,0.78)";
  const borderColor =
    theme.mode === "dark" ? "rgba(245,225,219,0.16)" : "rgba(74,50,40,0.16)";
  const gridValues = Array.from({ length: STEPS + 1 }, (_, i) =>
    Math.round((axisMax * (STEPS - i)) / STEPS),
  );

  return (
    <View
      style={{
        gap: spacing.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor,
        borderRadius: radii["2xl"],
        backgroundColor: panelBg,
        shadowColor: "#000000",
        shadowOpacity: theme.mode === "dark" ? 0.34 : 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 14 },
        elevation: 6,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: radii.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${theme.colors.primary}24`,
              borderWidth: 1,
              borderColor: `${theme.colors.primary}28`,
            }}
          >
            <Ionicons name="bar-chart-outline" size={38} color={theme.colors.primary} />
          </View>
          <Typography
            variant="h1"
            color={theme.colors.text}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={{ flex: 1, fontSize: 28, fontWeight: "800", letterSpacing: 0 }}
          >
            Faturamento por mês
          </Typography>
        </View>
        <CompactWindowSelector months={windowMonths} onChange={onWindowChange} />
      </View>

      <View
        style={{
          overflow: "hidden",
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor,
          backgroundColor: insetBg,
          padding: spacing.lg,
          gap: spacing.xl,
        }}
      >
        <View style={{ gap: spacing.sm }}>
          <Typography
            variant="label"
            color={theme.colors.primaryLight}
            style={{ fontSize: 12, fontWeight: "800", letterSpacing: 0 }}
          >
            EVOLUÇÃO DO FATURAMENTO
          </Typography>
          <Typography
            variant="moneyHero"
            color={theme.colors.text}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.58}
            style={{ fontSize: 42, fontWeight: "800" }}
          >
            {formatMoney(total)}
          </Typography>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Typography variant="body" color={theme.colors.text} style={{ fontSize: 15 }}>
              Total no período
            </Typography>
            {delta !== null && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Ionicons
                    name={delta >= 0 ? "arrow-up" : "arrow-down"}
                    size={15}
                    color={deltaColor}
                  />
                  <Typography variant="body" color={deltaColor} style={{ fontSize: 15 }}>
                    {Math.abs(delta).toFixed(1).replace(".", ",")}%
                  </Typography>
                </View>
                <Typography
                  variant="body"
                  color={theme.colors.textSecondary}
                  style={{ fontSize: 15 }}
                >
                  vs. período anterior
                </Typography>
              </>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View
            style={{ width: 72, height: CHART_HEIGHT, justifyContent: "space-between" }}
          >
            {gridValues.map((v) => (
              <Typography
                key={v}
                variant="caption"
                color={labelColor}
                numberOfLines={1}
                style={{ fontSize: 14 }}
              >
                {formatMoneyShort(v)}
              </Typography>
            ))}
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ height: CHART_HEIGHT }}>
              {gridValues.map((v, i) => (
                <View
                  key={v}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: (CHART_HEIGHT / STEPS) * i,
                    borderTopWidth: 1,
                    borderStyle: "dashed",
                    borderColor: gridColor,
                  }}
                />
              ))}

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
                      ? Math.max(7, ratio * (CHART_HEIGHT - BAR_HEADROOM))
                      : 0;
                  const isActive = m.month === active.month && m.revenue > 0;
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
                      {isActive && (
                        <View
                          style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            width: 1,
                            borderLeftWidth: 1,
                            borderStyle: "dashed",
                            borderColor:
                              theme.mode === "dark"
                                ? "rgba(245,225,219,0.46)"
                                : "rgba(74,50,40,0.3)",
                          }}
                        />
                      )}
                      <View
                        accessibilityLabel={`${monthName(m.month)}: ${formatMoneyShort(m.revenue)}`}
                        style={{
                          width: "82%",
                          height: barHeight,
                          borderTopLeftRadius: radii.sm,
                          borderTopRightRadius: radii.sm,
                          backgroundColor: theme.colors.primary,
                          borderWidth: m.revenue > 0 ? 1 : 0,
                          borderColor: `${theme.colors.primaryLight}b8`,
                          opacity: m.revenue > 0 ? 0.78 : 0,
                          shadowColor: theme.colors.primary,
                          shadowOpacity: 0.35,
                          shadowRadius: 12,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: m.revenue > 0 ? 2 : 0,
                        }}
                      >
                        <View
                          style={{
                            height: Math.min(12, barHeight),
                            borderTopLeftRadius: radii.sm,
                            borderTopRightRadius: radii.sm,
                            backgroundColor: `${theme.colors.primaryLight}d9`,
                          }}
                        />
                      </View>
                      {isActive && (
                        <View
                          style={{
                            position: "absolute",
                            bottom: barHeight - 8,
                            width: 18,
                            height: 18,
                            borderRadius: radii.full,
                            backgroundColor: theme.colors.primary,
                            borderWidth: 4,
                            borderColor: theme.colors.textOnPrimary,
                          }}
                        />
                      )}
                    </View>
                  );
                })}
              </View>

              {active.revenue > 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    right: spacing.sm,
                    top: spacing.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor,
                    backgroundColor: panelBg,
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.xs,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: radii.full,
                        backgroundColor: theme.colors.primaryLight,
                      }}
                    />
                    <Typography
                      variant="body"
                      color={theme.colors.text}
                      style={{ fontSize: 15 }}
                    >
                      {monthName(active.month)}
                    </Typography>
                  </View>
                  <Typography
                    variant="bodyBold"
                    color={theme.colors.primary}
                    style={{ fontSize: 18, fontWeight: "800" }}
                  >
                    {formatMoneyShort(active.revenue)}
                  </Typography>
                </View>
              )}
            </View>

            <View
              style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm }}
            >
              {series.map((m) => (
                <Typography
                  key={m.month}
                  variant="caption"
                  color={theme.colors.text}
                  numberOfLines={1}
                  style={{ flex: 1, textAlign: "center", fontSize: 14 }}
                >
                  {monthLabel(m.month)}
                </Typography>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          borderWidth: 1,
          borderColor,
          borderRadius: radii.xl,
          backgroundColor: insetBg,
          overflow: "hidden",
        }}
      >
        <StatPanel
          icon="trophy-outline"
          label="Maior faturamento"
          value={formatMoneyShort(best.revenue)}
          caption={best.month ? monthWithYear(best.month) : "Sem vendas"}
          tint={theme.colors.primary}
          theme={theme}
        />
        <View
          style={{ width: 1, marginVertical: spacing.md, backgroundColor: borderColor }}
        />
        <StatPanel
          icon="trending-up-outline"
          label="Média mensal"
          value={formatMoneyShort(average)}
          caption={`Últimos ${windowMonths} meses`}
          tint={theme.colors.success}
          theme={theme}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
        }}
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={18}
          color={theme.colors.textSecondary}
        />
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ fontSize: 14 }}
        >
          Dados atualizados em tempo real
        </Typography>
      </View>
    </View>
  );
}
