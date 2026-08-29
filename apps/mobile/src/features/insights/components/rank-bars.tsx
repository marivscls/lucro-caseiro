import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

export interface RankRow {
  key: string;
  label: string;
  caption: string;
  value: number;
}

const MEDALS = ["🥇", "🥈", "🥉"] as const;

/** Ranking com medalha/posição + barra de preenchimento horizontal. */
export function RankBars({
  rows,
  color,
  onRowPress,
}: Readonly<{
  rows: RankRow[];
  color: string;
  onRowPress?: (row: RankRow) => void;
}>) {
  const { theme } = useTheme();
  const max = Math.max(1, ...rows.map((r) => r.value));
  const track = theme.colors.surface;

  return (
    <View style={{ gap: spacing.lg }}>
      {rows.map((row, index) => {
        const ratio = Math.max(0.06, row.value / max);
        const medal = index < 3 ? MEDALS[index] : null;
        const isTop1 = index === 0;

        return (
          <Pressable
            key={row.key}
            onPress={() => onRowPress?.(row)}
            accessibilityRole={onRowPress ? "button" : "text"}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            {/* Rank badge */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radii.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: medal ? `${color}20` : track,
                borderWidth: isTop1 ? 2 : 0,
                borderColor: isTop1 ? `${color}50` : "transparent",
              }}
            >
              {medal ? (
                <Typography variant="h3" style={{ fontSize: 18 }}>
                  {medal}
                </Typography>
              ) : (
                <Typography
                  variant="bodyBold"
                  color={theme.colors.textSecondary}
                  style={{ fontSize: 14 }}
                >
                  {index + 1}
                </Typography>
              )}
            </View>

            {/* Label + bar */}
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
                <Typography
                  variant="bodyBold"
                  color={isTop1 ? color : theme.colors.textSecondary}
                  style={{ fontSize: 15 }}
                >
                  {row.caption}
                </Typography>
              </View>
              <View
                style={{
                  height: 12,
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
                    overflow: "hidden",
                  }}
                >
                  {/* Simulated gradient highlight */}
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "45%",
                      backgroundColor: "rgba(255,255,255,0.22)",
                      borderTopLeftRadius: radii.full,
                      borderTopRightRadius: radii.full,
                    }}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
