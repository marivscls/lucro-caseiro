import type { Material } from "@lucro-caseiro/contracts";
import {
  Card,
  Typography,
  useTheme,
  spacing,
  radii,
  type Theme,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

import { formatCost, stockBadge, type StockTone } from "../domain";
import { useAdjustMaterial } from "../hooks";

interface MaterialCardProps {
  readonly material: Material;
  readonly onPress?: () => void;
}

function toneColors(theme: Theme, tone: StockTone): { bg: string; fg: string } {
  if (tone === "warn") return { bg: theme.colors.premiumBg, fg: theme.colors.premium };
  if (tone === "danger") return { bg: theme.colors.alertBg, fg: theme.colors.alert };
  return { bg: theme.colors.successBg, fg: theme.colors.success };
}

export function MaterialCard({ material, onPress }: MaterialCardProps) {
  const { theme } = useTheme();
  const adjust = useAdjustMaterial();
  const badge = stockBadge(material);
  const c = toneColors(theme, badge.tone);

  const step = (delta: number) => adjust.mutate({ id: material.id, delta });

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Pressable style={{ flex: 1, gap: 4 }} onPress={onPress}>
          <Typography variant="bodyBold">{material.name}</Typography>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <View
              style={{
                backgroundColor: c.bg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radii.full,
              }}
            >
              <Typography variant="caption" color={c.fg}>
                {badge.label}
              </Typography>
            </View>
            {material.costPerUnit != null ? (
              <Typography variant="caption">
                {formatCost(material.costPerUnit, material.unit)}
              </Typography>
            ) : null}
          </View>
        </Pressable>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={() => step(-1)}
            accessibilityLabel="Diminuir 1"
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.full,
              backgroundColor: theme.colors.surfaceElevated,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="remove" size={20} color={theme.colors.text} />
          </Pressable>
          <Pressable
            onPress={() => step(1)}
            accessibilityLabel="Adicionar 1"
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.full,
              backgroundColor: theme.colors.surfaceElevated,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={20} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
