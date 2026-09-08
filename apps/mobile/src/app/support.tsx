import { showAlert } from "../shared/components/alert-store";
import { Button, Card, Typography, spacing, useBrand, useTheme } from "@lucro-caseiro/ui";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { AppIcon } from "../shared/components/app-icon";
import { Stack } from "expo-router";
import React from "react";
import { Linking, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfile } from "../features/subscription/hooks";
import { useBusinessCopy } from "../features/subscription/business-copy";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import {
  desktopAction,
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { ScreenHeader } from "../shared/components/screen-header";
import { getBrandDisplayName } from "../shared/brand-name";
import { usePaywall } from "../shared/hooks/use-paywall";

const SUPPORT_EMAIL = "contato@orionseven.com.br";

const STATIC_FAQ: { question: string; answer: string }[] = [
  {
    question: "Como falo com vocês?",
    answer:
      "Use o botão para abrir seu e-mail e contar em qual tela teve dificuldade. As instruções básicas e o envio de dúvidas estão disponíveis em todos os planos.",
  },
  {
    question: "Como cancelo minha assinatura?",
    answer:
      "Confira o recibo da sua assinatura. Se a cobrança é da Google Play, gerencie-a em Assinaturas na loja. Se é da Stripe, solicite o cancelamento pelo e-mail de suporte. Não é necessário apagar sua conta.",
  },
  {
    question: "Achei um erro ou tenho uma ideia",
    answer:
      "Manda pra gente! Feedback de quem usa todo dia é o que faz o app melhorar. Use o botão abaixo.",
  },
];

function openSupportEmail(brandName: string) {
  const subject = encodeURIComponent(`Suporte ${brandName}`);
  const body = encodeURIComponent(
    "Oi! Preciso de ajuda com:\n\n\n---\n(Conte o que aconteceu que a gente resolve.)",
  );
  void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(
    () =>
      showAlert({
        title: "Envie sua dúvida por e-mail",
        message: `Não foi possível abrir o aplicativo de e-mail. Escreva para ${SUPPORT_EMAIL} e informe em qual tela aconteceu.`,
      }),
  );
}

export default function SupportScreen() {
  const { theme } = useTheme();
  const experienceCopy = useBusinessCopy();
  const brandName = getBrandDisplayName(useBrand());
  const isDesktop = useDesktopLayout();
  const showPaywall = usePaywall((state) => state.show);
  const { data: profile } = useProfile();
  const isPremium =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "prioritySupport");
  const faq = [
    ...STATIC_FAQ.slice(0, 2),
    {
      question: "Troquei de celular. E os meus dados?",
      answer: `Nada se perde: entre com o mesmo e-mail no aparelho novo e suas vendas, clientes e ${experienceCopy.formulaNounPlural} voltam automaticamente.`,
    },
    ...STATIC_FAQ.slice(2),
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title="Suporte" hideBack={isDesktop} />

      <ScrollView
        contentContainerStyle={[
          {
            ...pageGutter(isDesktop),
            paddingTop: spacing.md,
            paddingBottom: spacing.xl,
            gap: spacing.lg,
          },
          desktopStretch(isDesktop, desktopWidths.data),
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isPremium ? (
          <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <AppIcon name="diamond" size={20} color={theme.colors.premium} />
              <Typography variant="h3" color={theme.colors.premium}>
                Atendimento prioritário
              </Typography>
            </View>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Seu plano inclui prioridade de atendimento. Conte o que tentou fazer e em
              qual etapa teve dificuldade.
            </Typography>
            <Button
              title="Falar com o suporte"
              size="lg"
              icon={
                <AppIcon
                  name="mail-outline"
                  size={20}
                  color={theme.colors.textOnPrimary}
                />
              }
              onPress={() => openSupportEmail(brandName)}
              style={desktopAction(isDesktop, 240)}
            />
            <Typography variant="caption" style={{ textAlign: "center" }}>
              {SUPPORT_EMAIL}
            </Typography>
          </Card>
        ) : (
          <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <AppIcon name="diamond-outline" size={20} color={theme.colors.premium} />
              <Typography variant="h3" color={theme.colors.premium}>
                Precisa de ajuda?
              </Typography>
            </View>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Você pode consultar as instruções e relatar dificuldades no plano gratuito.
              A prioridade de atendimento continua sendo um benefício do Profissional.
            </Typography>
            <Button
              title="Relatar uma dificuldade"
              size="lg"
              onPress={() => openSupportEmail(brandName)}
            />
            <Typography variant="body">{SUPPORT_EMAIL}</Typography>
            <Button
              variant="outline"
              title="Conhecer atendimento prioritário"
              size="lg"
              onPress={() => showPaywall("prioritySupport")}
              style={desktopAction(isDesktop, 240)}
            />
          </Card>
        )}

        <View style={{ gap: spacing.sm }}>
          <Typography variant="bodyBold" color={theme.colors.text}>
            Perguntas frequentes
          </Typography>
          {faq.map((item) => (
            <Card key={item.question} variant="surface" padding="lg" style={{ gap: 6 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <AppIcon
                  name="help-circle-outline"
                  size={20}
                  color={theme.colors.primaryLight}
                />
                <Typography
                  variant="bodyBold"
                  color={theme.colors.text}
                  style={{ flex: 1 }}
                >
                  {item.question}
                </Typography>
              </View>
              <Typography
                variant="body"
                color={theme.colors.textSecondary}
                style={{ fontSize: 16, lineHeight: 24 }}
              >
                {item.answer}
              </Typography>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
