import { useReducedMotion } from "@lucro-caseiro/ui";
import React, { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";

interface AnimatedListItemProps {
  /** Posição na lista — gera um leve "stagger" (limitado p/ listas longas). */
  index?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Faz o item entrar com fade + leve subida ao montar. Para listas longas o
 * atraso é limitado para não deixar os últimos itens lentos. Respeita
 * reduce-motion (aparece direto, sem animação).
 */
export function AnimatedListItem({
  index = 0,
  children,
  style,
}: Readonly<AnimatedListItemProps>) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const delay = Math.min(index, 8) * 45;
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      delay,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, reduced, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
