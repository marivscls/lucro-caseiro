import { Card, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

import { useLimits } from "../hooks";

interface LimitBannerProps {
  readonly resource: "sales" | "clients" | "recipes" | "packaging";
  readonly onUpgrade?: () => void;
}

const LABELS: Record<string, { current: string; max: string }> = {
  sales: { current: "currentSalesThisMonth", max: "maxSalesPerMonth" },
  clients: { current: "currentClients", max: "maxClients" },
  recipes: { current: "currentRecipes", max: "maxRecipes" },
  packaging: { current: "currentPackaging", max: "maxPackaging" },
};

const RESOURCE_NAMES: Record<string, string> = {
  sales: "vendas este mes",
  clients: "clientes",
  recipes: "receitas",
  packaging: "embalagens",
};

export function LimitBanner({ resource, onUpgrade }: LimitBannerProps) {
  const { theme } = useTheme();
  const { data: limits } = useLimits();

  if (!limits) return null;

  const label = LABELS[resource];
  const current = limits[label.current as keyof typeof limits];
  const max = limits[label.max as keyof typeof limits];

  if (!isFinite(max)) return null;

  const percentage = Math.min((current / max) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  if (!isNearLimit) return null;

  const bannerBg = isAtLimit ? theme.colors.alertBg : theme.colors.premiumBg;
  const bannerAccent = isAtLimit ? theme.colors.alert : theme.colors.premium;

  return (
    <Pressable onPress={onUpgrade}>
      <Card
        style={{
          backgroundColor: bannerBg,
        }}
      >
        <View style={{ gap: 6 }}>
          <Typography variant="h3" color={bannerAccent}>
            {isAtLimit ? "Limite atingido!" : "Quase no limite"}
          </Typography>
          <Typography variant="body" color={bannerAccent}>
            {current}/{max} {RESOURCE_NAMES[resource]}
            {isAtLimit
              ? ". Assine o Premium para continuar."
              : ". Considere assinar o Premium."}
          </Typography>

          {/* Progress bar */}
          <View
            style={{
              height: 6,
              backgroundColor: theme.colors.surface,
              borderRadius: 3,
              marginTop: 4,
            }}
          >
            <View
              style={{
                height: 6,
                width: `${percentage}%`,
                backgroundColor: bannerAccent,
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
