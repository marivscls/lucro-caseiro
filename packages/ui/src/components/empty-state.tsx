import React from "react";
import { Text, View, type ViewStyle } from "react-native";

import { useTheme } from "../theme-context";
import { fonts, fontSizes, spacing } from "../theme";

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
      <Text
        style={{
          fontSize: fontSizes.xl,
          fontFamily: fonts.display,
          lineHeight: 28,
          color: theme.colors.text,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            fontSize: fontSizes.md,
            fontFamily: fonts.regular,
            lineHeight: 24,
            color: theme.colors.textSecondary,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          {description}
        </Text>
      )}
      {action && <View style={{ marginTop: spacing.sm }}>{action}</View>}
    </View>
  );
}
