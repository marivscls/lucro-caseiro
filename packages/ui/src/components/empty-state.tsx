import React from "react";
import { View, type ViewStyle } from "react-native";

import { useTheme } from "../theme-context";
import { spacing } from "../theme";
import { Typography } from "./typography";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, description, action, style }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing["3xl"],
          gap: spacing.md,
        },
        style,
      ]}
    >
      {icon}
      <Typography variant="h3" style={{ textAlign: "center" }}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          style={{ textAlign: "center", maxWidth: 280 }}
        >
          {description}
        </Typography>
      )}
      {action && <View style={{ marginTop: spacing.sm }}>{action}</View>}
    </View>
  );
}
