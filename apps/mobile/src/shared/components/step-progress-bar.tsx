import { radii, spacing, useReducedMotion } from "@lucro-caseiro/ui";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export function StepProgressBar({
  activeColor,
  current,
  inactiveColor,
  total,
}: Readonly<{
  activeColor: string;
  current: number;
  inactiveColor: string;
  total: number;
}>) {
  const reducedMotion = useReducedMotion();
  const fill = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    fill.setValue(reducedMotion ? 1 : 0);
    if (reducedMotion) return;
    const animation = Animated.timing(fill, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [current, fill, reducedMotion]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current }}
      style={{ flexDirection: "row", gap: spacing.sm }}
    >
      {Array.from({ length: total }, (_, index) => {
        const filled = index < current;
        const isCurrent = index === current - 1;
        return (
          <View
            key={index}
            style={{
              flex: 1,
              height: 8,
              borderRadius: radii.full,
              backgroundColor: inactiveColor,
              overflow: "hidden",
            }}
          >
            {filled ? (
              <Animated.View
                style={{
                  flex: 1,
                  borderRadius: radii.full,
                  backgroundColor: activeColor,
                  opacity: isCurrent ? fill : 1,
                }}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
