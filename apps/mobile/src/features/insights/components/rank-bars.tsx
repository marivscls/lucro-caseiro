import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

export interface RankRow {
  key: string;
  label: string;
  caption: string;
  value: number;
}

/** Ranking com barra de preenchimento horizontal (top produtos / clientes). */
export function RankBars({ rows, color }: Readonly<{ rows: RankRow[]; color: string }>) {
  const { theme } = useTheme();
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <View style={{ gap: spacing.md }}>
      {rows.map((row, index) => {
        const ratio = Math.max(0.06, row.value / max);
        return (
          <View key={row.key} style={{ gap: spacing.xs }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <Typography variant="body" style={{ flex: 1 }} numberOfLines={1}>
                {index + 1}. {row.label}
              </Typography>
              <Typography variant="bodyBold" color={color}>
                {row.caption}
              </Typography>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: radii.full,
                backgroundColor: theme.colors.surfaceElevated,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${ratio * 100}%`,
                  height: "100%",
                  borderRadius: radii.full,
                  backgroundColor: color,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
