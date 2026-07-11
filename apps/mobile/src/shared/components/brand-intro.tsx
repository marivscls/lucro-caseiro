import { fonts } from "@lucro-caseiro/ui";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

// Paleta da marca (warm/rose + verde), nao o verde da splash.
const BG = "#1E1814"; // backgroundDark — saida sem corte pro app escuro
const CREAM = "#F5E1DB"; // textDark
const GREEN = "#6BBF96"; // success — verde da marca

const MIN_DURATION = 1900;

interface BrandIntroProps {
  readonly authReady: boolean;
  readonly onFinish: () => void;
}

/**
 * Abertura da marca: wordmark serifado revelado em cascata, linha verde que se
 * desenha e uma tagline. Fundo escuro = transicao continua pro app. Pure
 * Animated (sem libs nativas), reaproveita o tempo do initialize() da auth.
 */
export function BrandIntro({ authReady, onFinish }: BrandIntroProps) {
  const rootOpacity = useRef(new Animated.Value(1)).current;
  const rootScale = useRef(new Animated.Value(1)).current;

  const l1Opacity = useRef(new Animated.Value(0)).current;
  const l1Y = useRef(new Animated.Value(16)).current;
  const l2Opacity = useRef(new Animated.Value(0)).current;
  const l2Y = useRef(new Animated.Value(16)).current;

  const underline = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const reveal = (opacity: Animated.Value, translate: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translate, {
          toValue: 0,
          delay,
          friction: 8,
          tension: 45,
          useNativeDriver: true,
        }),
      ]);

    Animated.parallel([
      reveal(l1Opacity, l1Y, 150),
      reveal(l2Opacity, l2Y, 320),
      Animated.timing(underline, {
        toValue: 1,
        duration: 700,
        delay: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 650,
        delay: 950,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => setMinElapsed(true), MIN_DURATION);
    return () => clearTimeout(timer);
  }, [l1Opacity, l1Y, l2Opacity, l2Y, underline, tagOpacity]);

  useEffect(() => {
    if (!minElapsed || !authReady) return;
    Animated.parallel([
      Animated.timing(rootOpacity, {
        toValue: 0,
        duration: 480,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rootScale, {
        toValue: 1.06,
        duration: 480,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, [minElapsed, authReady, rootOpacity, rootScale, onFinish]);

  return (
    <Animated.View
      style={[styles.root, { opacity: rootOpacity, transform: [{ scale: rootScale }] }]}
    >
      <View style={styles.wordmark}>
        <Animated.Text
          style={[styles.word, { opacity: l1Opacity, transform: [{ translateY: l1Y }] }]}
        >
          Lucro
        </Animated.Text>
        <Animated.Text
          style={[styles.word, { opacity: l2Opacity, transform: [{ translateY: l2Y }] }]}
        >
          Caseiro
        </Animated.Text>
      </View>

      {/* Linha verde que se desenha */}
      <Animated.View style={[styles.underline, { transform: [{ scaleX: underline }] }]} />

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        NEGÓCIO EM CASA
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    alignItems: "center",
  },
  word: {
    fontFamily: fonts.displayBold,
    fontSize: 50,
    lineHeight: 54,
    color: CREAM,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  underline: {
    width: 88,
    height: 2,
    borderRadius: 1,
    backgroundColor: GREEN,
    marginTop: 18,
  },
  tagline: {
    marginTop: 16,
    fontSize: 12,
    letterSpacing: 5,
    fontFamily: fonts.semiBold,
    color: GREEN,
  },
});
