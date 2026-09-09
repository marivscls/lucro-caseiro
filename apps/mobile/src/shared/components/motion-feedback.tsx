import { useReducedMotion, useTheme } from "@lucro-caseiro/ui";
import React, { useLayoutEffect, useRef, useState } from "react";
import { Animated, Easing, View, type StyleProp, type ViewStyle } from "react-native";

import { AppIcon } from "./app-icon";

// Short native adaptations of React Bits Animated Content and Unlumen's
// accordion patterns. Only transform/opacity animate; form data stays in React.
const easeOut = () => Easing.bezier(0.23, 1, 0.32, 1);
const DISCLOSURE_MS = 280;

type MotionChildren = Readonly<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

/** Feedback on an increase only. Values update immediately; taps never queue. */
export function QuantityPulse({
  value,
  children,
  style,
}: MotionChildren & { readonly value: number }) {
  const reduced = useReducedMotion();
  const { theme } = useTheme();
  const previous = useRef(value);
  const scale = useRef(new Animated.Value(1)).current;
  const ripple = useRef(new Animated.Value(1)).current;
  useLayoutEffect(() => {
    const increased = value > previous.current;
    previous.current = value;
    if (reduced || !increased) {
      scale.setValue(1);
      ripple.setValue(1);
      return;
    }
    ripple.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(ripple, {
        toValue: 1,
        duration: 360,
        easing: easeOut(),
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 90,
          easing: easeOut(),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 170,
          easing: easeOut(),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [value, reduced, scale, ripple]);
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {!reduced && (
        <Animated.View
          aria-hidden
          accessible={false}
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: -4,
            bottom: -4,
            left: -4,
            right: -4,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: theme.colors.primaryStrong,
            opacity: ripple.interpolate({
              inputRange: [0, 0.12, 1],
              outputRange: [0, 0.65, 0],
            }),
            transform: [
              {
                scale: ripple.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1.65],
                }),
              },
            ],
          }}
        />
      )}
      {children}
    </Animated.View>
  );
}

/** Retains a closing section just long enough to fade; cancels safely on reopen. */
export function AnimatedDisclosure({
  open,
  children,
  style,
}: MotionChildren & { readonly open: boolean }) {
  const reduced = useReducedMotion();
  const [present, setPresent] = useState(open);
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  useLayoutEffect(() => {
    if (reduced) {
      progress.setValue(open ? 1 : 0);
      setPresent(open);
      return;
    }
    if (open) setPresent(true);
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: DISCLOSURE_MS,
      easing: easeOut(),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    // A timer also handles the web runtime, which can omit completion callbacks.
    const closeTimer = !open
      ? setTimeout(() => setPresent(false), DISCLOSURE_MS)
      : undefined;
    return () => {
      animation.stop();
      clearTimeout(closeTimer);
    };
  }, [open, reduced, progress]);
  if (!open && (!present || reduced)) return null;
  return (
    <Animated.View
      aria-hidden={!open}
      {...(!open ? { inert: true } : {})}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
      style={[
        style,
        {
          pointerEvents: open ? "auto" : "none",
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-16, 0],
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

export function DisclosureChevron({
  open,
  color,
}: Readonly<{ open: boolean; color: string }>) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  useLayoutEffect(() => {
    if (reduced) {
      progress.setValue(open ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: DISCLOSURE_MS,
      easing: easeOut(),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [open, reduced, progress]);
  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "180deg"],
            }),
          },
        ],
      }}
    >
      <AppIcon name="chevron-down" size={20} color={color} />
    </Animated.View>
  );
}

/** Animate only a step change, never keystrokes or renders of the same step.
 * Numeric keys determine direction automatically. Children are never keyed/remounted.
 */
export function ContentTransition({
  transitionKey,
  distance = 0,
  duration = 320,
  children,
  style,
}: MotionChildren &
  Readonly<{
    transitionKey: string | number;
    distance?: number;
    duration?: number;
  }>) {
  const reduced = useReducedMotion();
  const previous = useRef(transitionKey);
  const opacity = useRef(new Animated.Value(1)).current;
  const x = useRef(new Animated.Value(0)).current;
  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = transitionKey;
    if (reduced || old === transitionKey) {
      opacity.setValue(1);
      x.setValue(0);
      return;
    }
    const direction =
      typeof old === "number" && typeof transitionKey === "number" && transitionKey < old
        ? -1
        : 1;
    opacity.setValue(0);
    x.setValue(distance ? direction * distance : 18);
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: easeOut(),
        useNativeDriver: true,
      }),
      Animated.timing(x, {
        toValue: 0,
        duration,
        easing: easeOut(),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [transitionKey, reduced, distance, duration, opacity, x]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [
            distance ? { translateX: x } : { translateY: x },
            {
              scale: opacity.interpolate({ inputRange: [0, 1], outputRange: [0.975, 1] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Mount only after a successful mutation; never on submit or while saving. */
export function SaleSuccessMark() {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const halo = useRef(new Animated.Value(1)).current;
  useLayoutEffect(() => {
    if (reduced) {
      progress.setValue(1);
      halo.setValue(1);
      return;
    }
    progress.setValue(0);
    halo.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(halo, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [reduced, progress, halo]);
  return (
    <View
      style={{
        width: 72,
        height: 72,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 8,
      }}
    >
      {!reduced &&
        [0, 1].map((index) => (
          <Animated.View
            key={index}
            aria-hidden
            accessible={false}
            style={{
              position: "absolute",
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: index === 0 ? 2 : 1,
              borderColor: theme.colors.success,
              pointerEvents: "none",
              opacity: halo.interpolate({
                inputRange: [0, 0.15, 1],
                outputRange: [0, index === 0 ? 0.65 : 0.35, 0],
              }),
              transform: [
                {
                  scale: halo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, index === 0 ? 1.55 : 1.9],
                  }),
                },
              ],
            }}
          />
        ))}
      <Animated.View
        accessible={false}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.successBg,
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
          transform: [
            {
              scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }),
            },
            {
              rotate: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["-16deg", "0deg"],
              }),
            },
          ],
        }}
      >
        <AppIcon name="checkmark" size={34} color={theme.colors.success} />
      </Animated.View>
    </View>
  );
}
