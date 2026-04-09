import React from "react";
import { Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";

import { useTheme } from "../theme-context";
import { fontSizes, radii, spacing } from "../theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  icon,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const { theme } = useTheme();

  return (
    <View style={[{ gap: spacing.sm }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: fontSizes.sm,
            fontWeight: "500",
            color: theme.colors.textSecondary,
            fontFamily: "serif",
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: radii.md,
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        }}
      >
        {icon}
        <TextInput
          placeholderTextColor={theme.colors.textSecondary + "80"}
          style={[
            {
              flex: 1,
              height: 52,
              fontSize: fontSizes.md,
              color: theme.colors.text,
            },
            style,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Text style={{ fontSize: fontSizes.sm, color: theme.colors.alert }}>
          {error}
        </Text>
      )}
    </View>
  );
}
