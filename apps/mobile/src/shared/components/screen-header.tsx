import { AppIcon } from "./app-icon";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { iconSizes, spacing, Typography, useTheme } from "@lucro-caseiro/ui";

export type ScreenHeaderProps = Readonly<{
  title: string;
  /** Texto auxiliar abaixo do título (caption). */
  subtitle?: string;
  /** Ação do botão voltar (padrão: `router.back()`). */
  onBack?: () => void;
  /** Rótulo de acessibilidade do voltar (padrão: "Voltar"). */
  backLabel?: string;
  /** Ações à direita (busca, histórico, filtros…). */
  right?: React.ReactNode;
  /** Esconde voltar+título mantendo o alinhamento das ações (ex.: desktop). */
  hideBack?: boolean;
  style?: ViewStyle;
}>;

/**
 * Cabeçalho canônico das telas empilhadas: voltar + título (Fraunces) +
 * ações à direita. Substitui o bloco Pressable(arrow-back)+Typography h1 que
 * era copiado em cada tela. Deve ficar dentro de uma SafeAreaView (a tela
 * controla as edges); alvo de toque do voltar >= 44px.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Voltar",
  right,
  hideBack = false,
  style,
}: ScreenHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        },
        style,
      ]}
    >
      {!hideBack ? (
        <>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            hitSlop={10}
            style={{ width: 44, height: 44, justifyContent: "center" }}
          >
            <AppIcon name="arrow-back" size={iconSizes.md} color={theme.colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Typography variant="h1" color={theme.colors.text} numberOfLines={1}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" numberOfLines={2}>
                {subtitle}
              </Typography>
            ) : null}
          </View>
        </>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right}
    </View>
  );
}
