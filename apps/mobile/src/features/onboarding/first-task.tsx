import { Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useBrandScreenPalette } from "../../shared/brand-palette";
import { AppIcon } from "../../shared/components/app-icon";
import { TutorialVideoModal } from "../../shared/guidance/tutorial-video-modal";
import { TutorialVideoThumb } from "../../shared/guidance/tutorial-video-thumb";
import { getTutorialVideoForArea } from "../../shared/guidance/tutorial-videos";
import type { BusinessProfileAnswers } from "./profile-data";
import { welcomeContent, type WelcomeRoute } from "./welcome-content";

/**
 * Boas-vindas do primeiro acesso, depois do questionário do negócio. O texto,
 * a conta de exemplo e o vídeo seguem a prioridade escolhida; quem pulou o
 * questionário vê a versão de preço. Mostra o resultado antes de a pessoa
 * começar e deixa ela seguir para o Início se preferir.
 */
export function FirstTask({
  name,
  profile = null,
  onStart,
  onExplore,
}: Readonly<{
  name?: string;
  profile?: BusinessProfileAnswers | null;
  onStart: (route: WelcomeRoute) => Promise<boolean>;
  onExplore: () => Promise<boolean>;
}>) {
  const content = welcomeContent(profile);
  const startLabel = content.action.label;
  const colors = useBrandScreenPalette();
  const { theme } = useTheme();
  // No escuro o vinho some no fundo; o botão principal usa o rosa da marca.
  const light = theme.mode === "light";
  const actionFill = light ? colors.wineFill : colors.rose;
  const onAction = light ? colors.onWine : colors.onRose;
  const lock = useRef(false);
  const [saving, setSaving] = useState<"start" | "explore" | null>(null);
  const [failed, setFailed] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const tutorial = getTutorialVideoForArea(content.videoArea);
  const firstName = name?.trim().split(/\s+/)[0];

  async function run(kind: "start" | "explore") {
    if (lock.current) return;
    lock.current = true;
    setVideoOpen(false);
    setSaving(kind);
    setFailed(false);
    try {
      const ok =
        kind === "start" ? await onStart(content.action.route) : await onExplore();
      setFailed(!ok);
    } catch {
      setFailed(true);
    } finally {
      lock.current = false;
      setSaving(null);
    }
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* O topo é vinho: ícones claros na barra de status do Android e do iPhone. */}
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <SafeAreaView
          edges={["top"]}
          style={{
            backgroundColor: colors.wineFill,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 560,
              alignSelf: "center",
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.lg,
              // Sobra para o cartão de exemplo subir por cima do bloco.
              paddingBottom: 72,
              gap: spacing.sm,
            }}
          >
            <Typography variant="captionBold" color={colors.onWineMuted}>
              Lucro Caseiro
            </Typography>
            <Typography
              variant="h1"
              accessibilityRole="header"
              color={colors.onWine}
              style={{ marginTop: spacing.sm }}
            >
              {firstName ? `Conta criada, ${firstName}.` : "Conta criada."}{" "}
              {content.headline}
            </Typography>
            <Typography variant="body" color={colors.onWineMuted}>
              {content.subtitle}
            </Typography>
          </View>
        </SafeAreaView>

        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 560,
            alignSelf: "center",
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.lg,
            marginTop: -56,
            gap: spacing.md,
          }}
        >
          <View
            style={{
              padding: spacing.md,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.white,
              gap: spacing.xs,
            }}
          >
            <Typography variant="bodyBold" color={colors.wine}>
              {content.example.title}
            </Typography>
            {content.example.rows.map((row) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: spacing.md,
                }}
              >
                <Typography variant="body" color={colors.muted} style={{ flexShrink: 1 }}>
                  {row.label}
                </Typography>
                <Typography
                  variant="bodyBold"
                  color={colors.ink}
                  style={{ flexShrink: 1, textAlign: "right" }}
                >
                  {row.value}
                </Typography>
              </View>
            ))}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.sm,
                marginTop: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: 14,
                backgroundColor: colors.lime,
              }}
            >
              <Typography variant="bodyBold" color={colors.onLime}>
                {content.example.highlight.label}
              </Typography>
              <Typography variant="h2" color={colors.onLime}>
                {content.example.highlight.value}
              </Typography>
            </View>
          </View>

          {tutorial ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver como funciona (${tutorial.video.durationLabel})`}
              onPress={() => setVideoOpen(true)}
              disabled={saving !== null}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                padding: spacing.sm,
                borderRadius: 18,
                backgroundColor: colors.softRose,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <TutorialVideoThumb
                shape="landscape"
                durationLabel={tutorial.video.durationLabel}
              />
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold" color={colors.wine}>
                  Ver como funciona
                </Typography>
                <Typography variant="caption" color={colors.muted}>
                  {tutorial.video.title}
                </Typography>
              </View>
              <AppIcon name="chevron-forward" size={20} color={colors.wine} />
            </Pressable>
          ) : null}

          <View style={{ flex: 1 }} />

          {failed ? (
            <Typography
              variant="body"
              accessibilityRole="alert"
              color={colors.muted}
              style={{ textAlign: "center" }}
            >
              Não foi possível continuar. Confira sua conexão e tente novamente.
            </Typography>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={startLabel}
            accessibilityState={{ disabled: saving !== null, busy: saving === "start" }}
            disabled={saving !== null}
            onPress={() => void run("start")}
            style={({ pressed }) => ({
              minHeight: 56,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: 18,
              backgroundColor: actionFill,
              opacity: pressed || saving === "explore" ? 0.8 : 1,
            })}
          >
            {saving === "start" ? (
              <ActivityIndicator color={onAction} />
            ) : (
              <>
                <Typography
                  variant="bodyBold"
                  color={onAction}
                  style={{ flexShrink: 1, textAlign: "center" }}
                >
                  {startLabel}
                </Typography>
                <AppIcon name="arrow-forward" size={20} color={onAction} />
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={saving !== null}
            onPress={() => void run("explore")}
            style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}
          >
            <Typography variant="bodyBold" color={colors.muted}>
              {saving === "explore" ? "Abrindo o Início…" : "Conhecer o app primeiro"}
            </Typography>
          </Pressable>
        </View>
      </ScrollView>

      {tutorial ? (
        <TutorialVideoModal
          visible={videoOpen}
          video={tutorial.video}
          url={tutorial.url}
          onClose={() => setVideoOpen(false)}
          actionLabel={startLabel}
          onAction={() => void run("start")}
        />
      ) : null}
    </SafeAreaView>
  );
}
