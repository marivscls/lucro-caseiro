import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { isPaidPlan } from "@lucro-caseiro/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Linking, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { ScreenHeader } from "../../../shared/components/screen-header";
import { SkeletonCard } from "../../../shared/components/skeleton";
import { useAuth } from "../../../shared/hooks/use-auth";
import {
  desktopAction,
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { alertError } from "../../../shared/utils/alerts";
import { subscriptionManagementTarget } from "../../../shared/utils/subscription-management";
import {
  cancelStripeSubscription,
  fetchStripeSubscription,
  resumeStripeSubscription,
  type StripeSubscriptionSummary,
} from "../api";
import {
  cancelProvider,
  googlePlayCopy,
  stripeStatusCopy,
  type CancelPlanCopy,
} from "../cancel-plan";
import { activePlan, useProfile } from "../hooks";

const STRIPE_KEY = ["subscription", "stripe"] as const;

async function openUrl(url: string, fallback: string) {
  try {
    await Linking.openURL(url);
  } catch {
    showAlert({ title: "Cancelar assinatura", message: fallback });
  }
}

function StatusCard({ copy }: Readonly<{ copy: CancelPlanCopy }>) {
  const { theme } = useTheme();
  return (
    <Card
      style={{
        backgroundColor: theme.colors.premiumBg,
        borderWidth: 1,
        borderColor: theme.colors.premium,
        gap: spacing.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <AppIcon name="time-outline" size={22} color={theme.colors.premium} />
        <Typography variant="h3" style={{ flex: 1 }}>
          {copy.title}
        </Typography>
      </View>
      <Typography variant="body" color={theme.colors.text}>
        {copy.message}
      </Typography>
    </Card>
  );
}

/**
 * Tela de cancelamento da assinatura (inclusive do teste de 7 dias com cartão).
 * No cartão (Stripe) cancela aqui mesmo, sem cobrar de novo; na Google Play leva
 * para a gestão de assinaturas da loja, que é onde o Google permite cancelar.
 */
export function CancelPlanView() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const paid = isPaidPlan(activePlan(profile));
  const provider = cancelProvider(profile, Platform.OS);
  const usesStripe = paid && provider === "stripe";

  const stripeQuery = useQuery({
    queryKey: STRIPE_KEY,
    queryFn: () => fetchStripeSubscription(token!),
    enabled: !!token && usesStripe,
  });

  function applySummary(summary: StripeSubscriptionSummary) {
    queryClient.setQueryData(STRIPE_KEY, summary);
    void queryClient.invalidateQueries({ queryKey: ["subscription", "profile"] });
  }

  const cancelMutation = useMutation({
    mutationFn: () => cancelStripeSubscription(token!),
    onSuccess: (summary) => {
      applySummary(summary);
      const copy = stripeStatusCopy(summary);
      showAlert({ title: copy.title, message: copy.message });
    },
    onError: (error) => alertError(error, "Não foi possível cancelar. Tente novamente."),
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeStripeSubscription(token!),
    onSuccess: (summary) => {
      applySummary(summary);
      showAlert({
        title: "Assinatura mantida",
        message: "Pronto! Seu Premium continua normalmente.",
      });
    },
    onError: (error) => alertError(error, "Não foi possível desfazer. Tente novamente."),
  });

  const summary = stripeQuery.data ?? null;
  const onTrial = summary?.status === "trialing";
  const busy = cancelMutation.isPending || resumeMutation.isPending;

  function confirmCancel() {
    showAlert({
      title: onTrial ? "Cancelar o teste?" : "Cancelar a assinatura?",
      message: onTrial
        ? "Você não vai pagar nada. O Premium continua liberado até o fim do teste e depois sua conta volta para o Gratuito, com seus dados salvos."
        : "Você não paga mais nada. O Premium continua liberado até o fim do período pago e depois sua conta volta para o Gratuito, com seus dados salvos.",
      buttons: [
        { text: "Voltar", style: "cancel" },
        {
          text: onTrial ? "Cancelar teste" : "Cancelar assinatura",
          style: "destructive",
          onPress: () => cancelMutation.mutate(),
        },
      ],
    });
  }

  let body: React.ReactNode;
  if (profileLoading || (usesStripe && stripeQuery.isLoading)) {
    body = <SkeletonCard lines={3} />;
  } else if (!paid) {
    body = (
      <>
        <StatusCard
          copy={{
            title: "Você está no plano Gratuito",
            message: "Não há assinatura para cancelar e nada é cobrado.",
          }}
        />
        <Button
          title="Ver planos"
          variant="outline"
          size="lg"
          onPress={() => router.replace("/plans")}
          style={desktopAction(isDesktop, 240)}
        />
      </>
    );
  } else if (provider === "google_play") {
    const target = subscriptionManagementTarget("android");
    body = (
      <>
        <StatusCard copy={googlePlayCopy(profile)} />
        <Button
          title={target.actionLabel}
          size="lg"
          onPress={() =>
            void openUrl(
              target.url,
              "Abra o app da Google Play, toque na sua foto, depois em Pagamentos e assinaturas > Assinaturas > Lucro Caseiro > Cancelar assinatura.",
            )
          }
          style={desktopAction(isDesktop, 280)}
        />
      </>
    );
  } else if (summary) {
    body = (
      <>
        <StatusCard copy={stripeStatusCopy(summary)} />
        {summary.cancelAtPeriodEnd ? (
          <Button
            title="Manter minha assinatura"
            size="lg"
            loading={resumeMutation.isPending}
            disabled={busy}
            onPress={() => resumeMutation.mutate()}
            style={desktopAction(isDesktop, 280)}
          />
        ) : (
          <Button
            title={onTrial ? "Cancelar teste" : "Cancelar assinatura"}
            variant="outline"
            size="lg"
            loading={cancelMutation.isPending}
            disabled={busy}
            onPress={confirmCancel}
            style={desktopAction(isDesktop, 280)}
          />
        )}
      </>
    );
  } else {
    // Plano pago sem assinatura no cartão encontrada (ex.: assinatura antiga ou
    // feita em outro aparelho): o suporte cancela.
    const target = subscriptionManagementTarget("web");
    body = (
      <>
        <StatusCard
          copy={{
            title: "Fale com a gente para cancelar",
            message:
              "Não encontramos uma assinatura no cartão nesta conta. Se você assinou pela Google Play, cancele por lá. Se não, mande um e-mail e cancelamos para você.",
          }}
        />
        <Button
          title={target.actionLabel}
          variant="outline"
          size="lg"
          onPress={() =>
            void openUrl(
              target.url,
              "Não foi possível abrir o e-mail. Escreva para contato@orionseven.com.br.",
            )
          }
          style={desktopAction(isDesktop, 280)}
        />
      </>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Cancelar assinatura" />
      <ScrollView
        contentContainerStyle={[
          {
            ...pageGutter(isDesktop),
            paddingTop: spacing.xl,
            paddingBottom: spacing["3xl"],
            gap: spacing.xl,
          },
          desktopStretch(isDesktop, desktopWidths.wide),
        ]}
      >
        <Typography variant="body">
          Cancelar é simples e você não perde seus dados. Veja abaixo o que acontece com a
          sua assinatura.
        </Typography>
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}
