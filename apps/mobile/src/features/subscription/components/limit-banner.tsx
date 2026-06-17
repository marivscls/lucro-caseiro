import { Card, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { getBannerCopy, type LimitResource } from "../limit-copy";
import { useLimits } from "../hooks";

interface LimitBannerProps {
  readonly resource: LimitResource;
  readonly onUpgrade?: () => void;
  readonly containerStyle?: StyleProp<ViewStyle>;
}

const LABELS: Record<LimitResource, { current: string; max: string }> = {
  sales: { current: "currentSalesThisMonth", max: "maxSalesPerMonth" },
  clients: { current: "currentClients", max: "maxClients" },
  recipes: { current: "currentRecipes", max: "maxRecipes" },
  packaging: { current: "currentPackaging", max: "maxPackaging" },
  products: { current: "currentProducts", max: "maxProducts" },
};

export function LimitBanner({ resource, onUpgrade, containerStyle }: LimitBannerProps) {
  const { theme } = useTheme();
  const { data: limits } = useLimits();

  if (!limits) return null;

  const label = LABELS[resource];
  const current = limits[label.current as keyof typeof limits];
  const max = limits[label.max as keyof typeof limits];

  if (!isFinite(max)) return null;

  const remaining = max - current;
  const threshold = Math.max(1, Math.ceil(max * 0.2));

  // Só aparece na reta final (últimos ~20% do limite, no mínimo 1 restante).
  if (remaining > threshold) return null;

  const isAtLimit = current >= max;
  const percentage = Math.min((current / max) * 100, 100);
  const { title, body } = getBannerCopy(resource, remaining);

  const bannerBg = isAtLimit ? theme.colors.alertBg : theme.colors.premiumBg;
  const bannerAccent = isAtLimit ? theme.colors.alert : theme.colors.premium;

  return (
    <Pressable onPress={onUpgrade} style={containerStyle}>
      <Card
        style={{
          backgroundColor: bannerBg,
        }}
      >
        <View style={{ gap: 6 }}>
          <Typography variant="h3" color={bannerAccent}>
            {title}
          </Typography>
          <Typography variant="body" color={bannerAccent}>
            {body}
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
