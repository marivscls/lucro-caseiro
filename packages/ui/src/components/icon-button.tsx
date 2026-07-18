import React from "react";
import { Pressable, type PressableProps, type ViewStyle } from "react-native";

import { useTheme } from "../theme-context";
import { radii } from "../theme";

interface IconButtonProps extends Omit<PressableProps, "style"> {
  icon: React.ReactNode;
  /** Diametro do botao (use passos de 4; 48 ja garante alvo de toque >= 44). */
  size?: number;
  variant?: "surface" | "primary";
  style?: ViewStyle;
}

/** Botão circular só-ícone, alinhado aos tokens (superfície hairline / primário AA). */
export function IconButton({
  icon,
  size = 48,
  variant = "surface",
  style,
  ...props
}: IconButtonProps) {
  const { theme } = useTheme();

  const bg =
    variant === "primary" ? theme.colors.primaryInteractive : theme.colors.surfaceElevated;

  return (
    <Pressable
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: radii.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bg,
          borderWidth: variant === "surface" ? 1 : 0,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...props}
    >
      {icon}
    </Pressable>
  );
}
