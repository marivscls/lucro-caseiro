import { Typography, useTheme } from "@lucro-caseiro/ui";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

import icon from "../../../assets/icon.png";

const BRAND = "#22C55E";
// Tempo minimo que o intro fica visivel, pra nao "piscar" quando a sessao
// carrega muito rapido.
const MIN_DURATION = 1200;

interface BrandIntroProps {
  readonly authReady: boolean;
  readonly onFinish: () => void;
}

/**
 * Abertura da marca: comeca no verde (igual a splash nativa, transicao
 * continua), o icone + nome entram com fade + zoom suave, e some revelando o
 * app. Reaproveita o tempo de `initialize()` da auth, entao nao adiciona atraso.
 */
export function BrandIntro({ authReady, onFinish }: BrandIntroProps) {
  const { theme } = useTheme();
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.9)).current;
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.spring(contentScale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => setMinElapsed(true), MIN_DURATION);
    return () => clearTimeout(timer);
  }, [contentOpacity, contentScale]);

  useEffect(() => {
    if (!minElapsed || !authReady) return;
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [minElapsed, authReady, overlayOpacity, onFinish]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: BRAND,
            opacity: overlayOpacity,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Animated.View
          style={{
            alignItems: "center",
            gap: 16,
            opacity: contentOpacity,
            transform: [{ scale: contentScale }],
          }}
        >
          <Image
            source={icon}
            style={{ width: 96, height: 96, borderRadius: 24 }}
            resizeMode="contain"
          />
          <Typography variant="h1" color="#FFFFFF">
            Lucro Caseiro
          </Typography>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
