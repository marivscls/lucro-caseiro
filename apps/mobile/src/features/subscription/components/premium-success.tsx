import { Button, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";
import { PLAN_LABELS, PLAN_PRICING } from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

import { useProfile } from "../hooks";
import { TIER_BENEFITS } from "../plan-benefits";
import { ResponsiveOverlayModal } from "../../../shared/components/responsive-modal-surface";

interface PremiumSuccessProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

function formatPrice(value: number, period: BillingPeriod): string {
  const amount = value.toFixed(2).replace(".", ",");
  return `R$ ${amount}/${period === "annual" ? "ano" : "mês"}`;
}

// Anual expira ~1 ano à frente; mensal ~1 mês. Como o período não vem no perfil,
// inferimos pela distância da validade (limiar de 6 meses).
function inferPeriod(expiresAt: Date | null): BillingPeriod {
  if (!expiresAt) return "monthly";
  const daysLeft = (expiresAt.getTime() - Date.now()) / 86_400_000;
  return daysLeft > 180 ? "annual" : "monthly";
}

export function PremiumSuccess({ visible, onClose }: PremiumSuccessProps) {
  const { theme } = useTheme();
  const { data: profile } = useProfile();
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [visible, scale]);

  const plan = profile?.plan;
  const tier: PaidPlan | null =
    plan === "essential" || plan === "professional" ? plan : null;
  const expiresAt = profile?.planExpiresAt ? new Date(profile.planExpiresAt) : null;
  const period = inferPeriod(expiresAt);
  const benefits = tier ? TIER_BENEFITS[tier] : [];

  function Row({ label, value }: { readonly label: string; readonly value: string }) {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <Typography variant="body" color={theme.colors.textSecondary}>
          {label}
        </Typography>
        <Typography variant="bodyBold" style={{ textAlign: "right", flexShrink: 1 }}>
          {value}
        </Typography>
      </View>
    );
  }

  return (
    <ResponsiveOverlayModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale }],
            backgroundColor: theme.colors.surface,
            borderRadius: radii.xl,
            padding: spacing["2xl"],
            alignItems: "stretch",
            gap: spacing.lg,
            width: "100%",
            maxWidth: 380,
          }}
        >
          <View style={{ alignItems: "center", gap: spacing.sm }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: theme.colors.successBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="checkmark-circle" size={52} color={theme.colors.success} />
            </View>
            <Typography variant="h2" style={{ textAlign: "center" }}>
              Assinatura confirmada!
            </Typography>
            {tier && (
              <Typography
                variant="body"
                color={theme.colors.textSecondary}
                style={{ textAlign: "center" }}
              >
                Bem-vindo(a) ao plano {PLAN_LABELS[tier]}.
              </Typography>
            )}
          </View>

          {tier && (
            <View
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: radii.lg,
                padding: spacing.lg,
                gap: spacing.md,
              }}
            >
              <Row
                label="Plano"
                value={`${PLAN_LABELS[tier]} · ${period === "annual" ? "Anual" : "Mensal"}`}
              />
              <Row
                label="Valor"
                value={formatPrice(PLAN_PRICING[tier][period], period)}
              />
              {expiresAt && (
                <Row
                  label="Próxima cobrança"
                  value={expiresAt.toLocaleDateString("pt-BR")}
                />
              )}
            </View>
          )}

          {benefits.length > 0 && (
            <View style={{ gap: spacing.sm }}>
              <Typography variant="label" color={theme.colors.textSecondary}>
                O que você desbloqueou
              </Typography>
              {benefits.map((benefit) => (
                <View
                  key={benefit}
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.success}
                  />
                  <Typography variant="body" style={{ flexShrink: 1 }}>
                    {benefit}
                  </Typography>
                </View>
              ))}
            </View>
          )}

          <Button
            title="Começar a usar"
            size="lg"
            onPress={onClose}
            style={{ alignSelf: "stretch" }}
          />
        </Animated.View>
      </View>
    </ResponsiveOverlayModal>
  );
}
