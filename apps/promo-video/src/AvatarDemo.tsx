import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { AvatarDemoCaptions } from "./AvatarDemoCaptions";
import { MARKETING_COLORS, MARKETING_FONTS } from "./marketing-brand";

const FPS = 30;
const DURATION_IN_FRAMES = 640;

const motion = {
  easing: Easing.bezier(0.16, 1, 0.3, 1),
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const ProductScreen = ({
  src,
  eyebrow,
  title,
}: {
  src: string;
  eyebrow: string;
  title: string;
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ padding: "92px 72px 214px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 860,
          opacity: interpolate(frame, [0, 12], [0, 1], motion),
          translate: `${interpolate(frame, [0, 18], [-34, 0], motion)}px 0`,
        }}
      >
        <div
          style={{
            color: MARKETING_COLORS.rose,
            fontFamily: MARKETING_FONTS.body,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            color: MARKETING_COLORS.wine,
            fontFamily: MARKETING_FONTS.display,
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 0.98,
            letterSpacing: -2.5,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 68,
          top: 330,
          width: 590,
          height: 1278,
          padding: 14,
          borderRadius: 66,
          background: MARKETING_COLORS.ink,
          boxShadow: "0 44px 100px rgba(74, 35, 50, 0.22)",
          opacity: interpolate(frame, [5, 24], [0, 1], motion),
          translate: `0 ${interpolate(frame, [5, 24], [80, 0], motion)}px`,
          rotate: `${interpolate(frame, [5, 24], [-2.4, 0], motion)}deg`,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top",
            borderRadius: 52,
            scale: interpolate(frame, [18, 150], [1, 1.035], motion),
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          right: 48,
          top: 570,
          width: 290,
          padding: "24px 26px",
          borderRadius: 30,
          background: MARKETING_COLORS.lime,
          color: MARKETING_COLORS.ink,
          fontFamily: MARKETING_FONTS.body,
          fontSize: 34,
          fontWeight: 800,
          lineHeight: 1.08,
          boxShadow: "0 20px 50px rgba(74, 35, 50, 0.16)",
          opacity: interpolate(frame, [22, 38], [0, 1], motion),
          translate: `${interpolate(frame, [22, 38], [42, 0], motion)}px 0`,
        }}
      >
        Veja enquanto ela explica
      </div>
    </AbsoluteFill>
  );
};

const OpeningOverlay = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        zIndex: 4,
        background:
          "linear-gradient(180deg, rgba(36,24,30,0.06) 24%, rgba(36,24,30,0.78) 100%)",
        padding: "120px 78px 312px",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          alignSelf: "flex-start",
          maxWidth: 900,
          color: MARKETING_COLORS.white,
          fontFamily: MARKETING_FONTS.display,
          fontSize: 90,
          fontWeight: 800,
          lineHeight: 0.98,
          letterSpacing: -3,
          textShadow: "0 8px 32px rgba(36,24,30,0.28)",
          opacity: interpolate(frame, [4, 20], [0, 1], motion),
          translate: `0 ${interpolate(frame, [4, 20], [46, 0], motion)}px`,
        }}
      >
        Sua rotina não precisa ser uma bagunça.
      </div>
    </AbsoluteFill>
  );
};

