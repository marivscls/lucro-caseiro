import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { AppIcon } from "../components/app-icon";
import { FormActions } from "../components/form-layout";
import { StandardModal } from "../components/standard-modal";
import { useBrandScreenPalette } from "../brand-palette";
import { NativeTutorialPlayer, hasNativeVideoPlayer } from "./native-tutorial-player";
import { TutorialVideoThumb } from "./tutorial-video-thumb";
import type { TutorialVideoSpec } from "./tutorial-videos";

export interface TutorialVideoModalProps {
  readonly visible: boolean;
  readonly video: TutorialVideoSpec;
  readonly url: string;
  readonly onClose: () => void;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export function TutorialVideoModal({
  visible,
  video,
  url,
  onClose,
  actionLabel,
  onAction,
}: TutorialVideoModalProps) {
  const { theme } = useTheme();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const loadFailed = failedUrl === url;
  const colors = useBrandScreenPalette();

  function openNative() {
    void WebBrowser.openBrowserAsync(url, {
      toolbarColor: colors.wineFill,
      controlsColor: colors.onWine,
      secondaryToolbarColor: colors.wineFill,
      showTitle: false,
      enableBarCollapsing: true,
      // Android: ao voltar, a aba fecha e a pessoa cai de novo nesta tela.
      createTask: false,
    });
  }

  function renderPlayer() {
    if (Platform.OS !== "web" && hasNativeVideoPlayer && !loadFailed) {
      // Só monta com o modal aberto: fechado, o player não toca nem baixa nada.
      return visible ? (
        <NativeTutorialPlayer
          key={url}
          url={url}
          title={video.title}
          onError={() => setFailedUrl(url)}
        />
      ) : null;
    }
    if (Platform.OS !== "web") {
      // Build sem player nativo, ou o player falhou: a capa mostra o que vem e
      // o vídeo abre numa aba do navegador com as cores do app (Custom Tab no
      // Android).
      return (
        <View style={{ alignItems: "center", gap: spacing.lg }}>
          <Pressable
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            onPress={openNative}
          >
            <TutorialVideoThumb shape="hero" durationLabel={video.durationLabel} />
          </Pressable>
          <Button
            style={{ alignSelf: "stretch" }}
            title={`Assistir vídeo (${video.durationLabel})`}
            size="lg"
            icon={
              <AppIcon
                name="play-circle-outline"
                size={20}
                color={theme.colors.textOnPrimary}
              />
            }
            onPress={openNative}
          />
        </View>
      );
    }

    if (loadFailed) {
      return (
        <View
          style={{
            padding: spacing.lg,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            gap: spacing.xs,
          }}
        >
          <Typography variant="bodyBold" color={theme.colors.text}>
            Não foi possível carregar o vídeo agora
          </Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Confira sua conexão com a internet e tente novamente em instantes.
          </Typography>
        </View>
      );
    }

    return (
      <View
        style={{
          alignSelf: "center",
          width: "100%",
          maxWidth: 300,
          aspectRatio: 9 / 16,
          borderRadius: radii.lg,
          overflow: "hidden",
          backgroundColor: "#24181E",
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        {React.createElement("video", {
          key: url,
          src: url,
          controls: true,
          autoPlay: true,
          playsInline: true,
          preload: "metadata",
          "aria-label": video.title,
          onError: () => setFailedUrl(url),
          style: {
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            backgroundColor: "#24181E",
          },
        })}
      </View>
    );
  }

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title={video.title}
      subtitle={`Vídeo rápido · ${video.durationLabel}`}
      footer={
        onAction && actionLabel ? (
          <FormActions>
            <Button title={actionLabel} onPress={onAction} />
          </FormActions>
        ) : undefined
      }
    >
      <Typography variant="body" color={theme.colors.textSecondary}>
        {video.summary}
      </Typography>
      {renderPlayer()}
    </StandardModal>
  );
}
