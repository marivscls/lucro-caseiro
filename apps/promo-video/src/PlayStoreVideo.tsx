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

const COLORS = {
  background: "#FAFAF8",
  ink: "#2A2421",
  muted: "#716964",
  primary: "#C4707E",
  primaryDark: "#A84857",
  primarySoft: "#F9E7EA",
  surface: "#F4F3F1",
  green: "#2E8B62",
  brown: "#342824",
  white: "#FFFFFF",
};

const FONT_DISPLAY = "FrauncesPromo, Georgia, serif";
const FONT_BODY = "NunitoSansPromo, Arial, sans-serif";

const easing = {
  easing: Easing.bezier(0.16, 1, 0.3, 1),
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const reveal = (frame: number, delay = 0, duration = 18) =>
  interpolate(frame, [delay, delay + duration], [0, 1], easing);

const Background = ({dark = false}: {dark?: boolean}) => {
  const frame = useCurrentFrame();
  const base = dark ? COLORS.brown : COLORS.background;
  const accent = dark ? "#523A35" : COLORS.primarySoft;

  return (
    <AbsoluteFill style={{backgroundColor: base, overflow: "hidden"}}>
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: "50%",
          backgroundColor: accent,
          right: -300,
          top: -410,
          translate: `${interpolate(frame, [0, 130], [0, -45])}px ${interpolate(frame, [0, 130], [0, 55])}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 560,
          height: 560,
          borderRadius: "50%",
          border: `72px solid ${accent}`,
          left: -350,
          bottom: -330,
          translate: `${interpolate(frame, [0, 130], [0, 50])}px 0px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          borderRadius: "50%",
          backgroundColor: dark ? "#E7A6B2" : COLORS.primary,
          left: 86,
          top: 82,
          boxShadow: dark
            ? "28px 0 0 #E7A6B2, 56px 0 0 #E7A6B2"
            : `28px 0 0 ${COLORS.primary}, 56px 0 0 ${COLORS.primary}`,
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
  const textColor = dark ? COLORS.white : COLORS.ink;
  const bodyColor = dark ? "#EBDDD7" : COLORS.muted;

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
            gap: 26,
          }}
        >
          <div
            style={{
              color: dark ? "#E7A6B2" : COLORS.primaryDark,
              fontFamily: FONT_BODY,
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: 3.2,
              textTransform: "uppercase",
              opacity: reveal(frame),
              translate: `${interpolate(reveal(frame), [0, 1], [-35, 0])}px 0px`,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              color: textColor,
              fontFamily: FONT_DISPLAY,
              fontSize: 92,
              lineHeight: 0.98,
              letterSpacing: -2.4,
              opacity: reveal(frame, 3),
              translate: `${interpolate(reveal(frame, 3), [0, 1], [-42, 0])}px 0px`,
            }}
          >
            {title}
          </div>
          <div
            style={{
              maxWidth: 660,
              color: bodyColor,
              fontFamily: FONT_BODY,
              fontSize: 42,
              lineHeight: 1.22,
              opacity: reveal(frame, 10),
            }}
          >
            {body}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              marginTop: 8,
              color: dark ? "#F0C5CD" : COLORS.primaryDark,
              fontFamily: FONT_BODY,
              fontSize: 28,
              fontWeight: 800,
              opacity: reveal(frame, 16),
            }}
          >
            <div
              style={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                backgroundColor: dark ? "#E7A6B2" : COLORS.primary,
              }}
            />
            Lucro Caseiro
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
        name="Tela de precificação ao fundo"
        src="07-precificacao.png"
        style={{
          width: 350,
          height: 778,
          left: 70,
          top: 190,
          rotate: "-8deg",
          opacity: 0.42,
        }}
      />
      <PhoneScreen
        name="Tela financeira ao fundo"
        src="05-financeiro.png"
        delay={4}
        style={{
          width: 350,
          height: 778,
          left: 390,
          top: 150,
          rotate: "6deg",
          opacity: 0.42,
        }}
      />
      <AbsoluteFill
        style={{
          padding: "90px 90px 90px 870px",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 24,
        }}
      >
        <Interactive.Div
          name="Ícone atual do Lucro Caseiro"
          style={{
            width: 190,
            height: 190,
            borderRadius: 48,
            overflow: "hidden",
            boxShadow: "0 30px 70px rgba(0, 0, 0, 0.3)",
            opacity: iconProgress,
            scale: interpolate(iconProgress, [0, 1], [0.78, 1]),
          }}
        >
          <Img
            alt="Ícone do Lucro Caseiro"
            src={staticFile("play-store/icon.png")}
            style={{width: "100%", height: "100%", scale: 1.65}}
          />
        </Interactive.Div>
        <div
          style={{
            color: COLORS.white,
            fontFamily: FONT_DISPLAY,
            fontSize: 96,
            lineHeight: 0.98,
            letterSpacing: -2.5,
            opacity: reveal(frame, 9),
          }}
        >
          Seu negócio
          <br />
          merece clareza.
        </div>
        <div
          style={{
            maxWidth: 790,
            color: "#EBDDD7",
            fontFamily: FONT_BODY,
            fontSize: 40,
            lineHeight: 1.2,
            opacity: reveal(frame, 15),
          }}
        >
          Gestão simples para quem produz, vende ou presta serviços.
        </div>
        <div
          style={{
            marginTop: 14,
            padding: "22px 38px",
            borderRadius: 999,
            color: COLORS.white,
            backgroundColor: COLORS.primary,
            fontFamily: FONT_BODY,
            fontSize: 34,
            fontWeight: 800,
            opacity: reveal(frame, 20),
            scale: interpolate(reveal(frame, 20), [0, 1], [0.9, 1]),
          }}
        >
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
