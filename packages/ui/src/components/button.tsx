import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../theme-context";
import { fontSizes, radii, spacing } from "../theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "success" | "premium";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const sizeStyles: Record<ButtonSize, { height: number; fontSize: number; px: number }> =
  {
    sm: { height: 40, fontSize: fontSizes.sm, px: spacing.lg },
    md: { height: 48, fontSize: fontSizes.md, px: spacing.xl },
    lg: { height: 56, fontSize: fontSizes.lg, px: spacing["2xl"] },
  };

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  const variants: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    primary: { bg: theme.colors.primary, text: theme.colors.textOnPrimary },
    secondary: { bg: theme.colors.surface, text: theme.colors.text },
    outline: { bg: "transparent", text: theme.colors.primary, border: theme.colors.primary },
    ghost: { bg: "transparent", text: theme.colors.textSecondary },
    success: { bg: theme.colors.success, text: "#FFFFFF" },
    premium: { bg: theme.colors.premium, text: "#FFFFFF" },
  };

  const v = variants[variant];

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          height: s.height,
          paddingHorizontal: s.px,
          backgroundColor: v.bg,
          borderRadius: radii.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          {icon}
          <Text
            style={{
              color: v.text,
              fontSize: s.fontSize,
              fontWeight: "600",
            }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
