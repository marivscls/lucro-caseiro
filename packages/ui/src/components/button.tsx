import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  type PressableProps,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../theme-context";
import { useReducedMotion } from "../use-reduced-motion";
import { colors, fonts, fontSizes, radii, spacing } from "../theme";

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Alturas distintas por tamanho; minimo de 44px de alvo de toque (publico idoso).
const sizeStyles: Record<ButtonSize, { height: number; fontSize: number; px: number }> =
  {
    sm: { height: 44, fontSize: fontSizes.sm, px: spacing.lg },
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
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  const animateTo = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();

  const variants: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    // Fundos cheios usam tons AA (texto branco >= 4.5:1); `primary` de marca
    // fica para areas grandes sem texto por cima.
    primary: { bg: theme.colors.primaryInteractive, text: theme.colors.textOnPrimary },
    secondary: { bg: theme.colors.surface, text: theme.colors.text },
    outline: { bg: "transparent", text: theme.colors.primaryStrong, border: theme.colors.primaryStrong },
    ghost: { bg: "transparent", text: theme.colors.textSecondary },
    success: { bg: colors.successStrong, text: theme.colors.textOnPrimary },
    premium: { bg: "#8F6620", text: theme.colors.textOnPrimary },
  };

  const v = variants[variant];

  return (
    <AnimatedPressable
      disabled={isDisabled}
      onPressIn={(e) => {
        if (!reduced && !isDisabled) animateTo(0.97);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) animateTo(1);
        onPressOut?.(e);
      }}
      style={[
        {
          height: s.height,
          paddingHorizontal: s.px,
          backgroundColor: v.bg,
          borderRadius: radii.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: isDisabled ? 0.5 : 1,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
        },
        style,
        { transform: [{ scale }] },
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
              fontFamily: fonts.bold,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
