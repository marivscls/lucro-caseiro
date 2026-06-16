import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import React from "react";
import { Text, View } from "react-native";

export interface RankRow {
  key: string;
  label: string;
  caption: string;
  value: number;
}

const MEDALS = ["🥇", "🥈", "🥉"] as const;

/** Ranking com medalha/posição + barra de preenchimento horizontal. */
export function RankBars({ rows, color }: Readonly<{ rows: RankRow[]; color: string }>) {
  const { theme } = useTheme();
  const max = Math.max(1, ...rows.map((r) => r.value));
  const track = theme.mode === "dark" ? "rgba(255,255,255,0.08)" : theme.colors.surface;

  return (
    <View style={{ gap: spacing.lg }}>
      {rows.map((row, index) => {
        const ratio = Math.max(0.06, row.value / max);
        const medal = index < 3 ? MEDALS[index] : null;
        return (
          <View
            key={row.key}
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            {/* Medalha (top 3) ou número da posição */}
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: radii.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: medal ? `${color}24` : track,
              }}
            >
              {medal ? (
                <Text style={{ fontSize: 18 }}>{medal}</Text>
              ) : (
                <Typography variant="bodyBold" color={theme.colors.textSecondary}>
                  {index + 1}
                </Typography>
              )}
            </View>

            <View style={{ flex: 1, gap: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Typography
                  variant="bodyBold"
                  color={theme.colors.text}
                  style={{ flex: 1, fontSize: 15 }}
                  numberOfLines={1}
                >
                  {row.label}
                </Typography>
                <Typography variant="bodyBold" color={color} style={{ fontSize: 15 }}>
                  {row.caption}
                </Typography>
              </View>
              <View
                style={{
                  height: 10,
                  borderRadius: radii.full,
                  backgroundColor: track,
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
          </View>
        );
      })}
    </View>
  );
}
