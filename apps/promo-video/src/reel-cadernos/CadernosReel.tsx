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

// Reel 1080x1920, 30 fps, 41 s: a semana de uma encomenda ilustrativa de 80
// cadernos, de segunda (pedido na conversa) a sexta (entrega), com as telas
// reais da Agenda no meio.
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const SCENE = {
  hook: { from: 0, duration: 105 },
  monday: { from: 105, duration: 105 },
  tuesday: { from: 210, duration: 135 },
  wednesday: { from: 345, duration: 135 },
  thursday: { from: 480, duration: 135 },
  app: { from: 615, duration: 360 },
  friday: { from: 975, duration: 105 },
  closing: { from: 1080, duration: 150 },
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

const NAMES = ["Ana", "Davi", "Lia"];

const Notebook = ({
  width,
  index,
  name,
  done = 0,
  style,
}: {
  width: number;
  index: number;
  name?: string;
  done?: number;
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
          }}
        />
      ))}
      {done > 0 ? (
        <div
          style={{
            position: "absolute",
            right: -width * 0.08,
            bottom: -width * 0.08,
            width: width * 0.42,
            height: width * 0.42,
            borderRadius: width,
            backgroundColor: C.lime,
            color: C.wine,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.display,
            fontWeight: 800,
            fontSize: width * 0.26,
            opacity: done,
            scale: interpolate(done, [0, 1], [0.4, 1]),
          }}
        >
          ✓
        </div>
      ) : null}
    </div>
  );
};

