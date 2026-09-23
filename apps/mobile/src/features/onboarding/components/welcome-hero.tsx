import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Image, type ImageSourcePropType, View, useWindowDimensions } from "react-native";

import resultHero from "../../../assets/getting-started-result.png";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";

/** A partir desta largura a boas-vindas vira duas colunas (ilustração | conteúdo). */
const WIDE_BREAKPOINT = 880;
/** Espaço entre blocos (título, benefícios, botões) e entre itens de um bloco. */
const GROUP_GAP = spacing["2xl"];
const ITEM_GAP = spacing.md;

const BENEFITS: ReadonlyArray<{ icon: AppIconName; title: string; detail: string }> = [
  {
    icon: "receipt-outline",
    title: "Venda anotada em poucos toques",
    detail: "Escolha o produto, a quantidade e pronto.",
  },
  {
    icon: "trending-up",
    title: "Lucro de cada produto",
    detail: "Veja quanto sobra de verdade, sem planilha.",
  },
  {
    icon: "people-outline",
    title: "Fiado sob controle",
    detail: "Saiba quem está devendo e quanto.",
  },
];

interface WelcomeHeroProps {
  brandName: string;
  logo: ImageSourcePropType;
  onCreateAccount: () => void;
  onLogin: () => void;
}

/** Primeira tela de quem nunca entrou no aparelho: promessa, benefícios e as duas saídas. */
export function WelcomeHero({
  brandName,
  logo,
  onCreateAccount,
  onLogin,
}: Readonly<WelcomeHeroProps>) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  // Medidas explícitas: no web, aspectRatio com largura percentual estica a imagem.
  const heroWidth = wide ? 420 : Math.min(190, width - 96);
  const heroHeight = Math.round(heroWidth / 1.15);

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

  const illustration = (
    <View
      style={{
        backgroundColor: theme.colors.primaryBg,
        borderRadius: radii["2xl"],
        alignItems: "center",
        justifyContent: "center",
        padding: wide ? spacing["4xl"] : spacing.lg,
        flex: wide ? 1 : undefined,
        minHeight: wide ? 560 : undefined,
      }}
    >
      <Image
        source={resultHero}
        resizeMode="contain"
        accessible
        accessibilityLabel="Painel com vendas anotadas e o lucro subindo"
        style={{ width: heroWidth, height: heroHeight }}
      />
    </View>
  );

  const content = (
    <View
      style={{
        // No computador os blocos se espalham na altura da ilustração: texto e
        // benefícios juntos no topo dela, botões na base.
        gap: wide ? undefined : GROUP_GAP,
        flex: wide ? 1 : undefined,
        justifyContent: wide ? "space-between" : "flex-start",
      }}
    >
      <View style={{ gap: GROUP_GAP }}>
        <View style={{ gap: ITEM_GAP }}>
          <Typography
            variant="display"
            style={{
              fontSize: wide ? 40 : 30,
              lineHeight: wide ? 46 : 36,
              letterSpacing: -0.8,
            }}
          >
            Anote suas vendas e descubra seu lucro
          </Typography>
          <Typography variant="body">
            O caderno do seu negócio, no celular. Grátis para começar, com vendas
            ilimitadas.
          </Typography>
        </View>

        <View style={{ gap: ITEM_GAP }} accessibilityRole="list">
          {BENEFITS.map((benefit) => (
            <View
              key={benefit.title}
              style={{ flexDirection: "row", alignItems: "center", gap: ITEM_GAP }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radii.full,
                  backgroundColor: theme.colors.yellowBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon
                  name={benefit.icon}
                  size={22}
                  color={theme.colors.primaryStrong}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold">{benefit.title}</Typography>
                {/* No celular o detalhe sai para os botões caberem na primeira tela. */}
                {wide ? (
                  <Typography variant="caption">{benefit.detail}</Typography>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: ITEM_GAP }}>
        <Button title="Criar conta grátis" size="lg" onPress={onCreateAccount} />
        <Button title="Já tenho conta" variant="outline" size="lg" onPress={onLogin} />
      </View>
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
          {illustration}
          {content}
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
      {illustration}
      {content}
    </View>
  );
}
