import { requireOptionalNativeModule } from "expo";
import React, { useEffect } from "react";
import { View } from "react-native";

/**
 * Builds antigos (anteriores ao expo-video) não têm o módulo nativo; importar
 * o pacote nesses binários derruba o app. Só carrega quando ele existe.
 */
export const hasNativeVideoPlayer = requireOptionalNativeModule("ExpoVideo") != null;

/** Player do tutorial dentro do app (Android e iPhone), em formato vertical. */
export function NativeTutorialPlayer({
  url,
  title,
  onError,
}: Readonly<{ url: string; title: string; onError: () => void }>) {
  const { useVideoPlayer, VideoView } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("expo-video") as typeof import("expo-video");
  const player = useVideoPlayer(url, (instance) => {
    instance.play();
  });

  useEffect(() => {
    const subscription = player.addListener("statusChange", ({ status }) => {
      if (status === "error") onError();
    });
    return () => subscription.remove();
  }, [player, onError]);

  return (
    <View
      style={{
        alignSelf: "center",
        width: "100%",
        maxWidth: 300,
        aspectRatio: 9 / 16,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#24181E",
      }}
    >
      <VideoView
        player={player}
        accessibilityLabel={title}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        nativeControls
        allowsFullscreen
      />
    </View>
  );
}
