import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import { Typography, useTheme, spacing, radii, type Theme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { formatMoney, formatMoneyShort, maxRevenue, monthLabel } from "../domain";
import type { MonthlyRevenue } from "../types";

const WINDOWS = [3, 6, 12] as const;
const MOBILE_CHART_HEIGHT = 180;
const DESKTOP_CHART_HEIGHT = 240;
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
  return `${monthName(key)} de ${key.split("-")[0]}`;
}

function WindowSelector({
  months,
  onChange,
}: Readonly<{
  months: number;
  onChange?: (months: number) => void;
}>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 4,
        gap: 4,
        borderRadius: radii.md + 4,
        backgroundColor: theme.colors.surface,
        ...(isDesktop ? { alignSelf: "flex-start" as const } : null),
      }}
    >
      {WINDOWS.map((value) => {
        const selected = months === value;
        return (
          <Pressable
            key={value}
            onPress={() => onChange?.(value)}
            disabled={!onChange}
            accessibilityRole="button"
            accessibilityLabel={`Últimos ${value} meses`}
            accessibilityState={{ selected, disabled: !onChange }}
            {...(Platform.OS === "web" ? { "aria-pressed": selected } : {})}
            style={({ pressed }) => ({
              flex: isDesktop ? undefined : 1,
              paddingHorizontal: isDesktop ? spacing.lg : undefined,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radii.md,
              backgroundColor: selected ? theme.colors.surfaceElevated : "transparent",
              borderWidth: 1,
              borderColor: selected ? theme.colors.border : "transparent",
              transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            <Typography
              variant={isDesktop ? "desktopBodyStrong" : "captionBold"}
              color={selected ? theme.colors.primaryStrong : theme.colors.textSecondary}
            >
              {value} meses
            </Typography>
          </Pressable>
        );
      })}
    </View>
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
        minWidth: 0,
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radii.xl,
        backgroundColor: theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radii.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${tint}14`,
        }}
      >
        <AppIcon name={icon} size={17} color={tint} />
      </View>
      <View style={{ gap: 4 }}>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ minHeight: 36 }}
        >
          {label}
        </Typography>
        <Typography
          variant="moneyLg"
          color={theme.colors.text}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={{ fontVariant: ["tabular-nums"], letterSpacing: -0.6 }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ fontSize: 11, lineHeight: 16 }}
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
  const isDesktop = useDesktopLayout();
  const CHART_HEIGHT = isDesktop ? DESKTOP_CHART_HEIGHT : MOBILE_CHART_HEIGHT;
  // Desktop: nada abaixo de 14px (eixo, meses e legendas).
  const small = isDesktop
    ? { fontSize: 14, lineHeight: 20 }
    : { fontSize: 10, lineHeight: 16 };
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const axisMax = niceCeil(maxRevenue(series));
  const total = series.reduce((acc, m) => acc + m.revenue, 0);
  const sales = series.reduce((acc, m) => acc + m.salesCount, 0);
  const lastActive =
    [...series].reverse().find((m) => m.revenue > 0) ?? series[series.length - 1];
  const focused = series.find((m) => m.month === selectedMonth) ?? lastActive;
  const focusedIndex = series.findIndex((m) => m.month === focused?.month);
  const first = series[0];
  const last = series[series.length - 1];
  const gridValues = Array.from(
    { length: STEPS + 1 },
    (_, i) => (axisMax * (STEPS - i)) / STEPS,
  );

  return (
    <View
      style={{
        gap: spacing.lg,
        padding: isDesktop ? spacing["2xl"] : spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: isDesktop ? radii.lg : radii["2xl"],
        backgroundColor: theme.colors.surfaceElevated,
      }}
    >
      <View
        style={
          isDesktop
            ? {
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "flex-start",
                gap: spacing.lg,
              }
            : undefined
        }
      >
        <View
          style={{
            gap: spacing.xs,
            flex: isDesktop ? 1 : undefined,
            flexBasis: isDesktop ? 280 : undefined,
            minWidth: 0,
          }}
        >
          <Typography
            variant={isDesktop ? "desktopBodyStrong" : "bodyBold"}
            color={theme.colors.textSecondary}
          >
            Faturamento no período
          </Typography>
          <Typography
            variant="moneyHero"
            color={theme.colors.text}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            style={{
              fontSize: 32,
              lineHeight: 42,
              letterSpacing: -1,
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatMoney(total)}
          </Typography>
          <Typography
            variant={isDesktop ? "desktopMeta" : "caption"}
            color={theme.colors.textSecondary}
          >
            {sales} venda{sales !== 1 ? "s" : ""} registrada{sales !== 1 ? "s" : ""}
            {first && last
              ? ` · ${monthLabel(first.month)}/${first.month.slice(0, 4)} – ${monthLabel(last.month)}/${last.month.slice(0, 4)}`
              : ""}
          </Typography>
        </View>
        {isDesktop ? (
          <WindowSelector months={windowMonths} onChange={onWindowChange} />
        ) : null}
      </View>
      {isDesktop ? null : (
        <WindowSelector months={windowMonths} onChange={onWindowChange} />
      )}
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: radii.full,
              backgroundColor: theme.colors.primary,
            }}
          />
          <Typography variant={isDesktop ? "desktopMeta" : "captionBold"}>
            Faturamento mensal
          </Typography>
        </View>
        <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: 8 }}>
          {total > 0 ? (
            <>
              <View style={{ width: isDesktop ? 76 : 58, height: CHART_HEIGHT }}>
                {gridValues.map((value, index) => (
                  <Typography
                    key={index}
                    variant="caption"
                    color={theme.colors.textSecondary}
                    numberOfLines={1}
                    style={{
                      position: "absolute",
                      top: (CHART_HEIGHT * index) / STEPS - (isDesktop ? 10 : 8),
                      ...small,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {formatMoneyShort(value)}
                  </Typography>
                ))}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ height: CHART_HEIGHT }}>
                  {gridValues.map((_, index) => (
                    <View
                      key={index}
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: (CHART_HEIGHT * index) / STEPS,
                        borderTopWidth: 1,
                        borderStyle: index === STEPS ? "solid" : "dashed",
                        borderColor: theme.colors.border,
                        opacity: index === STEPS ? 1 : 0.6,
                      }}
                    />
                  ))}
                  <View style={{ flexDirection: "row", height: CHART_HEIGHT }}>
                    {series.map((month) => {
                      const selected = month.month === focused?.month;
                      return (
                        <Pressable
                          key={month.month}
                          onPress={() => setSelectedMonth(month.month)}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          {...(Platform.OS === "web" ? { "aria-pressed": selected } : {})}
                          accessibilityLabel={`${monthWithYear(month.month)}: ${formatMoney(month.revenue)}, ${month.salesCount} vendas`}
                          accessibilityHint="Mostra os detalhes deste mês abaixo do gráfico"
                          style={({ pressed }) => ({
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "flex-end",
                            backgroundColor: selected
                              ? `${theme.colors.primary}09`
                              : "transparent",
                            borderTopLeftRadius: 6,
                            borderTopRightRadius: 6,
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          {month.revenue > 0 ? (
                            <View
                              style={{
                                width: "66%",
                                maxWidth: 44,
                                height: Math.max(
                                  3,
                                  (month.revenue / axisMax) * CHART_HEIGHT,
                                ),
                                borderTopLeftRadius: 5,
                                borderTopRightRadius: 5,
                                backgroundColor: selected
                                  ? theme.colors.primaryStrong
                                  : `${theme.colors.primary}85`,
                              }}
                            />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <View style={{ flexDirection: "row", marginTop: spacing.sm }}>
                  {series.map((month, index) => {
                    const selected = month.month === focused?.month;
                    const showLabel =
                      isDesktop ||
                      series.length < 12 ||
                      selected ||
                      (index % 2 === 1 && Math.abs(index - focusedIndex) > 1);
                    return (
                      <View key={month.month} style={{ flex: 1, alignItems: "center" }}>
                        <Typography
                          variant="caption"
                          numberOfLines={1}
                          color={
                            selected
                              ? theme.colors.primaryStrong
                              : theme.colors.textSecondary
                          }
                          style={{
                            width: isDesktop ? 44 : 32,
                            maxWidth: isDesktop ? 44 : 32,
                            textAlign: "center",
                            ...small,
                            fontFamily: selected ? "Manrope_700Bold" : undefined,
                          }}
                        >
                          {showLabel ? monthLabel(month.month) : ""}
                        </Typography>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>
      {focused ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            borderTopWidth: 1,
            borderColor: theme.colors.border,
            paddingTop: spacing.md,
            gap: spacing.sm,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.sm,
            }}
          >
            <View style={{ gap: 2 }}>
              <Typography
                variant={isDesktop ? "desktopBodyStrong" : "captionBold"}
                numberOfLines={1}
              >
                {monthWithYear(focused.month)}
              </Typography>
              <Typography
                variant={isDesktop ? "desktopMeta" : "caption"}
                color={theme.colors.textSecondary}
              >
                {focused.salesCount} venda{focused.salesCount !== 1 ? "s" : ""}
              </Typography>
            </View>
            <Typography
              variant="bodyBold"
              color={theme.colors.primaryStrong}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{
                fontSize: 20,
                lineHeight: 26,
                fontVariant: ["tabular-nums"],
                flexShrink: 0,
              }}
            >
              {formatMoney(focused.revenue)}
            </Typography>
          </View>
          <Typography
            variant={isDesktop ? "desktopMeta" : "caption"}
            color={theme.colors.textSecondary}
            style={isDesktop ? undefined : { fontSize: 11 }}
          >
            {isDesktop
              ? "Clique numa barra para ver cada mês"
              : "Toque no gráfico para explorar cada mês"}
          </Typography>
        </View>
      ) : (
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Sem faturamento neste período.
        </Typography>
      )}
    </View>
  );
}
