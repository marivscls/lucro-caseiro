import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Linking, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfile } from "../features/subscription/hooks";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { desktopAction, desktopContained } from "../shared/layout/desktop-density";
import { ScreenHeader } from "../shared/components/screen-header";

const SUPPORT_EMAIL = "contato@orionseven.com.br";

const FAQ: { question: string; answer: string }[] = [
  {
    question: "Como falo com vocês?",
    answer:
      "É só tocar no botão abaixo pra abrir seu e-mail já preenchido. Como você é assinante, sua mensagem entra na fila de prioridade e a gente responde rapidinho.",
  },
  {
    question: "Como cancelo minha assinatura?",
    answer:
      "A cobrança é feita pela loja (Google Play ou App Store). O cancelamento é nas Assinaturas do seu aparelho — seus dados continuam salvos.",
  },
  {
    question: "Troquei de celular. E os meus dados?",
    answer:
      "Nada se perde: entre com o mesmo e-mail no aparelho novo e suas vendas, clientes e receitas voltam automaticamente.",
  },
  {
    question: "Achei um erro ou tenho uma ideia",
    answer:
      "Manda pra gente! Feedback de quem usa todo dia é o que faz o Lucro Caseiro melhorar. Use o botão abaixo.",
  },
];

function openSupportEmail() {
  const subject = encodeURIComponent("Suporte Lucro Caseiro");
  const body = encodeURIComponent(
    "Oi! Preciso de ajuda com:\n\n\n---\n(Conte o que aconteceu que a gente resolve.)",
  );
  void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
}

export default function SupportScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const { data: profile } = useProfile();
  const isPremium =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "prioritySupport");

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {!isDesktop && <ScreenHeader title="Suporte" />}

      <ScrollView
        contentContainerStyle={[
          {
            padding: spacing.xl,
            paddingTop: spacing.md,
            gap: spacing.lg,
          },
          desktopContained(isDesktop, 960),
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isPremium ? (
          <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Ionicons name="diamond" size={20} color={theme.colors.premium} />
              <Typography variant="h3" color={theme.colors.premium}>
                Atendimento prioritário
              </Typography>
            </View>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Como assinante, você fala direto com a gente e tem prioridade nas respostas.
              Tô aqui pra te ajudar a vender mais tranquila. 🧡
            </Typography>
            <Button
              title="Falar com o suporte"
              size="lg"
              icon={
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.colors.textOnPrimary}
                />
              }
              onPress={openSupportEmail}
              style={desktopAction(isDesktop, 240)}
            />
            <Typography variant="caption" style={{ textAlign: "center" }}>
              {SUPPORT_EMAIL}
            </Typography>
          </Card>
        ) : (
          <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Ionicons name="diamond-outline" size={20} color={theme.colors.premium} />
              <Typography variant="h3" color={theme.colors.premium}>
                Suporte prioritário
              </Typography>
            </View>
            <Typography variant="body" color={theme.colors.textSecondary}>
              O atendimento com prioridade faz parte do plano pago. Assine pra falar
              direto com a gente sempre que precisar.
            </Typography>
            <Button
              title="Ver planos"
              size="lg"
              onPress={() => router.push("/plans")}
              style={desktopAction(isDesktop, 240)}
            />
          </Card>
        )}

        <View style={{ gap: spacing.sm }}>
          <Typography variant="bodyBold" color={theme.colors.text}>
            Perguntas frequentes
          </Typography>
          {FAQ.map((item) => (
            <Card key={item.question} variant="surface" padding="lg" style={{ gap: 6 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <Ionicons
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
                style={{ fontSize: 14, lineHeight: 20 }}
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
