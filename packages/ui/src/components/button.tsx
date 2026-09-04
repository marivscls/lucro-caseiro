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
import { fonts, fontSizes, radii, spacing } from "../theme";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "text"
  | "success"
  | "successOutline"
  | "premium";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  titleLines?: 1 | 2;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  compact?: boolean;
  /** When false, the label keeps the size of `size` instead of shrinking to fit. */
  fitTitle?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Alturas distintas por tamanho; minimo de 44px de alvo de toque (publico idoso).
const sizeStyles: Record<
  ButtonSize,
  { minHeight: number; fontSize: number; px: number }
> = {
  sm: { minHeight: 40, fontSize: fontSizes.xs, px: spacing.md },
  md: { minHeight: 44, fontSize: fontSizes.sm, px: spacing.lg },
  lg: { minHeight: 48, fontSize: fontSizes.md, px: spacing.xl },
};

export function Button({
  title,
  titleLines = 1,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  compact = false,
  fitTitle = true,
  disabled,
  style,
  hitSlop,
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
    // Fundos cheios usam os tons AA do tema (rotulo >= 4.5:1 nos dois modos);
    // `primary` de marca fica para areas grandes sem texto por cima.
    primary: { bg: theme.colors.primaryInteractive, text: theme.colors.textOnPrimary },
    secondary: { bg: theme.colors.primaryBg, text: theme.colors.primaryStrong },
    outline: {
      bg: "transparent",
      text: theme.colors.primaryStrong,
      border: theme.colors.border,
    },
    ghost: { bg: "transparent", text: theme.colors.textSecondary },
    text: { bg: "transparent", text: theme.colors.primaryStrong },
    success: { bg: theme.colors.success, text: theme.colors.textOnPrimary },
    successOutline: {
      bg: "transparent",
      text: theme.colors.success,
      border: theme.colors.success,
    },
    // O dourado fica em badges e pequenos detalhes; o CTA usa a assinatura da marca.
    premium: { bg: theme.colors.primaryInteractive, text: theme.colors.textOnPrimary },
  };

  const v = variants[variant];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={isDisabled}
      hitSlop={hitSlop ?? (size === "sm" ? 2 : undefined)}
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
          minHeight: s.minHeight,
          paddingHorizontal: compact ? spacing.md : s.px,
          paddingVertical: 6,
          backgroundColor: v.bg,
          borderRadius: radii.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: isDisabled ? 0.5 : 1,
          borderWidth: v.border ? 1 : 0,
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
            adjustsFontSizeToFit={fitTitle}
            minimumFontScale={fitTitle ? 0.8 : 1}
            numberOfLines={titleLines}
            style={{
              color: v.text,
              fontSize: s.fontSize,
              fontFamily: fonts.semiBold,
              flexShrink: 1,
              minWidth: 0,
              textAlign: "center",
            }}
          >
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
