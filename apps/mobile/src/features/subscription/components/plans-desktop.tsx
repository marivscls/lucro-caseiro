/**
 * Planos no desktop (web >= 1024px): os planos lado a lado com os benefícios
 * de cada um, e o pagamento numa lateral fixa. Estado e regras continuam em
 * `app/plans.tsx`; aqui só a apresentação.
 */
import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";
import { Button, Typography, fonts, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import {
  DesktopGrid,
  DesktopSplit,
  desktopCardStyle,
} from "../../../shared/layout/desktop-page";

export type PlanCardData = Readonly<{
  plan: PaidPlan;
  label: string;
  price: string;
  periodLabel: string;
  heading: string;
  features: readonly string[];
  current: boolean;
}>;

export type UsageItem = Readonly<{ label: string; cur: number; max: number }>;

function FeatureList({
  wide,
  children,
}: Readonly<{ wide: boolean; children: React.ReactNode }>) {
  if (!wide) return <View style={{ gap: spacing.md }}>{children}</View>;
  return (
    <DesktopGrid minColumnWidth={260} maxColumns={2} gap={spacing.md}>
      {children}
    </DesktopGrid>
  );
}

function PlanCard({
  data,
  selected,
  disabled,
  wide,
  onSelect,
}: Readonly<{
  data: PlanCardData;
  selected: boolean;
  disabled: boolean;
  wide: boolean;
  onSelect: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver plano ${data.label}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onSelect}
      style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
        desktopCardStyle(theme, { selected, accent: theme.colors.primaryStrong }),
        { gap: spacing.lg, height: "100%" },
        !selected && hovered ? { borderColor: theme.colors.textSecondary } : null,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Typography variant="desktopCardTitle" style={{ flex: 1 }}>
          {data.label}
        </Typography>
        {data.current ? (
          <View
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: 2,
              borderRadius: radii.full,
              backgroundColor: theme.colors.successBg,
            }}
          >
            <Typography
              variant="desktopMeta"
              color={theme.colors.success}
              style={{ fontFamily: fonts.bold }}
            >
              Seu plano
            </Typography>
          </View>
        ) : null}
        <AppIcon
          name={selected ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={selected ? theme.colors.primaryStrong : theme.colors.textSecondary}
        />
      </View>
      <View style={{ gap: 2 }}>
        <Typography variant="desktopTotal">{data.price}</Typography>
        <Typography variant="desktopMeta">{data.periodLabel}</Typography>
      </View>
      <View
        style={{
          gap: spacing.md,
          paddingTop: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        <Typography variant="desktopBodyStrong">{data.heading}</Typography>
        {/* Um plano só (assinante) ocupa a coluna: benefícios em duas colunas. */}
        <FeatureList wide={wide}>
          {data.features.map((feature) => (
            <View
              key={feature}
              style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}
            >
              <AppIcon
                name="checkmark"
                size={18}
                color={theme.colors.success}
                style={{ marginTop: 3 }}
              />
              <Typography
                variant="desktopBody"
                color={theme.colors.text}
                style={{ flex: 1 }}
              >
                {feature}
              </Typography>
            </View>
          ))}
        </FeatureList>
      </View>
    </Pressable>
  );
}

