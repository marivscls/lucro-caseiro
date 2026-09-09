import { Typography, useReducedMotion } from "@lucro-caseiro/ui";
import React, { useLayoutEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";

import { AppIcon } from "./app-icon";

/** Retargets the same native value, so a second tap never waits for the first. */
function useMotionValue(target: number, duration: number) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(target)).current;
  const previous = useRef(target);
  useLayoutEffect(() => {
    const changed = previous.current !== target;
    previous.current = target;
    if (reduced || !changed) {
      value.setValue(target);
      return;
    }
    const animation = Animated.timing(value, {
      toValue: target,
      duration,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [target, duration, reduced, value]);
  return value;
}

/** Decorative only: the parent checkbox owns the accessible state and tap target. */
export function SelectionCheck({
  selected,
  color,
  checkColor,
  borderColor,
}: Readonly<{
  selected: boolean;
  color: string;
  checkColor: string;
  borderColor: string;
}>) {
  const progress = useMotionValue(selected ? 1 : 0, 150);
  return (
    <View
      aria-hidden
      accessible={false}
      style={{ width: 24, height: 24, pointerEvents: "none" }}
    >
      <View
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 6,
          borderWidth: 2,
          borderColor,
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 6,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          opacity: progress,
          transform: [
            {
              scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
            },
          ],
        }}
      >
        <AppIcon name="checkmark" size={18} color={checkColor} />
      </Animated.View>
    </View>
  );
}

/** Anchored to the selected date; stays out of text layout and pointer handling. */
export function SelectionUnderline({
  selected,
  color,
}: Readonly<{ selected: boolean; color: string }>) {
  const progress = useMotionValue(selected ? 1 : 0, 180);
  return (
    <Animated.View
      aria-hidden
      accessible={false}
      style={{
        pointerEvents: "none",
        position: "absolute",
        bottom: 3,
        left: 12,
        right: 12,
        height: 3,
        borderRadius: 3,
        backgroundColor: color,
        opacity: progress,
        transform: [{ scaleX: progress }],
      }}
    />
  );
}

/** The value is always current; only the bar and its label's position interpolate. */
export function GoalProgress({
  value,
  color,
  trackColor,
  textColor,
}: Readonly<{
  value: number;
  color: string;
  trackColor: string;
  textColor: string;
}>) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const progress = useMotionValue(safeValue / 100, 420);
  const [width, setWidth] = useState(0);
  const [labelWidth, setLabelWidth] = useState(44);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Progresso da meta mensal"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safeValue) }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height: 24 }}
    >
      <View
        style={{
          position: "absolute",
          top: 6,
          left: 0,
          right: 0,
          height: 12,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: trackColor,
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            backgroundColor: color,
            opacity: width > 0 ? 1 : 0,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-width, 0],
                }),
              },
            ],
          }}
        />
      </View>
      <Animated.View
        aria-hidden
        accessible={false}
        onLayout={(event) => setLabelWidth(event.nativeEvent.layout.width)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          minWidth: 44,
          height: 24,
          paddingHorizontal: 8,
          borderRadius: 12,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max(0, width - labelWidth)],
              }),
            },
          ],
        }}
      >
        <Typography variant="homeProgressStrong" color={textColor}>
          {Math.round(safeValue)}%
        </Typography>
      </Animated.View>
    </View>
  );
}
