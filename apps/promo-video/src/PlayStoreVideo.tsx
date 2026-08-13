import type {CSSProperties, ReactNode} from "react";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {slide} from "@remotion/transitions/slide";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

import {MARKETING_COLORS, MARKETING_FONTS} from "./marketing-brand";

const COLORS = {
  background: MARKETING_COLORS.canvas,
  ink: MARKETING_COLORS.ink,
  muted: MARKETING_COLORS.muted,
  primary: MARKETING_COLORS.rose,
  primaryDark: MARKETING_COLORS.wine,
  primarySoft: MARKETING_COLORS.roseSoft,
  surface: MARKETING_COLORS.surface,
  green: MARKETING_COLORS.lime,
  brown: MARKETING_COLORS.wine,
  white: MARKETING_COLORS.white,
};

const FONT_DISPLAY = MARKETING_FONTS.display;
const FONT_ACCENT = MARKETING_FONTS.accent;
const FONT_BODY = MARKETING_FONTS.body;

const easing = {
  easing: Easing.bezier(0.16, 1, 0.3, 1),
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const reveal = (frame: number, delay = 0, duration = 18) =>
  interpolate(frame, [delay, delay + duration], [0, 1], easing);

const Background = ({dark = false}: {dark?: boolean}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? COLORS.brown : COLORS.background,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 1110,
          height: 1240,
          borderRadius: 520,
          backgroundColor: dark ? "#5B3040" : COLORS.brown,
          right: -270,
          top: -80,
          translate: `${interpolate(frame, [0, 130], [0, -34])}px ${interpolate(
            frame,
            [0, 130],
            [0, 24],
          )}px`,
        }}
      />
    </AbsoluteFill>
  );
};

type PhoneScreenProps = {
  src: string;
  name: string;
  delay?: number;
  style: CSSProperties;
};

const PhoneScreen = ({src, name, delay = 0, style}: PhoneScreenProps) => {
  const frame = useCurrentFrame();
  const progress = reveal(frame, delay, 20);

  return (
    <Interactive.Div
      name={name}
      style={{
        position: "absolute",
        overflow: "hidden",
        padding: 12,
        borderRadius: 54,
        backgroundColor: "#211B19",
        boxShadow: "0 34px 80px rgba(52, 40, 36, 0.24)",
        opacity: progress,
        translate: `0px ${interpolate(progress, [0, 1], [72, 0])}px`,
        scale: interpolate(progress, [0, 1], [0.94, 1]),
        ...style,
      }}
    >
      <Img
        alt={name}
        src={staticFile(`play-store/${src}`)}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 43,
          objectFit: "cover",
          objectPosition: "top center",
        }}
      />
    </Interactive.Div>
  );
};

type ScreenPairProps = {
  primary: string;
  primaryName: string;
  secondary: string;
  secondaryName: string;
  primaryOnLeft?: boolean;
};

const ScreenPair = ({
  primary,
  primaryName,
  secondary,
  secondaryName,
  primaryOnLeft = false,
}: ScreenPairProps) => (
  <Interactive.Div
    name="Capturas do aplicativo"
    style={{position: "relative", width: 930, height: 960}}
  >
    <PhoneScreen
      name={secondaryName}
      src={secondary}
      delay={8}
      style={{
        width: 350,
        height: 778,
        top: 155,
        left: primaryOnLeft ? 520 : 32,
        rotate: primaryOnLeft ? "4deg" : "-4deg",
        filter: "saturate(0.92)",
      }}
    />
    <PhoneScreen
      name={primaryName}
      src={primary}
      delay={2}
      style={{
        width: 432,
        height: 960,
        top: 0,
        left: primaryOnLeft ? 52 : 430,
        rotate: primaryOnLeft ? "-2deg" : "2deg",
      }}
    />
  </Interactive.Div>
);

type FeatureSceneProps = ScreenPairProps & {
  kicker: string;
  title: ReactNode;
  body: string;
  dark?: boolean;
};

