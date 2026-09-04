import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import {
  Typography,
  useTheme,
  fontSizes,
  spacing,
  radii,
  type Theme,
} from "@lucro-caseiro/ui";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";

import { formatMoney, formatMoneyShort, maxRevenue, monthLabel } from "../domain";
import type { MonthlyRevenue } from "../types";

const WINDOWS = [3, 6, 12] as const;
const CHART_HEIGHT = 220;
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

export function monthWithYear(key: string): string {
  const [year] = key.split("-");
  return `${monthName(key)} de ${year}`;
}

/** Com 12 meses não cabe tudo: mostra mês sim, mês não, sempre incluindo o mais recente. */
function chartMonthLabel(key: string, months: number, index: number): string {
  if (months >= 12 && index % 2 === 0) return "";
  return monthLabel(key);
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
        minHeight: 40,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <AppIcon
        name="calendar-clear-outline"
        size={14}
        color={theme.colors.textSecondary}
      />
      <Typography
        variant="bodyBold"
        color={theme.colors.text}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={{ fontSize: 12, textAlign: "center" }}
      >
        Últimos {months} meses
      </Typography>
      <AppIcon name="chevron-down" size={14} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

export function StatPanel({
  icon,
  label,
  value,
  caption,
  tint,
  theme,
}: Readonly<{
  icon: AppIconName;
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
        alignItems: "flex-start",
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radii.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${tint}18`,
          borderWidth: 1,
          borderColor: `${tint}30`,
        }}
      >
        <AppIcon name={icon} size={18} color={tint} />
      </View>
      <View style={{ width: "100%", gap: 2 }}>
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          numberOfLines={2}
          style={{ fontSize: 12, lineHeight: 15 }}
        >
          {label}
        </Typography>
        <Typography
          variant="moneyLg"
          color={tint}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.62}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ fontSize: 12 }}
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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const axisMax = niceCeil(maxRevenue(series));
  const gridColor = theme.colors.border;
  const labelColor = theme.colors.textSecondary;
  const total = series.reduce((acc, m) => acc + m.revenue, 0);
  const lastActive =
    [...series].reverse().find((m) => m.revenue > 0) ?? series[series.length - 1];
  const focused = selectedMonth
    ? (series.find((m) => m.month === selectedMonth) ?? lastActive)
    : lastActive;
  const focusedIndex = series.findIndex((m) => m.month === focused?.month);
  const showTooltip = Boolean(focused && focused.revenue > 0);
  const tooltipOnRight = focusedIndex >= Math.ceil((series.length * 2) / 3);
  const delta = periodDelta(series);
  const deltaColor =
    delta == null || delta >= 0 ? theme.colors.success : theme.colors.alert;
  const panelBg = theme.colors.surfaceElevated;
  const insetBg = theme.colors.surface;
  const borderColor = theme.colors.border;
  const gridValues = Array.from({ length: STEPS + 1 }, (_, i) =>
    Math.round((axisMax * (STEPS - i)) / STEPS),
  );

  const barAnimations = useRef<Animated.Value[]>([]).current;
  const fadeAnimations = useRef<Animated.Value[]>([]).current;
  while (barAnimations.length < series.length) {
    barAnimations.push(new Animated.Value(0));
    fadeAnimations.push(new Animated.Value(0));
  }
  if (barAnimations.length > series.length) {
    barAnimations.splice(series.length);
    fadeAnimations.splice(series.length);
  }

  useEffect(() => {
    barAnimations.forEach((anim) => anim.setValue(0));
    fadeAnimations.forEach((anim) => anim.setValue(0));

    const barAnims = series.map((m, i) => {
      const ratio = axisMax > 0 ? m.revenue / axisMax : 0;
      const targetHeight =
        m.revenue > 0 ? Math.max(7, ratio * (CHART_HEIGHT - BAR_HEADROOM)) : 0;
      return Animated.timing(barAnimations[i], {
        toValue: targetHeight,
        duration: 500,
        delay: i * 40,
        useNativeDriver: false,
      });
    });

    const fadeAnims = series.map((_, i) =>
      Animated.timing(fadeAnimations[i], {
        toValue: 1,
        duration: 400,
        delay: i * 40 + 100,
        useNativeDriver: false,
      }),
    );

    Animated.parallel([
      Animated.stagger(30, barAnims),
      Animated.stagger(30, fadeAnims),
    ]).start();
  }, [series, axisMax]);

  return (
    <View
      style={{
        gap: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor,
        borderRadius: radii["2xl"],
        backgroundColor: panelBg,
      }}
    >
      {/* Header compacto */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Typography
            variant="label"
            color={theme.colors.primaryLight}
            style={{ fontSize: fontSizes.xs, letterSpacing: 0.5 }}
          >
            EVOLUÇÃO DO FATURAMENTO
          </Typography>
          <Typography
            variant="moneyHero"
            color={theme.colors.text}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.58}
          >
            {formatMoney(total)}
          </Typography>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            {delta !== null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <AppIcon
                  name={delta >= 0 ? "arrow-up" : "arrow-down"}
                  size={13}
                  color={deltaColor}
                />
                <Typography variant="body" color={deltaColor} style={{ fontSize: 13 }}>
                  {Math.abs(delta).toFixed(1).replace(".", ",")}%
                </Typography>
              </View>
            )}
            <Typography
              variant="caption"
              color={theme.colors.textSecondary}
              style={{ fontSize: 13 }}
            >
              vs. período anterior
            </Typography>
          </View>
        </View>
        <CompactWindowSelector months={windowMonths} onChange={onWindowChange} />
      </View>

      {/* Chart area */}
      <View
        style={{
          overflow: "hidden",
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor,
          backgroundColor: insetBg,
          padding: spacing.md,
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {/* Y-axis */}
          <View
            style={{ width: 56, height: CHART_HEIGHT, justifyContent: "space-between" }}
          >
            {gridValues.map((v) => (
              <Typography
                key={v}
                variant="caption"
                color={labelColor}
                numberOfLines={1}
                style={{ fontSize: 11 }}
              >
                {formatMoneyShort(v)}
              </Typography>
            ))}
          </View>

          {/* Chart body */}
          <View style={{ flex: 1 }}>
            <View style={{ height: CHART_HEIGHT }}>
              {/* Grid lines */}
              {gridValues.map((v, i) => (
                <View
                  key={v}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: (CHART_HEIGHT / STEPS) * i,
                    borderTopWidth: 1,
                    borderStyle: i === STEPS ? "solid" : "dashed",
                    borderColor: gridColor,
                  }}
                />
              ))}

              {showTooltip && focused ? (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 8,
                    zIndex: 10,
                    minWidth: 128,
                    maxWidth: 168,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: panelBg,
                    gap: 2,
                    shadowColor: theme.colors.text,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                    ...(tooltipOnRight ? { right: 4 } : { left: 4 }),
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
                      numberOfLines={1}
                      style={{ fontSize: 13 }}
                    >
                      {monthName(focused.month)}
                    </Typography>
                  </View>
                  <Typography
                    variant="bodyBold"
                    color={theme.colors.primary}
                    numberOfLines={1}
                    style={{ fontSize: 15, flexShrink: 0 }}
                  >
                    {formatMoneyShort(focused.revenue).replace(/^R\$ /, "R$\u00A0")}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={theme.colors.textSecondary}
                    numberOfLines={1}
                    style={{ fontSize: 11 }}
                  >
                    {focused.salesCount} venda{focused.salesCount !== 1 ? "s" : ""}
                  </Typography>
                </View>
              ) : null}

              {/* Bars */}
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  flexDirection: "row",
                  alignItems: "flex-end",
                  gap: 3,
                }}
              >
                {series.map((m, index) => {
                  const isFocused = m.month === focused.month;
                  const isEmpty = m.revenue <= 0;
                  const barHeight = barAnimations[index];

                  return (
                    <Pressable
                      key={m.month}
                      onPress={() => setSelectedMonth(isFocused ? null : m.month)}
                      accessibilityRole="button"
                      accessibilityLabel={`${monthName(m.month)}: ${formatMoneyShort(m.revenue)}`}
                      style={{
                        flex: 1,
                        height: CHART_HEIGHT,
                        alignItems: "center",
                        justifyContent: "flex-end",
                      }}
                    >
                      {/* Bar */}
                      {isEmpty ? null : (
                        <Animated.View
                          style={{
                            width: "85%",
                            height: barHeight,
                            borderTopLeftRadius: radii.md,
                            borderTopRightRadius: radii.md,
                            backgroundColor: isFocused
                              ? theme.colors.primary
                              : `${theme.colors.primary}99`,
                            borderWidth: 1,
                            borderColor: isFocused
                              ? theme.colors.primaryLight
                              : `${theme.colors.primaryLight}60`,
                            opacity: fadeAnimations[index],
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 12,
                              backgroundColor: `${theme.colors.primaryLight}55`,
                              borderTopLeftRadius: radii.md,
                              borderTopRightRadius: radii.md,
                            }}
                          />
                        </Animated.View>
                      )}

                      {isFocused && !isEmpty ? (
                        <View
                          style={{
                            position: "absolute",
                            bottom:
                              (axisMax > 0
                                ? Math.max(
                                    7,
                                    (m.revenue / axisMax) * (CHART_HEIGHT - BAR_HEADROOM),
                                  )
                                : 0) - 5,
                            width: 10,
                            height: 10,
                            borderRadius: radii.full,
                            backgroundColor: theme.colors.primary,
                            borderWidth: 2.5,
                            borderColor: theme.colors.surfaceElevated,
                          }}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* X-axis labels */}
            <View style={{ flexDirection: "row", gap: 0, marginTop: spacing.sm }}>
              {series.map((m, index) => {
                const isFocused = m.month === focused.month;
                return (
                  <Typography
                    key={m.month}
                    variant="caption"
                    color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontSize: 11,
                      lineHeight: 13,
                      fontFamily: isFocused ? "Manrope_600SemiBold" : undefined,
                    }}
                  >
                    {chartMonthLabel(m.month, windowMonths, index)}
                  </Typography>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
