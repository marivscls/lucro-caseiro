import { fonts, useBrand, useReducedMotion, useTheme } from "@lucro-caseiro/ui";
import React, { useEffect, useId, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

import { brandLogoByMode } from "../brand-logo";
import { getBrandDisplayName } from "../brand-name";

const MIN_DURATION = 1600;
const EXIT_DURATION = 280;

interface BrandIntroProps {
  readonly authReady: boolean;
  readonly onFinish: () => void;
}

/**
 * Native adaptation of the light sweep / masked reveal patterns:
 * https://reactbits.dev/animations/glare-hover
 * https://reactbits.dev/text-animations/split-text
 * Transform + opacity only; no DOM, hover dependency or animation package.
 */
export function BrandIntro({ authReady, onFinish }: BrandIntroProps) {
  const { theme } = useTheme();
  const brand = useBrand();
  const reducedMotion = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const brandName = getBrandDisplayName(brand);
  const [firstWord, ...remainingWords] = brandName.split(" ");
  const dark = theme.mode === "dark";
  const onFinishRef = useRef(onFinish);
  const hasFinished = useRef(false);
  const rootOpacity = useRef(new Animated.Value(1)).current;
  const logoReveal = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const textReveal = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const sheen = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (reducedMotion) {
      logoReveal.setValue(1);
      textReveal.setValue(1);
      sheen.setValue(0);
      pulse.setValue(0);
      return;
    }
    const entrance = Animated.parallel([
      Animated.timing(logoReveal, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textReveal, {
        toValue: 1,
        delay: 180,
        duration: 720,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheen, {
        toValue: 1,
        delay: 480,
        duration: 800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    const waiting = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    entrance.start();
    waiting.start();
    return () => {
      entrance.stop();
      waiting.stop();
    };
  }, [logoReveal, textReveal, sheen, pulse, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setTimeout(() => setMinElapsed(true), MIN_DURATION);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if ((!minElapsed && !reducedMotion) || !authReady) return;
    const duration = reducedMotion ? 0 : EXIT_DURATION;
    const exit = Animated.timing(rootOpacity, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    exit.start();
    // Web can omit Animated's completion callback; keep the transition deterministic.
    const timer = setTimeout(() => {
      if (hasFinished.current) return;
      hasFinished.current = true;
      onFinishRef.current();
    }, duration);
    return () => {
      clearTimeout(timer);
      exit.stop();
    };
  }, [minElapsed, authReady, reducedMotion, rootOpacity]);

  const revealLine = (start: number) => ({
    opacity: textReveal.interpolate({
      inputRange: [start, 1],
      outputRange: [0, 1],
      extrapolate: "clamp",
    }),
    transform: [
      {
        translateY: textReveal.interpolate({
          inputRange: [start, 1],
          outputRange: [40, 0],
          extrapolate: "clamp",
        }),
      },
    ],
  });

  return (
    <Animated.View
      style={[
        styles.root,
        { backgroundColor: theme.colors.background, opacity: rootOpacity },
      ]}
    >
      <View style={styles.center}>
        <View style={styles.identity}>
          <Animated.View
            style={[
              styles.emblem,
              {
                opacity: logoReveal,
                transform: [
                  {
                    scale: logoReveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.88, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              style={styles.halo}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Svg width="100%" height="100%" viewBox="0 0 400 400">
                <Defs>
                  <RadialGradient id={`${gradientId}-halo`} cx="50%" cy="50%" r="50%">
                    <Stop
                      offset="0"
                      stopColor={theme.colors.primary}
                      stopOpacity={dark ? 0.24 : 0.15}
                    />
                    <Stop
                      offset="0.5"
                      stopColor={theme.colors.primary}
                      stopOpacity={dark ? 0.09 : 0.06}
                    />
                    <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect width="400" height="400" fill={`url(#${gradientId}-halo)`} />
              </Svg>
            </View>
            <View style={[styles.logoFrame, { borderColor: theme.colors.border }]}>
              <View style={styles.logoClip}>
                <Image
                  source={brandLogoByMode[theme.mode][brand.id]}
                  resizeMode="cover"
                  style={styles.logo}
                  accessible={false}
                />
                {!reducedMotion && (
                  <Animated.View
                    style={[
                      styles.sheen,
                      {
                        transform: [
                          {
                            translateX: sheen.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-120, 160],
                            }),
                          },
                          { rotate: "20deg" },
                        ],
                      },
                    ]}
                  >
                    <Svg width="100%" height="100%">
                      <Defs>
                        <LinearGradient
                          id={`${gradientId}-sheen`}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.65" />
                          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                        </LinearGradient>
                      </Defs>
                      <Rect
                        width="100%"
                        height="100%"
                        fill={`url(#${gradientId}-sheen)`}
                      />
                    </Svg>
                  </Animated.View>
                )}
              </View>
            </View>
          </Animated.View>
          <View
            style={styles.wordmark}
            accessible
            accessibilityLabel={brandName}
            accessibilityRole="header"
          >
            <View style={styles.lineMask}>
              <Animated.Text
                style={[styles.firstWord, { color: theme.colors.text }, revealLine(0)]}
              >
                {firstWord}
              </Animated.Text>
            </View>
            {remainingWords.length > 0 && (
              <View style={styles.lineMask}>
                <Animated.Text
                  style={[
                    styles.lastWord,
                    { color: theme.colors.primaryStrong },
                    revealLine(0.18),
                  ]}
                >
                  {remainingWords.join(" ")}
                </Animated.Text>
              </View>
            )}
          </View>
          <Animated.Text
            style={[
              styles.tagline,
              { color: theme.colors.textSecondary },
              revealLine(0.3),
            ]}
          >
            Seu trabalho merece dar lucro.
          </Animated.Text>
        </View>
      </View>
      <View
        style={styles.footer}
        accessible
        accessibilityLabel="Preparando seu espaço"
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
      >
        <Animated.View
          style={[
            styles.statusDot,
            {
              backgroundColor: theme.colors.primaryStrong,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
            },
          ]}
        />
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          Preparando seu espaço
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", paddingHorizontal: 24, paddingVertical: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  identity: { alignItems: "center", width: "100%", maxWidth: 400, paddingBottom: 24 },
  emblem: {
    pointerEvents: "none",
    width: 136,
    height: 136,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  halo: { position: "absolute", width: 400, height: 400, top: -132, left: -132 },
  logoFrame: { padding: 9, borderWidth: 1, borderRadius: 42 },
  logoClip: { width: 108, height: 108, borderRadius: 32, overflow: "hidden" },
  logo: { width: "100%", height: "100%" },
  sheen: { position: "absolute", top: -32, bottom: -32, width: 64, left: 0 },
  wordmark: { alignItems: "center", maxWidth: "100%" },
  lineMask: { overflow: "hidden", paddingHorizontal: 8, maxWidth: "100%" },
  firstWord: {
    fontFamily: fonts.extraBold,
    fontSize: 42,
    lineHeight: 52,
    letterSpacing: -1.2,
    textAlign: "center",
  },
  lastWord: {
    fontFamily: fonts.extraBold,
    fontSize: 48,
    lineHeight: 60,
    letterSpacing: -1.8,
    textAlign: "center",
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 16,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 20 },
});
