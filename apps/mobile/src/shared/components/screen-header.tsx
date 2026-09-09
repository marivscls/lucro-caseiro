import { ScreenGuidance, type ScreenGuidanceProps } from "../guidance/screen-guidance";
import { AppIcon } from "./app-icon";
import { type Href, useRouter } from "expo-router";
import React from "react";
import { Pressable, View, type TextStyle, type ViewStyle } from "react-native";

import { iconSizes, spacing, Typography, useTheme } from "@lucro-caseiro/ui";

import { useDesktopLayout } from "../layout/use-desktop-layout";
import { desktopHeaderStyle } from "../layout/desktop-density";

export type ScreenHeaderProps = Readonly<{
  title: string;
  guidance?: ScreenGuidanceProps;
  /** Texto auxiliar abaixo do título (caption). */
  subtitle?: string;
  /** Ação do botão voltar (padrão: `router.back()`). */
  onBack?: () => void;
  /** Destino quando a rota foi aberta sem histórico (acesso direto/PWA). */
  fallbackRoute?: Href;
  /** Rótulo de acessibilidade do voltar (padrão: "Voltar"). */
  backLabel?: string;
  /** Ações à direita (busca, histórico, filtros…). */
  right?: React.ReactNode;
  hideBack?: boolean;
  backButtonStyle?: ViewStyle;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  subtitleNumberOfLines?: number;
}>;

/**
 * Cabeçalho canônico das telas empilhadas: voltar + título (Manrope) +
 * ações à direita. Substitui o bloco Pressable+Typography que
 * era copiado em cada tela. Deve ficar dentro de uma SafeAreaView (a tela
 * controla as edges); alvo de toque do voltar >= 44px.
 */
export function ScreenHeader({
  title,
  guidance,
  subtitle,
  onBack,
  fallbackRoute = "/tabs/more",
  backLabel = "Voltar",
  right,
  hideBack = false,
  backButtonStyle,
  style,
  titleStyle,
  subtitleStyle,
  subtitleNumberOfLines = 2,
}: ScreenHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const isDesktop = useDesktopLayout();

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackRoute);
  }

  return (
    <>
      <View
        testID="screen-header"
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            paddingHorizontal: isDesktop ? 0 : spacing.lg,
            paddingTop: hideBack ? spacing.xl : spacing.sm,
            paddingBottom: spacing.sm,
            position: "relative",
            zIndex: 10,
          },
          style,
          isDesktop ? desktopHeaderStyle : undefined,
        ]}
      >
        {!hideBack && !isDesktop ? (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            hitSlop={10}
            style={[
              {
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                zIndex: 11,
              },
              backButtonStyle,
            ]}
          >
            <AppIcon name="chevron-back" size={iconSizes.md} color={theme.colors.text} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="screenTitle"
            color={theme.colors.text}
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[
              titleStyle,
              isDesktop
                ? { fontSize: 20, lineHeight: 26, letterSpacing: -0.2 }
                : undefined,
            ]}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              variant="caption"
              numberOfLines={subtitleNumberOfLines}
              ellipsizeMode="tail"
              style={[subtitleStyle, { fontSize: 13, lineHeight: 18, marginTop: 2 }]}
            >
              {subtitle}
            </Typography>
          ) : null}
        </View>
        {right}
      </View>
      {guidance ? <ScreenGuidance {...guidance} /> : null}
    </>
  );
}