function PeriodToggle({
  period,
  disabled,
  onChange,
}: Readonly<{
  period: BillingPeriod;
  disabled: boolean;
  onChange: (period: BillingPeriod) => void;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 4,
        gap: 4,
        backgroundColor: theme.colors.surface,
        borderRadius: radii.md,
      }}
    >
      {(["monthly", "annual"] as const).map((option) => {
        const selected = period === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={option === "annual" ? "Anual" : "Mensal"}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radii.sm,
              backgroundColor: selected ? theme.colors.surfaceElevated : "transparent",
              borderWidth: 1,
              borderColor: selected ? theme.colors.border : "transparent",
            }}
          >
            <Typography
              variant="desktopBodyStrong"
              color={selected ? theme.colors.text : theme.colors.textSecondary}
            >
              {option === "annual" ? "Anual" : "Mensal"}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Cartão de uso do plano gratuito: rótulo e número em 16px, barra de 8px. */
function UsageCard({ items }: Readonly<{ items: readonly UsageItem[] }>) {
  const { theme } = useTheme();
  return (
    <View style={[desktopCardStyle(theme), { gap: spacing.lg }]}>
      <View style={{ gap: spacing.xs }}>
        <Typography variant="desktopCardTitle" accessibilityRole="header">
          Seu uso atual
        </Typography>
        <Typography variant="desktopMeta">Limites do plano gratuito</Typography>
      </View>
      <DesktopGrid minColumnWidth={140} maxColumns={4} gap={spacing["2xl"]}>
        {items.map((item) => {
          const pct = Math.max(0, Math.min((item.cur / item.max) * 100, 100));
          const near = pct >= 80;
          return (
            <View key={item.label} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <Typography variant="desktopBody" style={{ flex: 1 }}>
                  {item.label}
                </Typography>
                <Typography
                  variant="desktopBodyStrong"
                  color={near ? theme.colors.alert : theme.colors.text}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {item.cur}/{item.max}
                </Typography>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={item.label}
                accessibilityValue={{ min: 0, max: item.max, now: item.cur }}
                style={{
                  height: 8,
                  borderRadius: radii.full,
                  backgroundColor: theme.colors.surface,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 8,
                    width: `${pct}%`,
                    borderRadius: radii.full,
                    backgroundColor: near ? theme.colors.alert : theme.colors.primary,
                  }}
                />
              </View>
            </View>
          );
        })}
      </DesktopGrid>
    </View>
  );
}

export function PlansDesktop({
  cards,
  selectedPlan,
  onSelect,
  isUpgrade,
  period,
  onPeriodChange,
  chargeLine,
  chargeHint,
  checkoutLoading,
  onContinue,
  usage,
  onCancel,
}: Readonly<{
  cards: readonly PlanCardData[];
  selectedPlan: PaidPlan;
  onSelect: (plan: PaidPlan) => void;
  isUpgrade: boolean;
  period: BillingPeriod;
  onPeriodChange: (period: BillingPeriod) => void;
  chargeLine: string;
  chargeHint: string;
  checkoutLoading: boolean;
  onContinue: () => void;
  usage: readonly UsageItem[] | null;
  onCancel: (() => void) | null;
}>) {
  const { theme } = useTheme();
  const selected = cards.find((card) => card.plan === selectedPlan);
  const aside = (
    <View style={[desktopCardStyle(theme), { gap: spacing.lg }]}>
      <View style={{ gap: spacing.xs }}>
        <Typography variant="desktopMeta">Plano escolhido</Typography>
        <Typography variant="desktopCardTitle" accessibilityRole="header">
          {selected?.label ?? ""}
        </Typography>
      </View>
      {isUpgrade ? (
        <>
          <PeriodToggle
            period={period}
            disabled={checkoutLoading}
            onChange={onPeriodChange}
          />
          <View style={{ gap: spacing.xs }} accessibilityLiveRegion="polite">
            <Typography variant="desktopBodyStrong">{chargeLine}</Typography>
            <Typography variant="desktopMeta">{chargeHint}</Typography>
          </View>
          <Button
            title={checkoutLoading ? "Abrindo pagamento..." : "Continuar para pagamento"}
            size="lg"
            // Em 1024 px a lateral é estreita: o texto quebra em vez de cortar.
            loading={checkoutLoading}
            accessibilityLabel={
              checkoutLoading ? "Abrindo pagamento..." : "Continuar para pagamento"
            }
            accessibilityState={{ busy: checkoutLoading, disabled: checkoutLoading }}
            onPress={onContinue}
            style={{ width: "100%", minHeight: 48 }}
          />
        </>
      ) : (
        <View
          style={{
            minHeight: 48,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.colors.surface,
            borderRadius: radii.md,
          }}
        >
          <Typography variant="desktopBodyStrong">Plano ativo</Typography>
        </View>
      )}
      {onCancel ? (
        <Button
          title="Cancelar assinatura"
          variant="outline"
          onPress={onCancel}
          style={{ width: "100%", minHeight: 48 }}
        />
      ) : null}
    </View>
  );

  return (
    <DesktopSplit aside={aside}>
      <DesktopGrid
        minColumnWidth={260}
        maxColumns={cards.length > 1 ? 2 : 1}
        gap={spacing["2xl"]}
      >
        {cards.map((card) => (
          <PlanCard
            key={card.plan}
            data={card}
            selected={card.plan === selectedPlan}
            disabled={checkoutLoading}
            wide={cards.length === 1}
            onSelect={() => onSelect(card.plan)}
          />
        ))}
      </DesktopGrid>
      {usage && usage.length > 0 ? <UsageCard items={usage} /> : null}
    </DesktopSplit>
  );
}
