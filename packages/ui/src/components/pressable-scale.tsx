import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useReducedMotion } from "../use-reduced-motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, "style"> {
  /** Escala alvo ao pressionar (0.97 = leve "encolhida"). */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Pressable com feedback de toque por escala (spring), na thread nativa.
 * Substitui o feedback de opacidade por algo mais "vivo". Respeita reduce-motion.
 */
export function PressableScale({
  scaleTo = 0.97,
  style,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(e) => {
        if (!reduced && !disabled) animateTo(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) animateTo(1);
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
