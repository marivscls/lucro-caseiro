import { Button, Card, Typography, spacing, useBrand, useTheme } from "@lucro-caseiro/ui";
import { AppIcon } from "../shared/components/app-icon";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import { HelpAssistant } from "../features/help-assistant/help-assistant";
import {
  SupportContactDesktop,
  SupportFaqDesktop,
} from "../features/help-assistant/support-desktop";
import {
  desktopPageContent,
  DesktopPageHeader,
  DesktopSplit,
} from "../shared/layout/desktop-page";
import {
  SUPPORT_EMAIL,
  SUPPORT_RESPONSE_TIME,
  SUPPORT_WHATSAPP_LABEL,
  hasWhatsAppSupport,
  openSupportEmail,
  openSupportWhatsApp,
} from "../shared/utils/support-contact";
import { useProfile } from "../features/subscription/hooks";
import { TutorialVideoModal } from "../shared/guidance/tutorial-video-modal";
import {
  getTutorialVideoUrl,
  TUTORIAL_VIDEOS,
  type TutorialVideoSpec,
} from "../shared/guidance/tutorial-videos";

const WHATSAPP_PAID_HINT = "Quem assina também fala com a gente pelo WhatsApp.";

function contactFaq(whatsapp: boolean): { question: string; answer: string } {
  return {
    question: "Como falo com vocês?",
    answer: whatsapp
      ? `Chame a gente no WhatsApp ${SUPPORT_WHATSAPP_LABEL} ou escreva para ${SUPPORT_EMAIL}. ${SUPPORT_RESPONSE_TIME}`
      : `Escreva para ${SUPPORT_EMAIL} contando em qual tela teve dificuldade. ${SUPPORT_RESPONSE_TIME} ${WHATSAPP_PAID_HINT}`,
  };
}

const STATIC_FAQ: { question: string; answer: string }[] = [
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

export default function SupportScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const experienceCopy = useBusinessCopy();
  const brandName = getBrandDisplayName(useBrand());
  const isDesktop = useDesktopLayout();
  const { data: profile } = useProfile();
  const whatsapp = hasWhatsAppSupport(profile);
  const contactSupport = (question = "") =>
    whatsapp
      ? openSupportWhatsApp(brandName, question)
      : openSupportEmail(brandName, question);
  const [selectedVideo, setSelectedVideo] = useState<{
    video: TutorialVideoSpec;
    url: string;
  } | null>(null);
  const availableVideos = TUTORIAL_VIDEOS.flatMap((video) => {
    const url = getTutorialVideoUrl(video);
    return url ? [{ video, url }] : [];
  });
  const videosSection =
    availableVideos.length > 0 ? (
      <View style={{ gap: spacing.sm }}>
        <Typography variant="bodyBold" color={theme.colors.text}>
          Vídeos rápidos
        </Typography>
        {availableVideos.map(({ video, url }) => (
          <Pressable
            key={video.id}
            accessibilityRole="button"
            onPress={() => setSelectedVideo({ video, url })}
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
          >
            <Card variant="surface" padding="lg" style={{ gap: 6 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <AppIcon
                  name="play-circle-outline"
                  size={22}
                  color={theme.colors.primaryStrong}
                />
                <Typography
                  variant="bodyBold"
                  color={theme.colors.text}
                  style={{ flex: 1 }}
                >
                  {video.title}
                </Typography>
                <Typography variant="captionBold" color={theme.colors.primaryStrong}>
                  {video.durationLabel}
                </Typography>
              </View>
              <Typography variant="body" color={theme.colors.textSecondary}>
                {video.summary}
              </Typography>
            </Card>
          </Pressable>
        ))}
      </View>
    ) : null;
  const faq = [
    contactFaq(whatsapp),
    ...STATIC_FAQ.slice(0, 1),
    {
      question: "Troquei de celular. E os meus dados?",
      answer: `Nada se perde: entre com o mesmo e-mail no aparelho novo e suas vendas, clientes e ${experienceCopy.formulaNounPlural} voltam automaticamente.`,
    },
    ...STATIC_FAQ.slice(1),
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {isDesktop ? null : <ScreenHeader title="Suporte" />}

      {isDesktop ? (
        <ScrollView
          contentContainerStyle={desktopPageContent(true)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <DesktopPageHeader>
            <ScreenHeader
              title="Suporte"
              subtitle="Tire dúvidas sobre o app ou fale com a gente"
              hideBack
            />
          </DesktopPageHeader>
          <DesktopSplit
            aside={
              <SupportContactDesktop
                email={SUPPORT_EMAIL}
                whatsapp={whatsapp ? SUPPORT_WHATSAPP_LABEL : null}
                responseTime={SUPPORT_RESPONSE_TIME}
                paidHint={WHATSAPP_PAID_HINT}
                onWhatsApp={() => openSupportWhatsApp(brandName)}
                onEmail={() => openSupportEmail(brandName)}
              />
            }
          >
            <HelpAssistant
              desktop
              profile={experienceCopy.profile}
              onNavigate={(route) => router.push(route)}
              onContactSupport={contactSupport}
            />
            {videosSection}
            <SupportFaqDesktop items={faq} />
          </DesktopSplit>
        </ScrollView>
      ) : (
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
          keyboardShouldPersistTaps="handled"
        >
          <HelpAssistant
            profile={experienceCopy.profile}
            onNavigate={(route) => router.push(route)}
            onContactSupport={contactSupport}
          />
          {videosSection}
          <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <AppIcon
                name="chatbubble-ellipses-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
              <Typography variant="h3">Fale com a gente</Typography>
            </View>
            <Typography variant="body" color={theme.colors.textSecondary}>
              O suporte está disponível para todos, em qualquer plano. Conte em qual etapa
              teve dificuldade para a gente ajudar. {SUPPORT_RESPONSE_TIME}
            </Typography>
            {whatsapp ? (
              <Button
                title="Chamar no WhatsApp"
                size="lg"
                icon={
                  <AppIcon
                    name="logo-whatsapp"
                    size={20}
                    color={theme.colors.textOnPrimary}
                  />
                }
                onPress={() => openSupportWhatsApp(brandName)}
                style={desktopAction(isDesktop, 240)}
              />
            ) : null}
            <Button
              title="Enviar e-mail"
              size={whatsapp ? "md" : "lg"}
              variant={whatsapp ? "outline" : "primary"}
              icon={
                <AppIcon
                  name="mail-outline"
                  size={20}
                  color={whatsapp ? theme.colors.primary : theme.colors.textOnPrimary}
                />
              }
              onPress={() => openSupportEmail(brandName)}
              style={desktopAction(isDesktop, 240)}
            />
            <View style={{ gap: 2 }}>
              {whatsapp ? (
                <Typography variant="caption" selectable>
                  WhatsApp: {SUPPORT_WHATSAPP_LABEL}
                </Typography>
              ) : null}
              <Typography variant="caption" selectable>
                E-mail: {SUPPORT_EMAIL}
              </Typography>
              {whatsapp ? null : (
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {WHATSAPP_PAID_HINT}
                </Typography>
              )}
            </View>
          </Card>

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
      )}
      {selectedVideo ? (
        <TutorialVideoModal
          visible
          video={selectedVideo.video}
          url={selectedVideo.url}
          onClose={() => setSelectedVideo(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}
