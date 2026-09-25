import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Html5Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

import {
  MARKETING_COLORS as C,
  MARKETING_FONTS as F,
} from "../marketing-brand";

// Reel 1080x1920, 30 fps, 21 s: encomenda ilustrativa de 80 cadernos para sexta.
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const SCENE = {
  hook: { from: 0, duration: 60 },
  production: { from: 60, duration: 180 },
  app: { from: 240, duration: 240 },
  closing: { from: 480, duration: 150 },
} as const;

export const CADERNOS_REEL_DURATION =
  SCENE.closing.from + SCENE.closing.duration;

// Área segura para Reels e TikTok: nada importante sob o topo, a legenda e os botões.
const SAFE = { top: 250, bottom: 400, left: 90, right: 150 } as const;

const CONTENT_W = WIDTH - SAFE.left - SAFE.right + 60;

const NAVY = "#27406B";
const MUSTARD = "#E8B931";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) };

const reveal = (frame: number, delay = 0, duration = 14) =>
  interpolate(frame, [delay, delay + duration], [0, 1], ease);

const rise = (progress: number, distance = 40): CSSProperties => ({
  opacity: progress,
  translate: `0px ${interpolate(progress, [0, 1], [distance, 0])}px`,
});

const NAMES = ["Ana", "Davi", "Lia", "Theo", "Bia", "Enzo", "Malu", "Caio"];

const Notebook = ({
  width,
  index,
  name,
  style,
}: {
  width: number;
  index: number;
  name?: string;
  style?: CSSProperties;
}) => {
  const height = width * 1.36;
  const cover = index % 2 === 0 ? NAVY : MUSTARD;
  const band = index % 2 === 0 ? MUSTARD : NAVY;
  const rings = 7;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: width * 0.06,
        backgroundColor: cover,
        boxShadow: `0 ${width * 0.06}px ${width * 0.12}px rgba(36, 24, 30, 0.22)`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: width * 0.2,
          right: 0,
          bottom: height * 0.1,
          height: height * 0.08,
          backgroundColor: band,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.26,
          right: width * 0.1,
          top: height * 0.2,
          height: height * 0.24,
          borderRadius: width * 0.04,
          backgroundColor: C.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.ink,
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: width * 0.15,
          overflow: "hidden",
        }}
      >
        {name}
      </div>
      {Array.from({ length: rings }).map((_, ring) => (
        <div
          key={ring}
          style={{
            position: "absolute",
            left: -width * 0.05,
            top: height * (0.08 + (ring * 0.84) / (rings - 1)) - width * 0.035,
            width: width * 0.14,
            height: width * 0.07,
            borderRadius: width * 0.04,
            border: `${Math.max(2, width * 0.018)}px solid #C9CDD3`,
            backgroundColor: "transparent",
          }}
        />
      ))}
    </div>
  );
};

const IllustrativeTag = ({ dark = false }: { dark?: boolean }) => (
  <div
    style={{
      position: "absolute",
      top: SAFE.top - 90,
      left: SAFE.left,
      padding: "12px 24px",
      borderRadius: 999,
      backgroundColor: dark ? "rgba(255,255,255,0.14)" : C.white,
      border: dark ? "none" : `2px solid ${C.roseSoft}`,
      color: dark ? C.white : C.wine,
      fontFamily: F.body,
      fontSize: 34,
      fontWeight: 800,
      letterSpacing: 0.4,
    }}
  >
    Exemplo ilustrativo
  </div>
);

