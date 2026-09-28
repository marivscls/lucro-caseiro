import { Button, Typography, radii, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Image, type ImageSourcePropType, View, useWindowDimensions } from "react-native";

import resultHero from "../../../assets/getting-started-result.png";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import {
  AuthHeadline,
  AuthLayout,
  GROUP_GAP,
  ITEM_GAP,
  useAuthWide,
} from "./auth-layout";

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
  const wide = useAuthWide();
  // Medidas explícitas: no web, aspectRatio com largura percentual estica a imagem.
  const heroWidth = wide ? 420 : Math.min(190, width - 96);
  const heroHeight = Math.round(heroWidth / 1.15);

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
          <AuthHeadline>Anote suas vendas e descubra seu lucro</AuthHeadline>
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

  return (
    <AuthLayout
      brandName={brandName}
      logo={logo}
      showAsideOnMobile
      aside={
        <Image
          source={resultHero}
          resizeMode="contain"
          accessible
          accessibilityLabel="Painel com vendas anotadas e o lucro subindo"
          style={{ width: heroWidth, height: heroHeight }}
        />
      }
    >
      {content}
    </AuthLayout>
  );
}
