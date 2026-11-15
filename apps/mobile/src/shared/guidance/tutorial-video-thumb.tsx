import { Typography } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { useBrandScreenPalette } from "../brand-palette";
import { AppIcon } from "../components/app-icon";

const SHAPES = {
  /** Capa grande, no meio de uma tela ainda vazia. */
  hero: { width: 164, height: 236, radius: 20, play: 56, icon: 26, lines: 5 },
  /** Formato de celular: os tutoriais são gravados na vertical. */
  portrait: { width: 76, height: 112, radius: 12, play: 36, icon: 18, lines: 3 },
  /** Faixa baixa, para linhas em que a altura é curta. */
  landscape: { width: 80, height: 56, radius: 12, play: 30, icon: 15, lines: 0 },
} as const;

const LINE_WIDTHS = ["60%", "100%", "75%", "90%", "45%"] as const;

/**
 * Capa do tutorial: lembra a tela do app com o play por cima e a duração no
 * canto. É só o desenho; quem usa envolve num botão com texto.
 */
export function TutorialVideoThumb({
  durationLabel,
  shape = "portrait",
}: Readonly<{ durationLabel: string; shape?: keyof typeof SHAPES }>) {
  const colors = useBrandScreenPalette();
  const size = SHAPES[shape];
  const large = shape === "hero";
  return (
    <View
      style={{
        width: size.width,
        height: size.height,
        borderRadius: size.radius,
        overflow: "hidden",
        backgroundColor: colors.wineFill,
        // No escuro o vinho encosta em fundos parecidos; a borda separa a capa.
        borderWidth: 1,
        borderColor: colors.wineBar,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {size.lines > 0 ? (
        <View
          style={{
            position: "absolute",
            top: large ? 20 : 10,
            left: large ? 18 : 9,
            right: large ? 18 : 9,
            gap: large ? 10 : 6,
          }}
        >
          {LINE_WIDTHS.slice(0, size.lines).map((width) => (
            <View
              key={width}
              style={{
                width,
                height: large ? 8 : 5,
                borderRadius: 4,
                backgroundColor: colors.wineDivider,
              }}
            />
          ))}
        </View>
      ) : null}
      <View
        style={{
          width: size.play,
          height: size.play,
          borderRadius: size.play / 2,
          // O triângulo do play pesa para a esquerda; o recuo o centraliza no olho.
          paddingLeft: large ? 4 : 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.lime,
        }}
      >
        <AppIcon name="play" size={size.icon} color={colors.onLime} />
      </View>
      <View
        style={{
          position: "absolute",
          right: large ? 10 : 5,
          bottom: large ? 10 : 5,
          paddingHorizontal: large ? 8 : 6,
          paddingVertical: large ? 3 : 1,
          borderRadius: 6,
          backgroundColor: "#24181E",
        }}
      >
        <Typography
          variant="captionBold"
          color="#FFFFFF"
          style={{ fontSize: large ? 13 : 12 }}
        >
          {durationLabel}
        </Typography>
      </View>
    </View>
  );
}