const Caption = ({
  children,
  size = 78,
  color = C.ink,
  delay = 0,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  delay?: number;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        color,
        fontFamily: F.display,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.05,
        letterSpacing: -1.5,
        textAlign: "center",
        width: "100%",
        ...rise(reveal(frame, delay), 30),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// 0–2 s: oitenta cadernos alinhados e a frase de impacto.
const Hook = () => {
  const frame = useCurrentFrame();
  const cols = 8;
  const rows = 10;
  const cell = WIDTH / cols;
  const bookWidth = cell * 0.74;
  const rowHeight = HEIGHT / rows;
  const zoom = interpolate(frame, [0, SCENE.hook.duration], [1.1, 1], ease);

  return (
    <AbsoluteFill style={{ backgroundColor: C.canvas, overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: zoom }}>
        {Array.from({ length: cols * rows }).map((_, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const pop = reveal(frame, (row + col) * 0.9, 10);
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: col * cell + (cell - bookWidth) / 2 + 4,
                top: row * rowHeight + (rowHeight - bookWidth * 1.36) / 2,
                opacity: pop,
                scale: interpolate(pop, [0, 1], [0.6, 1]),
              }}
            >
              <Notebook width={bookWidth} index={index + row} />
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          paddingLeft: SAFE.left,
          paddingRight: SAFE.right - 60,
        }}
      >
        <div
          style={{
            padding: "54px 56px",
            borderRadius: 48,
            backgroundColor: C.wine,
            boxShadow: "0 40px 90px rgba(36, 24, 30, 0.35)",
            ...rise(reveal(frame, 6, 12), 50),
          }}
        >
          <Caption color={C.white} size={118} delay={6}>
            80 cadernos.
          </Caption>
          <Caption
            color={C.lime}
            size={92}
            delay={14}
            style={{ marginTop: 14 }}
          >
            Entrega na sexta.
          </Caption>
        </div>
      </AbsoluteFill>
      <IllustrativeTag />
    </AbsoluteFill>
  );
};

const Panel = ({ children }: { children: ReactNode }) => {
  const frame = useCurrentFrame();
  const inP = reveal(frame, 0, 8);
  return (
    <AbsoluteFill
      style={{
        top: 640,
        height: 880,
        left: SAFE.left,
        width: CONTENT_W,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: inP,
        scale: interpolate(inP, [0, 1], [0.96, 1]),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Stamp = ({ children, delay }: { children: ReactNode; delay: number }) => {
  const frame = useCurrentFrame();
  const p = reveal(frame, delay, 10);
  return (
    <div
      style={{
        marginTop: 26,
        padding: "12px 26px",
        borderRadius: 999,
        backgroundColor: C.lime,
        color: C.wine,
        fontFamily: F.body,
        fontSize: 38,
        fontWeight: 800,
        ...rise(p, 16),
      }}
    >
      {children}
    </div>
  );
};

// Capas ganhando nome, uma a uma.
const NamesPanel = () => {
  const frame = useCurrentFrame();
  return (
    <Panel>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 34 }}>
          {NAMES.slice(0, 3).map((name, index) => {
            const typed = Math.floor(
              interpolate(
                frame,
                [4 + index * 9, 12 + index * 9],
                [0, name.length],
                clamp,
              ),
            );
            return (
              <Notebook
                key={name}
                width={230}
                index={index}
                name={name.slice(0, typed)}
                style={{ rotate: `${(index - 1) * 3}deg` }}
              />
            );
          })}
        </div>
        <Stamp delay={12}>Capa com nome</Stamp>
      </div>
    </Panel>
  );
};

// Pilha crescendo com a contagem.
const StackPanel = () => {
  const frame = useCurrentFrame();
  const count = Math.round(interpolate(frame, [0, 34], [18, 46], clamp));
  const layers = Math.round(interpolate(frame, [0, 34], [4, 11], clamp));
  return (
    <Panel>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 60 }}>
        <div style={{ position: "relative", width: 330, height: 560 }}>
          {Array.from({ length: layers }).map((_, layer) => (
            <div
              key={layer}
              style={{
                position: "absolute",
                left: (layer % 2) * 8,
                bottom: layer * 44,
                width: 320,
                height: 40,
                borderRadius: 8,
                backgroundColor: layer % 2 === 0 ? NAVY : MUSTARD,
                boxShadow: "0 6px 14px rgba(36,24,30,0.18)",
              }}
            />
          ))}
        </div>
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 150,
              fontWeight: 800,
              color: C.wine,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {count}
          </div>
          <div
            style={{
              fontFamily: F.body,
              fontSize: 44,
              fontWeight: 800,
              color: C.muted,
            }}
          >
            de 80 prontos
          </div>
        </div>
      </div>
    </Panel>
  );
};

// A semana até a entrega.
const WeekPanel = () => {
  const frame = useCurrentFrame();
  const days = ["seg", "ter", "qua", "qui", "sex"];
  const dates = [28, 29, 30, 1, 2];
  return (
    <Panel>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          {days.map((day, index) => {
            const isFriday = day === "sex";
            const p = reveal(frame, index * 3, 8);
            return (
              <div
                key={day}
                style={{
                  width: 146,
                  height: 190,
                  borderRadius: 30,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: isFriday ? C.wine : C.white,
                  border: isFriday ? "none" : `3px solid ${C.roseSoft}`,
                  color: isFriday ? C.white : C.ink,
                  fontFamily: F.body,
                  ...rise(p, 24),
                }}
              >
                <div style={{ fontSize: 36, fontWeight: 700 }}>{day}</div>
                <div style={{ fontSize: 58, fontWeight: 800 }}>
                  {dates[index]}
                </div>
              </div>
            );
          })}
        </div>
        <Stamp delay={16}>Entrega: sexta, 14h</Stamp>
      </div>
    </Panel>
  );
};

// Conversa genérica: o pedido sobe e some entre outras mensagens.
const ChatPanel = () => {
  const frame = useCurrentFrame();
  const messages: { text: string; mine?: boolean; order?: boolean }[] = [
    { text: "80 cadernos com capa com nome, entrega sexta 14h", order: true },
    { text: "Bom dia! Ainda faz agenda?" },
    { text: "Faço sim! 😊", mine: true },
    { text: "Quanto fica o bloco?" },
    { text: "Manda foto das cores?" },
    { text: "Consegue pra amanhã?" },
    { text: "Te mando o endereço" },
    { text: "Obrigada!" },
  ];
  const scroll = interpolate(frame, [8, 56], [0, 700], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <Panel>
      <div
        style={{
          position: "relative",
          width: 760,
          height: 780,
          borderRadius: 48,
          backgroundColor: "#EFE9E4",
          overflow: "hidden",
          boxShadow: "0 30px 70px rgba(36,24,30,0.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 34,
            right: 34,
            top: 300 - scroll,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {messages.map((message, index) => (
            <div
              key={message.text}
              style={{
                alignSelf: message.mine ? "flex-end" : "flex-start",
                maxWidth: 560,
                padding: "22px 28px",
                borderRadius: 30,
                backgroundColor: message.mine ? C.roseSoft : C.white,
                border: message.order ? `4px solid ${C.rose}` : "none",
                color: C.ink,
                fontFamily: F.body,
                fontSize: 38,
                fontWeight: message.order ? 800 : 600,
                lineHeight: 1.2,
                opacity: index === 0 ? 1 : reveal(frame, 4 + index * 5, 6),
              }}
            >
              {message.text}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};

// 2–8 s: montagem rápida da produção com a pergunta.
const Production = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.canvas }}>
      <AbsoluteFill
        style={{
          top: SAFE.top,
          left: SAFE.left,
          width: CONTENT_W,
          height: 360,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Caption size={80} delay={4}>
          Você guardaria esse pedido{" "}
          <span style={{ color: C.rose }}>só na conversa?</span>
        </Caption>
      </AbsoluteFill>
      <Sequence durationInFrames={40} layout="none">
        <NamesPanel />
      </Sequence>
      <Sequence from={40} durationInFrames={38} layout="none">
        <StackPanel />
      </Sequence>
      <Sequence from={78} durationInFrames={38} layout="none">
        <WeekPanel />
      </Sequence>
      <Sequence from={116} durationInFrames={64} layout="none">
        <ChatPanel />
      </Sequence>
      <IllustrativeTag />
    </AbsoluteFill>
  );
};

// Tela real do app num celular, com destaque em coordenadas da captura (1080 px de largura).
const SCREEN_W = 560;
const SCREEN_SCALE = SCREEN_W / 1080;
const SCREEN_H = 2401 * SCREEN_SCALE;

type Box = { x: number; y: number; w: number; h: number };

const Phone = ({
  src,
  nextSrc,
  swapAt,
  highlight,
  highlightAt = 16,
  tapAt,
}: {
  src: string;
  nextSrc?: string;
  swapAt?: number;
  highlight?: Box;
  highlightAt?: number;
  tapAt?: number;
}) => {
  const frame = useCurrentFrame();
  const inP = reveal(frame, 0, 10);
  const swap =
    swapAt === undefined
      ? 0
      : interpolate(frame, [swapAt, swapAt + 6], [0, 1], clamp);
  const hl = reveal(frame, highlightAt, 10);
  const tap =
    tapAt === undefined
      ? 0
      : interpolate(frame, [tapAt - 6, tapAt, tapAt + 10], [0, 1, 0], clamp);
  const img: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: SCREEN_W,
    height: SCREEN_H,
  };
  return (
    <div
      style={{
        position: "absolute",
        top: 540,
        left: (WIDTH - SCREEN_W - 28) / 2 - 30,
        padding: 14,
        borderRadius: 60,
        backgroundColor: "#211B19",
        boxShadow: "0 40px 90px rgba(36, 24, 30, 0.28)",
        ...rise(inP, 30),
      }}
    >
      <div
        style={{
          position: "relative",
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: 46,
          overflow: "hidden",
          backgroundColor: C.white,
        }}
      >
        <Img src={staticFile(`reel-cadernos/${src}`)} style={img} />
        {nextSrc ? (
          <Img
            src={staticFile(`reel-cadernos/${nextSrc}`)}
            style={{ ...img, opacity: swap }}
          />
        ) : null}
        {highlight ? (
          <div
            style={{
              position: "absolute",
              left: highlight.x * SCREEN_SCALE - 8,
              top: highlight.y * SCREEN_SCALE - 8,
              width: highlight.w * SCREEN_SCALE + 16,
              height: highlight.h * SCREEN_SCALE + 16,
              borderRadius: 22,
              border: `6px solid ${C.lime}`,
              boxShadow: `0 0 0 9999px rgba(36, 24, 30, ${0.18 * hl})`,
              opacity: hl,
              scale: interpolate(hl, [0, 1], [1.08, 1]),
            }}
          />
        ) : null}
        {tapAt !== undefined && highlight ? (
          <div
            style={{
              position: "absolute",
              left: (highlight.x + highlight.w / 2) * SCREEN_SCALE - 40,
              top: (highlight.y + highlight.h / 2) * SCREEN_SCALE - 40,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(255,255,255,0.75)",
              border: `4px solid ${C.wine}`,
              opacity: tap,
              scale: interpolate(tap, [0, 1], [0.6, 1]),
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

const AppShot = ({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) => (
  <AbsoluteFill>
    <AbsoluteFill
      style={{
        top: SAFE.top,
        left: SAFE.left,
        width: CONTENT_W,
        height: 270,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Caption size={76}>{title}</Caption>
    </AbsoluteFill>
    {children}
  </AbsoluteFill>
);

// 8–16 s: telas reais para registrar e acompanhar a encomenda na Agenda.
const AppScenes = () => (
  <AbsoluteFill style={{ backgroundColor: C.canvas }}>
    <Sequence durationInFrames={60} layout="none">
      <AppShot title="Anote a encomenda">
        <Phone
          src="01-form-pedido.png"
          highlight={{ x: 42, y: 888, w: 996, h: 122 }}
        />
      </AppShot>
    </Sequence>
    <Sequence from={60} durationInFrames={60} layout="none">
      <AppShot
        title={
          <>
            Prazo: <span style={{ color: C.rose }}>sexta, 02/10</span>
          </>
        }
      >
        <Phone
          src="02-form-agenda.png"
          highlight={{ x: 42, y: 906, w: 996, h: 122 }}
        />
      </AppShot>
    </Sequence>
    <Sequence from={120} durationInFrames={60} layout="none">
      <AppShot title="Tudo na Agenda">
        <Phone
          src="04-agenda-depois.png"
          highlight={{ x: 53, y: 1673, w: 972, h: 290 }}
        />
      </AppShot>
    </Sequence>
    <Sequence from={180} durationInFrames={60} layout="none">
      <AppShot
        title={
          <>
            Andamento: <span style={{ color: C.rose }}>produzindo</span>
          </>
        }
      >
        <Phone
          src="05-detalhe.png"
          nextSrc="06-detalhe-produzindo.png"
          swapAt={22}
          tapAt={20}
          highlightAt={8}
          highlight={{ x: 550, y: 1752, w: 487, h: 125 }}
        />
      </AppShot>
    </Sequence>
    <IllustrativeTag />
    <div
      style={{
        position: "absolute",
        top: SAFE.top - 80,
        right: SAFE.right - 40,
        color: C.muted,
        fontFamily: F.body,
        fontSize: 32,
        fontWeight: 700,
      }}
    >
      Telas reais do app
    </div>
  </AbsoluteFill>
);

// 16–21 s: fecho e assinatura.
const Closing = ({ withComment }: { withComment: boolean }) => {
  const frame = useCurrentFrame();
  const brand = reveal(frame, 46, 14);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.wine,
        paddingTop: SAFE.top,
        paddingBottom: SAFE.bottom,
        paddingLeft: SAFE.left,
        paddingRight: SAFE.right - 60,
        alignItems: "center",
        justifyContent: "center",
        gap: 70,
      }}
    >
      <Caption color={C.white} size={92} delay={6}>
        Cada pedido com seu prazo{" "}
        <span style={{ color: C.lime }}>no lugar certo.</span>
      </Caption>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 30,
          ...rise(brand, 30),
        }}
      >
        <Img
          src={staticFile("icon.png")}
          style={{ width: 132, height: 132, borderRadius: 34 }}
        />
        <div
          style={{
            color: C.white,
            fontFamily: F.display,
            fontSize: 78,
            fontWeight: 800,
            letterSpacing: -1.5,
          }}
        >
          Lucro Caseiro
        </div>
      </div>
      {withComment ? (
        <Caption
          color={C.lime}
          size={54}
          delay={70}
          style={{ fontFamily: F.body }}
        >
          Comente AGENDA
          <br />
          que eu te mando o link 👇
        </Caption>
      ) : null}
    </AbsoluteFill>
  );
};

export const CadernosReel = ({ withComment }: { withComment: boolean }) => {
  const frame = useCurrentFrame();
  const volume = interpolate(
    frame,
    [0, 20, CADERNOS_REEL_DURATION - 40, CADERNOS_REEL_DURATION],
    [0, 0.6, 0.6, 0],
    clamp,
  );
  return (
    <AbsoluteFill style={{ backgroundColor: C.canvas }}>
      <Html5Audio
        src={staticFile("reel-cadernos/musica.wav")}
        volume={() => volume}
      />
      <Sequence from={SCENE.hook.from} durationInFrames={SCENE.hook.duration}>
        <Hook />
      </Sequence>
      <Sequence
        from={SCENE.production.from}
        durationInFrames={SCENE.production.duration}
      >
        <Production />
      </Sequence>
      <Sequence from={SCENE.app.from} durationInFrames={SCENE.app.duration}>
        <AppScenes />
      </Sequence>
      <Sequence
        from={SCENE.closing.from}
        durationInFrames={SCENE.closing.duration}
      >
        <Closing withComment={withComment} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const CadernosReelCompositions = () => (
  <>
    <Composition
      id="LucroCaseiroReelCadernos"
      component={CadernosReel}
      defaultProps={{ withComment: false }}
      durationInFrames={CADERNOS_REEL_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="LucroCaseiroReelCadernosComente"
      component={CadernosReel}
      defaultProps={{ withComment: true }}
      durationInFrames={CADERNOS_REEL_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
);
