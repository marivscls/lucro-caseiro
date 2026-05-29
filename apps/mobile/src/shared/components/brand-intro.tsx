import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

// Paleta da marca (warm/rose + dourado), nao o verde da splash.
const BG = "#1E1814"; // backgroundDark — saida sem corte pro app escuro
const CREAM = "#F5E1DB"; // textDark
const GREEN = "#6BBF96"; // success — verde da marca
const ROSE = "196, 112, 126"; // primary #C4707E em rgb p/ glow

const MIN_DURATION = 1900;

interface BrandIntroProps {
  readonly authReady: boolean;
  readonly onFinish: () => void;
}

/**
 * Abertura premium da marca: glow quente respirando, wordmark serifado revelado
 * em cascata, linha dourada que se desenha, um brilho que varre o nome e uma
 * tagline. Fundo escuro = transicao continua pro app. Pure Animated (sem libs
 * nativas), reaproveita o tempo do initialize() da auth.
 */
export function BrandIntro({ authReady, onFinish }: BrandIntroProps) {
  const rootOpacity = useRef(new Animated.Value(1)).current;
  const rootScale = useRef(new Animated.Value(1)).current;

  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.9)).current;

  const l1Opacity = useRef(new Animated.Value(0)).current;
  const l1Y = useRef(new Animated.Value(16)).current;
  const l2Opacity = useRef(new Animated.Value(0)).current;
  const l2Y = useRef(new Animated.Value(16)).current;

  const underline = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;
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

    Animated.timing(glowOpacity, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.1,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.95,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    breathe.start();

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
      Animated.timing(sheen, {
        toValue: 1,
        duration: 950,
        delay: 750,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 650,
        delay: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => setMinElapsed(true), MIN_DURATION);
    return () => {
      clearTimeout(timer);
      breathe.stop();
    };
  }, [
    glowOpacity,
    glowScale,
    l1Opacity,
    l1Y,
    l2Opacity,
    l2Y,
    underline,
    sheen,
    tagOpacity,
  ]);

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

  const sheenTranslate = sheen.interpolate({
    inputRange: [0, 1],
    outputRange: [-160, 160],
  });

  return (
    <Animated.View
      style={[styles.root, { opacity: rootOpacity, transform: [{ scale: rootScale }] }]}
    >
      {/* Glow quente concentrico (fake radial) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.center,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
        pointerEvents="none"
      >
        <View
          style={[
            styles.glow,
            {
              width: 340,
              height: 340,
              borderRadius: 170,
              backgroundColor: `rgba(${ROSE}, 0.07)`,
            },
          ]}
        >
          <View
            style={[
              styles.glow,
              {
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: `rgba(${ROSE}, 0.10)`,
              },
            ]}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "rgba(107, 191, 150, 0.14)",
              }}
            />
          </View>
        </View>
      </Animated.View>

      {/* Wordmark + sheen */}
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

        {/* Brilho diagonal que varre o bloco */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sheen,
            { transform: [{ translateX: sheenTranslate }, { rotate: "20deg" }] },
          ]}
        />
      </View>

      {/* Linha dourada que se desenha */}
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
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: 8,
  },
  word: {
    fontFamily: "serif",
    fontSize: 50,
    lineHeight: 54,
    fontWeight: "700",
    color: CREAM,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  sheen: {
    position: "absolute",
    top: -20,
    bottom: -20,
    width: 50,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
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
    fontWeight: "600",
    color: GREEN,
  },
});
