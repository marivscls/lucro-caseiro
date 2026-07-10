import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { isProfilePremiumActive, useProfile } from "../features/subscription/hooks";

const SUPPORT_EMAIL = "lazuria.design@gmail.com";

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
  const router = useRouter();
  const { data: profile } = useProfile();
  const isPremium = isProfilePremiumActive(profile);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={10}
          style={{ width: 32, height: 40, justifyContent: "center" }}
        >
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </Pressable>
        <Typography
          variant="h1"
          color={theme.colors.text}
          style={{ flex: 1, fontSize: 26, fontWeight: "800" }}
        >
          Suporte
        </Typography>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingTop: spacing.md,
          gap: spacing.lg,
        }}
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
            <Button title="Ver planos" size="lg" onPress={() => router.push("/plans")} />
          </Card>
        )}

        <View style={{ gap: spacing.sm }}>
          <Typography
            variant="bodyBold"
            color={theme.colors.text}
            style={{ fontSize: 17 }}
          >
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