const FeatureScene = ({
  kicker,
  title,
  body,
  dark = false,
  ...screens
}: FeatureSceneProps) => {
  const frame = useCurrentFrame();
  const textColor = dark ? MARKETING_COLORS.canvas : COLORS.ink;
  const bodyColor = dark ? "#EADDE1" : COLORS.muted;

  return (
    <AbsoluteFill>
      <Background dark={dark} />
      <AbsoluteFill
        style={{
          padding: "70px 82px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 64,
        }}
      >
        <Interactive.Div
          name="Mensagem principal"
          style={{
            width: 710,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 23,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: dark ? MARKETING_COLORS.canvas : COLORS.primary,
              fontFamily: FONT_BODY,
              fontSize: 29,
              fontWeight: 800,
              letterSpacing: 2.8,
              textTransform: "uppercase",
              opacity: reveal(frame),
              translate: `${interpolate(reveal(frame), [0, 1], [-35, 0])}px 0px`,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: COLORS.green,
              }}
            />
            {kicker}
          </div>
          <div
            style={{
              color: textColor,
              fontFamily: FONT_DISPLAY,
              fontSize: 90,
              lineHeight: 0.96,
              fontWeight: 800,
              letterSpacing: -3.2,
              opacity: reveal(frame, 3),
              translate: `${interpolate(reveal(frame, 3), [0, 1], [-42, 0])}px 0px`,
            }}
          >
            {title}
          </div>
          <div
            style={{
              maxWidth: 650,
              color: bodyColor,
              fontFamily: FONT_BODY,
              fontSize: 39,
              lineHeight: 1.2,
              fontWeight: 600,
              opacity: reveal(frame, 10),
            }}
          >
            {body}
          </div>
          <div
            style={{
              marginTop: 9,
              color: dark ? MARKETING_COLORS.canvas : COLORS.primaryDark,
              fontFamily: FONT_BODY,
              fontSize: 29,
              fontWeight: 800,
              letterSpacing: -0.3,
              opacity: reveal(frame, 16),
            }}
          >
            lucro caseiro
          </div>
        </Interactive.Div>
        <ScreenPair {...screens} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Closing = () => {
  const frame = useCurrentFrame();
  const iconProgress = reveal(frame, 5, 20);

  return (
    <AbsoluteFill>
      <Background dark />
      <PhoneScreen
        name="Tela financeira ao fundo"
        src="05-financeiro.png"
        delay={3}
        style={{
          width: 390,
          height: 867,
          left: 240,
          top: 110,
          rotate: "-5deg",
        }}
      />
      <AbsoluteFill
        style={{
          padding: "90px 90px 90px 820px",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 24,
        }}
      >
        <Interactive.Div
          name="Ícone atual do Lucro Caseiro"
          style={{
            width: 170,
            height: 170,
            borderRadius: 44,
            overflow: "hidden",
            boxShadow: "0 30px 70px rgba(0, 0, 0, 0.24)",
            opacity: iconProgress,
            scale: interpolate(iconProgress, [0, 1], [0.78, 1]),
          }}
        >
          <Img
            alt="Ícone do Lucro Caseiro"
            src={staticFile("play-store/icon.png")}
            style={{width: "100%", height: "100%", scale: 1.18}}
          />
        </Interactive.Div>
        <div
          style={{
            color: MARKETING_COLORS.canvas,
            fontFamily: FONT_DISPLAY,
            fontSize: 92,
            lineHeight: 0.96,
            fontWeight: 800,
            letterSpacing: -3.2,
            opacity: reveal(frame, 9),
          }}
        >
          Seu negócio merece
          <br />
          <span style={{fontFamily: FONT_ACCENT, fontWeight: 700}}>clareza.</span>
        </div>
        <div
          style={{
            maxWidth: 850,
            color: "#EADDE1",
            fontFamily: FONT_BODY,
            fontSize: 40,
            lineHeight: 1.2,
            fontWeight: 600,
            opacity: reveal(frame, 15),
          }}
        >
          Gestão simples para quem produz, vende ou presta serviços.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 15,
            color: MARKETING_COLORS.canvas,
            fontFamily: FONT_BODY,
            fontSize: 34,
            fontWeight: 800,
            opacity: reveal(frame, 20),
            scale: interpolate(reveal(frame, 20), [0, 1], [0.9, 1]),
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: COLORS.green,
            }}
          />
          Disponível para Android
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const transition = linearTiming({durationInFrames: 10});

export const PlayStoreVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={130} name="Abertura com o app">
      <FeatureScene
        kicker="Tudo no seu ritmo"
        title={
          <>
            Seu negócio,
            <br />
            organizado de verdade
          </>
        }
        body="Venda, acompanhe pedidos e entenda quanto sobra — direto do celular."
        primary="02-nova-venda.png"
        primaryName="Nova venda"
        secondary="08-insights.png"
        secondaryName="Insights"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={130} name="Fluxo de vendas">
      <FeatureScene
        kicker="Da venda ao pagamento"
        title={
          <>
            Registre sem
            <br />
            perder tempo
          </>
        }
        body="Produtos, clientes e status do pedido em um fluxo simples."
        primary="03-vendas.png"
        primaryName="Lista de vendas"
        secondary="02-nova-venda.png"
        secondaryName="Nova venda"
        primaryOnLeft
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({direction: "from-right"})}
      timing={transition}
    />
    <TransitionSeries.Sequence durationInFrames={130} name="Agenda">
      <FeatureScene
        kicker="Agenda sem confusão"
        title={
          <>
            Cada encomenda
            <br />
            no dia certo
          </>
        }
        body="Veja o que está atrasado, o que vem hoje e quanto falta receber."
        primary="04-agenda.png"
        primaryName="Agenda"
        secondary="03-vendas.png"
        secondaryName="Vendas"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({direction: "from-bottom"})}
      timing={transition}
    />
    <TransitionSeries.Sequence durationInFrames={130} name="Precificação">
      <FeatureScene
        kicker="Preço sem chute"
        title={
          <>
            Saiba quanto
            <br />
            cobrar
          </>
        }
        body="Custos, embalagem e lucro por unidade aparecem na mesma conta."
        primary="07-precificacao.png"
        primaryName="Resultado da precificação"
        secondary="06-produtos.png"
        secondaryName="Produtos"
        primaryOnLeft
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={130} name="Financeiro e insights">
      <FeatureScene
        kicker="Clareza sobre o dinheiro"
        title={
          <>
            Veja quanto entra,
            <br />
            sai e sobra
          </>
        }
        body="Acompanhe o mês e entenda a evolução do seu negócio."
        primary="05-financeiro.png"
        primaryName="Financeiro"
        secondary="08-insights.png"
        secondaryName="Insights"
        dark
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({direction: "from-right"})}
      timing={transition}
    />
    <TransitionSeries.Sequence durationInFrames={130} name="Produtos conectados à venda">
      <FeatureScene
        kicker="Uma informação, vários usos"
        title={
          <>
            Do produto
            <br />
            à venda
          </>
        }
        body="Cadastre uma vez e encontre tudo pronto na hora de registrar o pedido."
        primary="06-produtos.png"
        primaryName="Produtos cadastrados"
        secondary="02-nova-venda.png"
        secondaryName="Produtos na nova venda"
        primaryOnLeft
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={90} name="Encerramento">
      <Closing />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);

export const PlayStoreComposition = () => (
  <Composition
    id="LucroCaseiroPlayStore"
    component={PlayStoreVideo}
    durationInFrames={810}
    fps={30}
    width={1920}
    height={1080}
  />
);
