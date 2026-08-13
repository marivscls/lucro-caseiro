import React from "react";
import {
  Platform,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../theme-context";
import { fonts, fontSizes, radii, spacing } from "../theme";

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
  const webAutofillSurface: TextStyle | undefined =
    Platform.OS === "web"
      ? { boxShadow: `inset 0 0 0 1000px ${theme.colors.surfaceElevated}` }
      : undefined;

  return (
    <View style={[{ gap: spacing.sm }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: fontSizes.sm,
            color: theme.colors.textSecondary,
            fontFamily: fonts.semiBold,
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
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
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
              // Denso sem sacrificar o alvo de toque recomendado.
              height: 48,
              fontSize: fontSizes.md,
              fontFamily: fonts.regular,
              color: theme.colors.text,
            },
            webAutofillSurface,
            style,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Text
          style={{
            fontSize: fontSizes.sm,
            fontFamily: fonts.regular,
            color: theme.colors.alert,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
