import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Image, type ImageSourcePropType, View, useWindowDimensions } from "react-native";

/** A partir desta largura as telas de entrada viram duas colunas (ilustração | conteúdo). */
const WIDE_BREAKPOINT = 880;
/** Espaço entre blocos (título, lista, botões) e entre itens de um bloco. */
export const GROUP_GAP = spacing["2xl"];
export const ITEM_GAP = spacing.md;

export function useAuthWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT;
}

interface AuthLayoutProps {
  brandName: string;
  logo: ImageSourcePropType;
  /** Conteúdo do painel colorido (ilustração). */
  aside: React.ReactNode;
  /** No celular o painel só aparece quando cabe junto do conteúdo principal. */
  showAsideOnMobile?: boolean;
  children: React.ReactNode;
}

/**
 * Moldura comum da boas-vindas e do login: nome da marca no topo e, no
 * computador, o painel ilustrado à esquerda do conteúdo.
 */
export function AuthLayout({
  brandName,
  logo,
  aside,
  showAsideOnMobile = false,
  children,
}: Readonly<AuthLayoutProps>) {
  const { theme } = useTheme();
  const wide = useAuthWide();

  const lockup = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: ITEM_GAP,
        alignSelf: "flex-start",
      }}
    >
      <Image
        source={logo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      />
      <Typography variant="wordmark">{brandName}</Typography>
    </View>
  );

  const panel = (
    <View
      style={{
        backgroundColor: theme.colors.primaryBg,
        borderRadius: radii["2xl"],
        alignItems: "center",
        justifyContent: "center",
        gap: GROUP_GAP,
        padding: wide ? spacing["4xl"] : spacing.lg,
        flex: wide ? 1 : undefined,
        minHeight: wide ? 560 : undefined,
      }}
    >
      {aside}
    </View>
  );

  if (wide) {
    return (
      <View
        style={{
          width: "100%",
          maxWidth: 1040,
          alignSelf: "center",
          padding: spacing["4xl"],
          gap: GROUP_GAP,
        }}
      >
        {lockup}
        <View
          style={{ flexDirection: "row", alignItems: "stretch", gap: spacing["5xl"] }}
        >
          {panel}
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        width: "100%",
        maxWidth: 480,
        alignSelf: "center",
        padding: spacing.xl,
        gap: GROUP_GAP,
      }}
    >
      {lockup}
      {showAsideOnMobile ? panel : null}
      {children}
    </View>
  );
}

/** Título grande das telas de entrada, na mesma medida da boas-vindas. */
export function AuthHeadline({ children }: Readonly<{ children: React.ReactNode }>) {
  const wide = useAuthWide();
  return (
    <Typography
      variant="display"
      style={{
        fontSize: wide ? 40 : 30,
        lineHeight: wide ? 46 : 36,
        letterSpacing: -0.8,
      }}
    >
      {children}
    </Typography>
  );
}
