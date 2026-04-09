import React from "react";
import { Pressable, type PressableProps, type ViewStyle } from "react-native";

import { useTheme } from "../theme-context";

interface IconButtonProps extends Omit<PressableProps, "style"> {
  icon: React.ReactNode;
  size?: number;
  variant?: "surface" | "primary";
  style?: ViewStyle;
}

export function IconButton({
  icon,
  size = 48,
  variant = "surface",
  style,
  ...props
}: IconButtonProps) {
  const { theme } = useTheme();

  const bg = variant === "primary" ? theme.colors.primary : theme.colors.surface;

  return (
    <Pressable
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bg,
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
