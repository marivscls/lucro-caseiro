import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type ViewStyle,
} from "react-native";

import { radii, spacing, useReducedMotion, useTheme } from "@lucro-caseiro/ui";

/**
 * Placeholder de carregamento ("skeleton") com animação de pulso.
 * Substitui spinners em estados de loading de conteúdo de tela — NÃO usar em
 * botões de submit (esses mantêm ActivityIndicator/texto de estado).
 *
 * Variações:
 * - `Skeleton`: bloco genérico (width/height/borderRadius configuráveis).
 * - `SkeletonText`: linha(s) de texto.
 * - `SkeletonCard`: um card com linhas de texto (detalhes/seções).
 * - `SkeletonList`: N linhas estilo item de lista (avatar + textos).
 */

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radii.sm,
  style,
}: Readonly<SkeletonProps>) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.65);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonTextProps {
  /** Número de linhas de texto. */
  lines?: number;
  /** Largura da última linha (ex.: "60%") para simular parágrafo real. */
  lastLineWidth?: DimensionValue;
  lineHeight?: number;
  style?: ViewStyle;
}

export function SkeletonText({
  lines = 2,
  lastLineWidth = "60%",
  lineHeight = 14,
  style,
}: Readonly<SkeletonTextProps>) {
  const widths = useMemo(
    () =>
      Array.from({ length: lines }, (_, i) => (i === lines - 1 ? lastLineWidth : "100%")),
    [lines, lastLineWidth],
  );
  return (
    <View style={[styles.textGroup, style]}>
      {widths.map((width, i) => (
        <Skeleton key={`line-${i}`} width={width} height={lineHeight} />
      ))}
    </View>
  );
}

interface SkeletonCardProps {
  /** Número de linhas de texto dentro do card. */
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ lines = 3, style }: Readonly<SkeletonCardProps>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        style,
      ]}
    >
      <SkeletonText lines={lines} />
    </View>
  );
}

interface SkeletonListProps {
  /** Número de itens de lista. */
  rows?: number;
  /** Mostra um bloco quadrado à esquerda (avatar/foto). */
  withAvatar?: boolean;
  style?: ViewStyle;
}

export function SkeletonList({
  rows = 4,
  withAvatar = true,
  style,
}: Readonly<SkeletonListProps>) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={`row-${i}`} style={styles.listRow}>
          {withAvatar && <Skeleton width={44} height={44} borderRadius={radii.md} />}
          <View style={styles.listRowText}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  textGroup: {
    gap: spacing.sm,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  list: {
    gap: spacing.lg,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  listRowText: {
    flex: 1,
    gap: spacing.sm,
  },
});