const IllustrativeTag = ({ dark = false }: { dark?: boolean }) => (
  <div
    style={{
      position: "absolute",
      top: SAFE.top,
      left: SAFE.left,
      padding: "12px 24px",
      borderRadius: 999,
      backgroundColor: dark ? C.wine : C.white,
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
        lineHeight: 1.08,
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

// Faixa de segunda a sexta: mostra em que dia da semana a história está.
const DAYS = [
  { day: "seg", date: 28 },
  { day: "ter", date: 29 },
  { day: "qua", date: 30 },
  { day: "qui", date: 1 },
  { day: "sex", date: 2 },
];

const WeekTracker = ({ current }: { current: number }) => {
  const frame = useCurrentFrame();
  const pulse = reveal(frame, 0, 12);
  return (
    <div
      style={{
        position: "absolute",
        top: SAFE.top + 90,
        left: SAFE.left,
        width: CONTENT_W,
        display: "flex",
        justifyContent: "center",
        gap: 14,
      }}
    >
      {DAYS.map(({ day, date }, index) => {
        const isCurrent = index === current;
        const isPast = index < current;
        return (
          <div
            key={day}
            style={{
              width: 150,
              height: 104,
              borderRadius: 26,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isCurrent
                ? C.wine
                : index === 4
                  ? C.roseSoft
                  : C.white,
              border: isCurrent ? "none" : `3px solid ${C.roseSoft}`,
              color: isCurrent ? C.white : isPast ? C.muted : C.ink,
              fontFamily: F.body,
              scale: isCurrent ? interpolate(pulse, [0, 1], [0.85, 1.06]) : 1,
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 700 }}>
              {isPast ? "✓ " : ""}
              {day}
            </div>
            <div style={{ fontSize: 40, fontWeight: 800 }}>{date}</div>
          </div>
        );
      })}
    </div>
  );
};

// Área das legendas da história, logo abaixo da faixa da semana.
const StoryCaption = ({
  children,
  size = 74,
  delay = 4,
}: {
  children: ReactNode;
  size?: number;
  delay?: number;
}) => (
  <AbsoluteFill
    style={{
      top: SAFE.top + 220,
      left: SAFE.left,
      width: CONTENT_W,
      height: 260,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Caption size={size} delay={delay}>
      {children}
    </Caption>
  </AbsoluteFill>
);

const Stage = ({ children }: { children: ReactNode }) => {
  const frame = useCurrentFrame();
  const inP = reveal(frame, 0, 10);
  return (
    <AbsoluteFill
      style={{
        top: SAFE.top + 500,
        height: HEIGHT - SAFE.top - 500 - SAFE.bottom + 60,
        left: SAFE.left,
        width: CONTENT_W,
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

type ChatItem = { text: string; at: number; mine?: boolean; order?: boolean };

// Conversa genérica, sem marca: serve para mostrar o pedido se perdendo.
const ChatBox = ({
  items,
  scrollFrames = [0, 1],
  scrollValues = [0, 0],
}: {
  items: ChatItem[];
  scrollFrames?: number[];
  scrollValues?: number[];
}) => {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, scrollFrames, scrollValues, {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <div
      style={{
        position: "relative",
        width: 800,
        height: 660,
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
          top: 130 - scroll,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {items.map((item) => {
          const p = reveal(frame, item.at, 8);
          return (
            <div
              key={item.text}
              style={{
                alignSelf: item.mine ? "flex-end" : "flex-start",
                maxWidth: 600,
                padding: "22px 28px",
                borderRadius: 30,
                backgroundColor: item.mine ? C.roseSoft : C.white,
                border: item.order ? `4px solid ${C.rose}` : "none",
                color: C.ink,
                fontFamily: F.body,
                fontSize: 38,
                fontWeight: item.order ? 800 : 600,
                lineHeight: 1.2,
                opacity: p,
                scale: interpolate(p, [0, 1], [0.9, 1]),
              }}
            >
              {item.text}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 100,
          display: "flex",
          alignItems: "center",
          gap: 18,
          paddingLeft: 34,
          backgroundColor: "#E4DCD5",
          fontFamily: F.body,
          fontSize: 34,
          fontWeight: 800,
          color: C.ink,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#C9BEB6",
          }}
        />
        Cliente (exemplo)
      </div>
    </div>
  );
};

const ORDER_TEXT = "Quero 80 cadernos com capa com nome. Entrega sexta às 14h!";

const OTHER_MESSAGES = [
  "Bom dia! Ainda faz agenda?",
  "Quanto fica o bloco?",
  "Manda foto das cores?",
  "Consegue pra amanhã?",
  "Te mando o endereço",
  "Obrigada! 😊",
];

// 0–3,5 s: oitenta cadernos alinhados e a frase de impacto, já no primeiro quadro.
const Hook = () => {
  const frame = useCurrentFrame();
  const cols = 8;
  const rows = 10;
  const cell = WIDTH / cols;
  const bookWidth = cell * 0.74;
  const rowHeight = HEIGHT / rows;
  const zoom = interpolate(frame, [0, SCENE.hook.duration], [1.12, 1], ease);

  return (
    <AbsoluteFill style={{ backgroundColor: C.canvas, overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: zoom }}>
        {Array.from({ length: cols * rows }).map((_, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: col * cell + (cell - bookWidth) / 2 + 4,
                top: row * rowHeight + (rowHeight - bookWidth * 1.36) / 2,
              }}
            >
              <Notebook width={bookWidth} index={index + row} />
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          left: SAFE.left - 20,
          width: CONTENT_W + 40,
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <div
          style={{
            padding: "54px 56px",
            borderRadius: 48,
            backgroundColor: C.wine,
            boxShadow: "0 40px 90px rgba(36, 24, 30, 0.35)",
          }}
        >
          <Caption color={C.white} size={118} delay={-14}>
            80 cadernos.
          </Caption>
          <Caption
            color={C.lime}
            size={92}
            delay={-8}
            style={{ marginTop: 14 }}
          >
            Entrega na sexta.
          </Caption>
        </div>
        <div
          style={{
            padding: "26px 40px",
            borderRadius: 36,
            backgroundColor: C.white,
            boxShadow: "0 24px 60px rgba(36, 24, 30, 0.25)",
            ...rise(reveal(frame, 44, 12), 30),
          }}
        >
          <Caption size={58} delay={44}>
            E o pedido? <span style={{ color: C.rose }}>Só na conversa.</span>
          </Caption>
        </div>
      </AbsoluteFill>
      <IllustrativeTag />
    </AbsoluteFill>
  );
};

const StoryScene = ({
  day,
  children,
}: {
  day: number;
  children: ReactNode;
}) => (
  <AbsoluteFill style={{ backgroundColor: C.canvas }}>
    {children}
    <IllustrativeTag />
    <WeekTracker current={day} />
  </AbsoluteFill>
);

// Segunda: o pedido chega pela conversa.
const Monday = () => (
  <StoryScene day={0}>
    <StoryCaption>
      Segunda: o pedido
      <br />
      <span style={{ color: C.rose }}>chega na conversa.</span>
    </StoryCaption>
    <Stage>
      <ChatBox
        items={[
          { text: ORDER_TEXT, at: 14, order: true },
          { text: "Fechado! Pode deixar 😉", at: 52, mine: true },
        ]}
      />
    </Stage>
  </StoryScene>
);

const NamesRow = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 34 }}>
      {NAMES.map((name, index) => {
        const typed = Math.floor(
          interpolate(
            frame,
            [8 + index * 10, 16 + index * 10],
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
  );
};

// Terça: a produção começa e o pedido vai subindo na conversa.
const Tuesday = () => (
  <StoryScene day={1}>
    <Sequence durationInFrames={62} layout="none">
      <StoryCaption>
        Terça: capa com nome,
        <br />
        <span style={{ color: C.rose }}>uma por uma.</span>
      </StoryCaption>
      <Stage>
        <NamesRow />
      </Stage>
    </Sequence>
    <Sequence from={62} layout="none">
      <StoryCaption>
        Enquanto isso, o pedido
        <br />
        <span style={{ color: C.rose }}>vai sumindo na conversa.</span>
      </StoryCaption>
      <Stage>
        <ChatBox
          items={[
            { text: ORDER_TEXT, at: -10, order: true },
            { text: "Fechado! Pode deixar 😉", at: -10, mine: true },
            ...OTHER_MESSAGES.map((text, index) => ({
              text,
              at: 8 + index * 8,
            })),
          ]}
          scrollFrames={[10, 66]}
          scrollValues={[0, 760]}
        />
      </Stage>
    </Sequence>
  </StoryScene>
);

// Quarta: chega um ajuste e bate a dúvida do horário.
const Wednesday = () => (
  <StoryScene day={2}>
    <Sequence durationInFrames={62} layout="none">
      <StoryCaption>
        Quarta: chega
        <br />
        <span style={{ color: C.rose }}>um ajuste.</span>
      </StoryCaption>
      <Stage>
        <ChatBox
          items={[
            { text: OTHER_MESSAGES[4], at: -10 },
            { text: OTHER_MESSAGES[5], at: -10 },
            { text: "Dá pra 12 capas serem rosa?", at: 12, order: true },
            { text: "Dá sim!", at: 36, mine: true },
          ]}
        />
      </Stage>
    </Sequence>
    <Sequence from={62} layout="none">
      <StoryCaption size={80}>
        Espera… a entrega era
        <br />
        <span style={{ color: C.rose }}>às 14h ou às 16h?</span>
      </StoryCaption>
      <Stage>
        <ChatBox
          items={[
            { text: ORDER_TEXT, at: -10, order: true },
            ...OTHER_MESSAGES.map((text) => ({ text, at: -10 })),
            { text: "Dá pra 12 capas serem rosa?", at: -10 },
          ]}
          scrollFrames={[0, 20, 40, 60]}
          scrollValues={[900, 520, 700, 300]}
        />
      </Stage>
    </Sequence>
  </StoryScene>
);

// Quinta: faltam cadernos e a pergunta do roteiro.
const Thursday = () => {
  const frame = useCurrentFrame();
  const count = Math.round(interpolate(frame, [0, 40], [38, 52], clamp));
  return (
    <StoryScene day={3}>
      <StoryCaption size={74} delay={6}>
        Você guardaria
        <br />
        esse pedido
        <br />
        <span style={{ color: C.rose }}>só na conversa?</span>
      </StoryCaption>
      <Stage>
        <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
          <div style={{ position: "relative", width: 300, height: 480 }}>
            {Array.from({ length: Math.round(count / 5) }).map((_, layer) => (
              <div
                key={layer}
                style={{
                  position: "absolute",
                  left: (layer % 2) * 8,
                  bottom: layer * 44,
                  width: 290,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: layer % 2 === 0 ? NAVY : MUSTARD,
                  boxShadow: "0 6px 14px rgba(36,24,30,0.18)",
                }}
              />
            ))}
          </div>
          <div>
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
      </Stage>
    </StoryScene>
  );
};

// Tela real do app num celular, com destaque em coordenadas da captura (1080 px de largura).
const SCREEN_W = 540;
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
        top: SAFE.top + 330,
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
        top: SAFE.top + 80,
        left: SAFE.left,
        width: CONTENT_W,
        height: 230,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Caption size={74}>{title}</Caption>
    </AbsoluteFill>
    {children}
  </AbsoluteFill>
);

const APP_SHOT = 72;

// Telas reais para registrar e acompanhar a encomenda na Agenda.
const AppScenes = () => (
  <AbsoluteFill style={{ backgroundColor: C.canvas }}>
    <Sequence durationInFrames={APP_SHOT} layout="none">
      <AppShot
        title={
          <>
            Agora no app:
            <br />
            <span style={{ color: C.rose }}>anote a encomenda</span>
          </>
        }
      >
        <Phone
          src="01-form-pedido.png"
          highlight={{ x: 42, y: 888, w: 996, h: 122 }}
        />
      </AppShot>
    </Sequence>
    <Sequence from={APP_SHOT} durationInFrames={APP_SHOT} layout="none">
      <AppShot
        title={
          <>
            Prazo certo:
            <br />
            <span style={{ color: C.rose }}>sexta, 02/10, às 14h</span>
          </>
        }
      >
        <Phone
          src="02-form-agenda.png"
          highlight={{ x: 42, y: 906, w: 996, h: 526 }}
        />
      </AppShot>
    </Sequence>
    <Sequence from={APP_SHOT * 2} durationInFrames={APP_SHOT} layout="none">
      <AppShot
        title={
          <>
            A semana toda
            <br />
            <span style={{ color: C.rose }}>na Agenda</span>
          </>
        }
      >
        <Phone
          src="04-agenda-depois.png"
          highlight={{ x: 53, y: 1673, w: 972, h: 290 }}
        />
      </AppShot>
    </Sequence>
    <Sequence from={APP_SHOT * 3} durationInFrames={APP_SHOT} layout="none">
      <AppShot
        title={
          <>
            Os detalhes
            <br />
            <span style={{ color: C.rose }}>junto do pedido</span>
          </>
        }
      >
        <Phone
          src="05-detalhe.png"
          highlight={{ x: 30, y: 1290, w: 1020, h: 300 }}
        />
      </AppShot>
    </Sequence>
    <Sequence from={APP_SHOT * 4} durationInFrames={APP_SHOT} layout="none">
      <AppShot
        title={
          <>
            E o andamento:
            <br />
            <span style={{ color: C.rose }}>produzindo</span>
          </>
        }
      >
        <Phone
          src="05-detalhe.png"
          nextSrc="06-detalhe-produzindo.png"
          swapAt={24}
          tapAt={22}
          highlightAt={8}
          highlight={{ x: 550, y: 1752, w: 487, h: 125 }}
        />
      </AppShot>
    </Sequence>
    <IllustrativeTag />
    <div
      style={{
        position: "absolute",
        top: SAFE.top + 10,
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

// Sexta: os 80 cadernos ganham check, um a um.
const Friday = () => {
  const frame = useCurrentFrame();
  const cols = 10;
  const rows = 8;
  const bookWidth = 66;
  const gapX = (CONTENT_W - cols * bookWidth) / (cols - 1);
  return (
    <StoryScene day={4}>
      <StoryCaption size={84}>
        Sexta, 14h:
        <br />
        <span style={{ color: C.rose }}>80 de 80. Entregue.</span>
      </StoryCaption>
      <Stage>
        <div style={{ position: "relative", width: CONTENT_W, height: 810 }}>
          {Array.from({ length: cols * rows }).map((_, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: col * (bookWidth + gapX),
                  top: row * 102,
                }}
              >
                <Notebook
                  width={bookWidth}
                  index={index + row}
                  done={reveal(frame, 10 + index * 0.9, 8)}
                />
              </div>
            );
          })}
        </div>
      </Stage>
    </StoryScene>
  );
};

// Fecho e assinatura.
const Closing = ({ withComment }: { withComment: boolean }) => {
  const frame = useCurrentFrame();
  const brand = reveal(frame, 40, 14);
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
          delay={64}
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
        from={SCENE.monday.from}
        durationInFrames={SCENE.monday.duration}
      >
        <Monday />
      </Sequence>
      <Sequence
        from={SCENE.tuesday.from}
        durationInFrames={SCENE.tuesday.duration}
      >
        <Tuesday />
      </Sequence>
      <Sequence
        from={SCENE.wednesday.from}
        durationInFrames={SCENE.wednesday.duration}
      >
        <Wednesday />
      </Sequence>
      <Sequence
        from={SCENE.thursday.from}
        durationInFrames={SCENE.thursday.duration}
      >
        <Thursday />
      </Sequence>
      <Sequence from={SCENE.app.from} durationInFrames={SCENE.app.duration}>
        <AppScenes />
      </Sequence>
      <Sequence
        from={SCENE.friday.from}
        durationInFrames={SCENE.friday.duration}
      >
        <Friday />
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
