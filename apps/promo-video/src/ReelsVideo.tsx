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

const FPS = 30;
const TRANSITION_FRAMES = 10;

const SCENE = {
  hook: 90,
  pain: 85,
  pricing: 110,
  money: 110,
  cta: 95,
} as const;

export const REELS_DURATION_IN_FRAMES =
  SCENE.hook +
  SCENE.pain +
  SCENE.pricing +
  SCENE.money +
  SCENE.cta -
  TRANSITION_FRAMES * 4;

const easing = {
  easing: Easing.bezier(0.16, 1, 0.3, 1),
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const SAFE: CSSProperties = {
  paddingTop: 230,
  paddingRight: 150,
  paddingBottom: 300,
  paddingLeft: 86,
};

const reveal = (frame: number, delay = 0, duration = 16) =>
  interpolate(frame, [delay, delay + duration], [0, 1], easing);

const LimeDot = ({size = 16}: {size?: number}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: MARKETING_COLORS.lime,
      flexShrink: 0,
    }}
  />
);

const Backdrop = ({dark = false}: {dark?: boolean}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? MARKETING_COLORS.wine : MARKETING_COLORS.canvas,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 980,
          height: 1100,
          borderRadius: 490,
          backgroundColor: dark ? "#5B3040" : MARKETING_COLORS.roseSoft,
          right: -340,
          top: -120,
          translate: `${interpolate(frame, [0, 120], [0, -28])}px ${interpolate(
            frame,
            [0, 120],
            [0, 22],
          )}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          borderRadius: "50%",
          border: `88px solid ${dark ? "#3A1B28" : MARKETING_COLORS.surface}`,
          left: -300,
          bottom: -280,
        }}
      />
    </AbsoluteFill>
  );
};

const Kicker = ({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Kicker"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        color: light ? MARKETING_COLORS.lime : MARKETING_COLORS.rose,
        fontFamily: MARKETING_FONTS.body,
        fontSize: 32,
        fontWeight: 800,
        letterSpacing: 3.2,
        textTransform: "uppercase",
        textAlign: "center",
        opacity: reveal(frame),
        translate: `${interpolate(reveal(frame), [0, 1], [-28, 0])}px 0px`,
      }}
    >
      <LimeDot />
      {children}
    </Interactive.Div>
  );
};

const Headline = ({
  children,
  light = false,
  size = 86,
}: {
  children: ReactNode;
  light?: boolean;
  size?: number;
}) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Título"
      style={{
        color: light ? MARKETING_COLORS.white : MARKETING_COLORS.ink,
        fontFamily: MARKETING_FONTS.display,
        fontSize: size,
        lineHeight: 0.96,
        fontWeight: 800,
        letterSpacing: -2.8,
        textAlign: "center",
        opacity: reveal(frame, 3),
        scale: interpolate(reveal(frame, 3), [0, 1], [0.94, 1]),
      }}
    >
      {children}
    </Interactive.Div>
  );
};

const Phone = ({
  src,
  name,
  delay = 8,
}: {
  src: string;
  name: string;
  delay?: number;
}) => {
  const frame = useCurrentFrame();
  const progress = reveal(frame, delay, 20);

  return (
    <Interactive.Div
      name={name}
      style={{
        width: 470,
        height: 940,
        padding: 14,
        overflow: "hidden",
        borderRadius: 58,
        backgroundColor: "#211B19",
        boxShadow: "0 36px 80px rgba(36, 24, 30, 0.28)",
        opacity: progress,
        translate: `0px ${interpolate(progress, [0, 1], [70, 0])}px`,
        scale: interpolate(progress, [0, 1], [0.94, 1]),
      }}
    >
      <Img
        alt={name}
        src={staticFile(`play-store/${src}`)}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 44,
          objectFit: "cover",
          objectPosition: "top center",
        }}
      />
    </Interactive.Div>
  );
};

const Hook = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: MARKETING_COLORS.wine}}>
      <Img
        alt="Bolo de chocolate"
        src={staticFile("bolo-chocolate.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.72,
          scale: interpolate(frame, [0, 90], [1.16, 1.04], easing),
          translate: `0px ${interpolate(frame, [0, 90], [18, -18], easing)}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(36, 24, 30, 0.18) 0%, rgba(36, 24, 30, 0.42) 38%, rgba(36, 24, 30, 0.96) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          ...SAFE,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 28,
        }}
      >
        <Kicker light>Para quem vende</Kicker>
        <Headline light size={96}>
          Você sabe quanto
          <br />
          realmente lucra?
        </Headline>
        <Interactive.Div
          name="Subtítulo da abertura"
          style={{
            maxWidth: 780,
            color: "#F0C7D1",
            fontFamily: MARKETING_FONTS.body,
            fontSize: 40,
            lineHeight: 1.2,
            fontWeight: 600,
            textAlign: "center",
            opacity: reveal(frame, 14),
          }}
        >
          Não deixe o trabalho virar prejuízo.
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Pain = () => {
  const frame = useCurrentFrame();
  const items = ["Caderno", "WhatsApp", "Calculadora"];

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill
        style={{
          ...SAFE,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 44,
        }}
      >
        <Kicker>Chega de adivinhar</Kicker>
        <Headline>
          O lucro some
          <br />
          no caminho.
        </Headline>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            width: "100%",
          }}
        >
          {items.map((item, index) => (
            <Interactive.Div
              key={item}
              name={item}
              style={{
                width: 640,
                padding: "28px 0",
                borderRadius: 999,
                backgroundColor: MARKETING_COLORS.white,
                color: MARKETING_COLORS.ink,
                fontFamily: MARKETING_FONTS.body,
                fontSize: 42,
                fontWeight: 800,
                textAlign: "center",
                boxShadow: "0 18px 40px rgba(36, 24, 30, 0.10)",
                opacity: reveal(frame, 12 + index * 8),
                translate: `0px ${interpolate(
                  reveal(frame, 12 + index * 8),
                  [0, 1],
                  [36, 0],
                )}px`,
              }}
            >
              {item}
            </Interactive.Div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ProductScene = ({
  kicker,
  title,
  screenshot,
  screenshotName,
}: {
  kicker: string;
  title: ReactNode;
  screenshot: string;
  screenshotName: string;
}) => (
  <AbsoluteFill>
    <Backdrop />
    <AbsoluteFill
      style={{
        ...SAFE,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <Kicker>{kicker}</Kicker>
        <Headline size={78}>{title}</Headline>
      </div>
      <Phone src={screenshot} name={screenshotName} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Closing = () => {
  const frame = useCurrentFrame();
  const iconProgress = reveal(frame, 2, 18);

  return (
    <AbsoluteFill>
      <Backdrop dark />
      <AbsoluteFill
        style={{
          ...SAFE,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 36,
        }}
      >
        <Interactive.Div
          name="Ícone atual do Lucro Caseiro"
          style={{
            width: 280,
            height: 280,
            borderRadius: 72,
            overflow: "hidden",
            boxShadow: "0 34px 72px rgba(0, 0, 0, 0.28)",
            opacity: iconProgress,
            scale: interpolate(iconProgress, [0, 1], [0.78, 1]),
            rotate: `${interpolate(iconProgress, [0, 1], [-8, 0])}deg`,
          }}
        >
          <Img
            alt="Ícone do Lucro Caseiro"
            src={staticFile("play-store/icon.png")}
            style={{width: "100%", height: "100%", scale: 1.16}}
          />
        </Interactive.Div>
        <Headline light size={88}>
          Transforme trabalho
          <br />
          em lucro.
        </Headline>
        <Interactive.Div
          name="Chamada para ação"
          style={{
            backgroundColor: MARKETING_COLORS.rose,
            color: MARKETING_COLORS.white,
            padding: "30px 64px",
            borderRadius: 999,
            fontFamily: MARKETING_FONTS.body,
            fontSize: 42,
            fontWeight: 800,
            boxShadow: "0 22px 48px rgba(0, 0, 0, 0.24)",
            opacity: reveal(frame, 16),
            scale: interpolate(reveal(frame, 16), [0, 1], [0.86, 1]),
          }}
        >
          Baixe grátis
        </Interactive.Div>
        <Interactive.Div
          name="Nome da marca"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: MARKETING_COLORS.canvas,
            fontFamily: MARKETING_FONTS.body,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 3.4,
            textTransform: "uppercase",
            opacity: reveal(frame, 24),
          }}
        >
          <LimeDot size={14} />
          Lucro Caseiro
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const PhotoScene = ({
  src,
  alt,
  kicker,
  title,
  subtitle,
  cta,
  duration = 90,
  focus = "50% 18%",
}: {
  src: string;
  alt: string;
  kicker: string;
  title: ReactNode;
  subtitle?: string;
  cta?: string;
  duration?: number;
  focus?: string;
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: MARKETING_COLORS.wine}}>
      <Img
        alt={alt}
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: focus,
          scale: interpolate(frame, [0, duration], [1.12, 1.03], easing),
          translate: `0px ${interpolate(frame, [0, duration], [14, -12], easing)}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(36, 24, 30, 0.08) 0%, rgba(36, 24, 30, 0.28) 42%, rgba(36, 24, 30, 0.94) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          ...SAFE,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Kicker light>{kicker}</Kicker>
        <Headline light size={88}>
          {title}
        </Headline>
        {subtitle ? (
          <Interactive.Div
            name="Subtítulo"
            style={{
              maxWidth: 780,
              color: "#F0C7D1",
              fontFamily: MARKETING_FONTS.body,
              fontSize: 40,
              lineHeight: 1.2,
              fontWeight: 600,
              textAlign: "center",
              opacity: reveal(frame, 14),
            }}
          >
            {subtitle}
          </Interactive.Div>
        ) : null}
        {cta ? (
          <Interactive.Div
            name="Chamada para ação"
            style={{
              backgroundColor: MARKETING_COLORS.rose,
              color: MARKETING_COLORS.white,
              padding: "30px 64px",
              borderRadius: 999,
              fontFamily: MARKETING_FONTS.body,
              fontSize: 42,
              fontWeight: 800,
              boxShadow: "0 22px 48px rgba(0, 0, 0, 0.24)",
              opacity: reveal(frame, 16),
              scale: interpolate(reveal(frame, 16), [0, 1], [0.86, 1]),
            }}
          >
            {cta}
          </Interactive.Div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const transition = linearTiming({durationInFrames: TRANSITION_FRAMES});

export const ReelsVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={SCENE.hook} name="Gancho">
      <Hook />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={SCENE.pain} name="Dor">
      <Pain />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({direction: "from-bottom"})}
      timing={transition}
    />
    <TransitionSeries.Sequence durationInFrames={SCENE.pricing} name="Precificação">
      <ProductScene
        kicker="Preço sem chute"
        title={
          <>
            Calcule custo
            <br />
            e margem
          </>
        }
        screenshot="07-precificacao.png"
        screenshotName="Precificação"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({direction: "from-right"})}
      timing={transition}
    />
    <TransitionSeries.Sequence durationInFrames={SCENE.money} name="Financeiro">
      <ProductScene
        kicker="Clareza no dinheiro"
        title={
          <>
            Entra. Sai.
            <br />
            Sobra.
          </>
        }
        screenshot="05-financeiro.png"
        screenshotName="Financeiro"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={SCENE.cta} name="Chamada">
      <Closing />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);

export const ReelsComposition = () => (
  <Composition
    id="LucroCaseiroReels"
    component={ReelsVideo}
    durationInFrames={REELS_DURATION_IN_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

export const ReelsCharacterVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={SCENE.hook} name="Gancho com personagem">
      <PhotoScene
        src="reels-character-hook.png"
        alt="Empreendedora falando para a câmera"
        kicker="Para quem vende"
        title={
          <>
            Você sabe quanto
            <br />
            realmente lucra?
          </>
        }
        subtitle="Não deixe o trabalho virar prejuízo."
        duration={SCENE.hook}
        focus="48% 12%"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={SCENE.pain} name="Dor com personagem">
      <PhotoScene
        src="reels-character-pain.png"
        alt="Empreendedora conferindo caderno e celular"
        kicker="Chega de adivinhar"
        title={
          <>
            Caderno, WhatsApp
            <br />
            e calculadora.
          </>
        }
        subtitle="O lucro some no caminho."
        duration={SCENE.pain}
        focus="42% 10%"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({direction: "from-bottom"})}
      timing={transition}
    />
    <TransitionSeries.Sequence durationInFrames={SCENE.pricing} name="Precificação">
      <ProductScene
        kicker="Preço sem chute"
        title={
          <>
            Calcule custo
            <br />
            e margem
          </>
        }
        screenshot="07-precificacao.png"
        screenshotName="Precificação"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({direction: "from-right"})}
      timing={transition}
    />
    <TransitionSeries.Sequence durationInFrames={SCENE.money} name="Financeiro">
      <ProductScene
        kicker="Clareza no dinheiro"
        title={
          <>
            Entra. Sai.
            <br />
            Sobra.
          </>
        }
        screenshot="05-financeiro.png"
        screenshotName="Financeiro"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transition} />
    <TransitionSeries.Sequence durationInFrames={SCENE.cta} name="Chamada com personagem">
      <PhotoScene
        src="reels-character-cta.png"
        alt="Empreendedora com caixa de encomenda"
        kicker="Lucro Caseiro"
        title={
          <>
            Transforme trabalho
            <br />
            em lucro.
          </>
        }
        cta="Baixe grátis"
        duration={SCENE.cta}
        focus="46% 16%"
      />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);

export const ReelsCharacterComposition = () => (
  <Composition
    id="LucroCaseiroReelsPersonagem"
    component={ReelsCharacterVideo}
    durationInFrames={REELS_DURATION_IN_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
