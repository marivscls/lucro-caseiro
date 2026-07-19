import { fonts, useBrand, useTheme } from "@lucro-caseiro/ui";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { brandLogoById } from "../brand-logo";
import { getBrandDisplayName } from "../brand-name";

const MIN_DURATION = 1900;
const EXIT_DURATION = 480;

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
  const { theme } = useTheme();
  const brand = useBrand();
  const [firstWord, ...remainingWords] = getBrandDisplayName(brand).split(" ");
  const onFinishRef = useRef(onFinish);
  const hasFinished = useRef(false);
  const rootOpacity = useRef(new Animated.Value(1)).current;
  const rootScale = useRef(new Animated.Value(1)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;

  const l1Opacity = useRef(new Animated.Value(0)).current;
  const l1Y = useRef(new Animated.Value(16)).current;
  const l2Opacity = useRef(new Animated.Value(0)).current;
  const l2Y = useRef(new Animated.Value(16)).current;

  const underline = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

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
      // Casinha da marca entra primeiro, com um leve "pop"
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 550,
        delay: 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        delay: 0,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
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
  }, [logoOpacity, logoScale, l1Opacity, l1Y, l2Opacity, l2Y, underline, tagOpacity]);

  useEffect(() => {
    if (!minElapsed || !authReady) return;
    const exitAnimation = Animated.parallel([
      Animated.timing(rootOpacity, {
        toValue: 0,
        duration: EXIT_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rootScale, {
        toValue: 1.06,
        duration: EXIT_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    exitAnimation.start();

    // Animated pode concluir visualmente no web sem disparar o callback de
    // conclusao. O timer torna a troca de tela deterministica em todas as plataformas.
    const finishTimer = setTimeout(() => {
      if (hasFinished.current) return;
      hasFinished.current = true;
      onFinishRef.current();
    }, EXIT_DURATION);

    return () => {
      clearTimeout(finishTimer);
      exitAnimation.stop();
    };
  }, [minElapsed, authReady, rootOpacity, rootScale]);

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: rootOpacity,
          transform: [{ scale: rootScale }],
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <Animated.Image
        source={brandLogoById[brand.id]}
        resizeMode="contain"
        style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      />

      <View style={styles.wordmark}>
        <Animated.Text
          style={[
            styles.word,
            {
              opacity: l1Opacity,
              transform: [{ translateY: l1Y }],
              color: theme.colors.text,
            },
          ]}
        >
          {firstWord}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.word,
            {
              opacity: l2Opacity,
              transform: [{ translateY: l2Y }],
              color: theme.colors.text,
            },
          ]}
        >
          {remainingWords.join(" ")}
        </Animated.Text>
      </View>

      {/* Linha verde que se desenha */}
      <Animated.View
        style={[
          styles.underline,
          { transform: [{ scaleX: underline }], backgroundColor: theme.colors.primary },
        ]}
      />

      {/* Tagline */}
      <Animated.Text
        style={[styles.tagline, { opacity: tagOpacity, color: theme.colors.primary }]}
      >
        GESTÃO PARA CRESCER
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    alignItems: "center",
  },
  logo: {
    width: 132,
    height: 128,
    marginBottom: 26,
  },
  word: {
    fontFamily: fonts.displayBold,
    fontSize: 50,
    lineHeight: 54,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  underline: {
    width: 88,
    height: 2,
    borderRadius: 1,
    marginTop: 18,
  },
  tagline: {
    marginTop: 16,
    fontSize: 12,
    letterSpacing: 5,
    fontFamily: fonts.semiBold,
  },
});