const ClosingOverlay = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        zIndex: 4,
        background:
          "linear-gradient(180deg, rgba(36,24,30,0.12) 18%, rgba(74,35,50,0.9) 100%)",
        padding: "128px 72px 318px",
        justifyContent: "space-between",
      }}
    >
      <Img
        src={staticFile("avatar-demo-logo-oficial.png")}
        style={{
          alignSelf: "flex-end",
          width: 190,
          height: 190,
          objectFit: "cover",
          borderRadius: 42,
          boxShadow: "0 20px 55px rgba(36,24,30,0.22)",
          opacity: interpolate(frame, [0, 15], [0, 1], motion),
          scale: interpolate(frame, [0, 18], [0.82, 1], motion),
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          alignItems: "flex-start",
          opacity: interpolate(frame, [7, 24], [0, 1], motion),
          translate: `0 ${interpolate(frame, [7, 24], [48, 0], motion)}px`,
        }}
      >
        <div
          style={{
            color: MARKETING_COLORS.white,
            fontFamily: MARKETING_FONTS.display,
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 0.98,
            letterSpacing: -2.5,
          }}
        >
          Seu negócio, do seu jeito.
        </div>
        <div
          style={{
            padding: "24px 38px",
            borderRadius: 999,
            background: MARKETING_COLORS.lime,
            color: MARKETING_COLORS.ink,
            fontFamily: MARKETING_FONTS.body,
            fontSize: 40,
            fontWeight: 800,
          }}
        >
          Conheça o Lucro Caseiro
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const AvatarDemoVideo = () => {
  const frame = useCurrentFrame();
  const productPhase = interpolate(
    frame,
    [105, 130, 455, 480],
    [0, 1, 1, 0],
    motion,
  );

  return (
    <AbsoluteFill
      style={{
        background: MARKETING_COLORS.canvas,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 88% 16%, #F5E5E8 0 17%, transparent 43%), #FAF8F6",
        }}
      />

      <Sequence from={120} durationInFrames={130}>
        <ProductScreen
          src="avatar-demo-produtos.png"
          eyebrow="Serviços e produtos"
          title="Cadastre e encontre tudo rápido"
        />
      </Sequence>
      <Sequence from={250} durationInFrames={140}>
        <ProductScreen
          src="avatar-demo-agenda.png"
          eyebrow="Agenda"
          title="Veja os próximos compromissos"
        />
      </Sequence>
      <Sequence from={390} durationInFrames={90}>
        <ProductScreen
          src="avatar-demo-inicio.png"
          eyebrow="Visão geral"
          title="A rotina inteira em um só lugar"
        />
      </Sequence>

      <Sequence durationInFrames={480}>
        <Video
          src={staticFile("avatar-demo-presenter-natural-cut.mp4")}
          objectFit="cover"
          style={{
            position: "absolute",
            zIndex: 3,
            left: interpolate(productPhase, [0, 1], [0, 704]),
            top: interpolate(productPhase, [0, 1], [0, 1030]),
            width: interpolate(productPhase, [0, 1], [1080, 326]),
            height: interpolate(productPhase, [0, 1], [1920, 586]),
            borderRadius: interpolate(productPhase, [0, 1], [0, 54]),
            boxShadow:
              productPhase > 0.2
                ? "0 30px 80px rgba(36, 24, 30, 0.32)"
                : "none",
          }}
        />
      </Sequence>
      <Sequence from={480} durationInFrames={160}>
        <Video
          src={staticFile("avatar-demo-ending-ptbr.mp4")}
          objectFit="cover"
          style={{
            position: "absolute",
            zIndex: 3,
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </Sequence>

      {frame < 120 ? <OpeningOverlay /> : null}
      {frame >= 480 ? (
        <Sequence from={480}>
          <ClosingOverlay />
        </Sequence>
      ) : null}

      <div
        style={{
          position: "absolute",
          zIndex: 5,
          left: 58,
          top: 790,
          width: 28,
          height: 180,
          borderRadius: 999,
          background: MARKETING_COLORS.lime,
          rotate: `${interpolate(frame, [120, 480], [-12, 9], motion)}deg`,
          opacity: productPhase,
        }}
      />

      <div style={{ position: "absolute", inset: 0, zIndex: 8 }}>
        <AvatarDemoCaptions />
      </div>
    </AbsoluteFill>
  );
};

export const AvatarDemoComposition = () => (
  <Composition
    id="LucroCaseiroAvatarDemo"
    component={AvatarDemoVideo}
    durationInFrames={DURATION_IN_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
