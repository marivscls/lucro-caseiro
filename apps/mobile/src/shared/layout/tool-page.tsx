import { spacing, useTheme } from "@lucro-caseiro/ui";
import { Stack } from "expo-router";
import React, { type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "../components/screen-header";
import { pageGutter } from "./desktop-density";
import {
  DesktopPageHeader,
  desktopPageContent,
  type DesktopPageWidth,
} from "./desktop-page";
import { useDesktopLayout } from "./use-desktop-layout";

/**
 * Moldura das telas de ferramenta (Pix, Indique e ganhe, MEI, Anotar falando):
 * cabeçalho padrão, rolagem com respiro e, no computador, largura de página
 * com o título grande. O conteúdo vem empilhado com 24 px (celular) ou 32 px.
 */
export function ToolPage({
  title,
  subtitle,
  width = "form",
  children,
}: Readonly<{
  title: string;
  subtitle?: string;
  width?: DesktopPageWidth;
  children: ReactNode;
}>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {isDesktop ? null : <ScreenHeader title={title} subtitle={subtitle} />}
      <ScrollView
        contentContainerStyle={
          isDesktop
            ? desktopPageContent(true, width)
            : {
                ...pageGutter(false),
                paddingTop: spacing.md,
                paddingBottom: spacing["3xl"],
                gap: spacing.xl,
              }
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isDesktop ? (
          <DesktopPageHeader>
            <ScreenHeader title={title} subtitle={subtitle} hideBack />
          </DesktopPageHeader>
        ) : null}
        <View style={{ gap: isDesktop ? spacing["2xl"] : spacing.xl }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
