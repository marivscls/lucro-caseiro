import type { ReactNode } from "react";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Sequence,
  Still,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { MARKETING_COLORS } from "./marketing-brand";

// Reel vertical "Pix depois": manicure que terminou o atendimento e ficou
// esperando o Pix. Cena encenada + capturas reais do modo demonstração
// ("Unhas da Bia", dados de exemplo). Funciona sem áudio.

const FPS = 30;
const C = MARKETING_COLORS;
const FONT = "ManropeReel, Arial, sans-serif";

// Área segura TikTok/Instagram (1080x1920): nada importante acima de 220,
// abaixo de 1500 ou à direita de 940.
const SAFE = { top: 220, bottom: 1500, left: 80, right: 940 };
const SAFE_W = SAFE.right - SAFE.left;

// Cenas e transições (slide de 10 quadros entre elas). Total: 660 = 22 s.
const HOOK = 66;
const PROMISES = 160;
const APP = 250;
const CLOSING = 214;
const TRANSITION = 10;
const DURATION = HOOK + PROMISES + APP + CLOSING - 3 * TRANSITION;

const fontFaces = `
@font-face { font-family: "ManropeReel"; font-weight: 500; src: url("${staticFile("reel-pix/Manrope_500Medium.ttf")}") format("truetype"); }
@font-face { font-family: "ManropeReel"; font-weight: 700; src: url("${staticFile("reel-pix/Manrope_700Bold.ttf")}") format("truetype"); }
@font-face { font-family: "ManropeReel"; font-weight: 800; src: url("${staticFile("reel-pix/Manrope_800ExtraBold.ttf")}") format("truetype"); }
`;

const ease = Easing.bezier(0.22, 1, 0.36, 1);

function appear(frame: number, start: number, length = 12) {
  return interpolate(frame, [start, start + length], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

const Canvas = ({
  children,
  background = C.canvas,
}: {
  children: ReactNode;
  background?: string;
}) => (
  <AbsoluteFill style={{ background, fontFamily: FONT, color: C.ink }}>
    <style>{fontFaces}</style>
    {children}
  </AbsoluteFill>
);

// Marca-texto lima que "passa" por trás da palavra.
const Highlight = ({
  children,
  progress = 1,
  color = C.lime,
}: {
  children: ReactNode;
  progress?: number;
  color?: string;
}) => (
  <span
    style={{
      backgroundImage: `linear-gradient(${color}, ${color})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "0 88%",
      backgroundSize: `${progress * 100}% 38%`,
      padding: "0 6px",
      boxDecorationBreak: "clone",
      WebkitBoxDecorationBreak: "clone",
    }}
  >
    {children}
  </span>
);

const IllustrativeTag = () => (
  <div
    style={{
      position: "absolute",
      top: SAFE.top + 4,
      left: SAFE.left,
      fontSize: 26,
      fontWeight: 700,
      color: C.muted,
      letterSpacing: 0.5,
      padding: "8px 18px",
      borderRadius: 999,
      border: `2px solid ${C.roseSoft}`,
      background: C.white,
    }}
  >
    Cena ilustrativa
  </div>
);

/* ---------- 0–2 s: gancho ---------- */

const Hook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = ["Você", "sabe", "quem", "ainda"];
  const mark = appear(frame, 22, 14);
  const last = spring({ frame: frame - 16, fps, config: { damping: 12, mass: 0.6 } });
  return (
    <Canvas>
      <IllustrativeTag />
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          width: SAFE_W,
          top: 520,
          fontSize: 132,
          lineHeight: 1.04,
          fontWeight: 800,
          color: C.wine,
          letterSpacing: -3,
        }}
      >
        <div>
          {words.map((w, i) => {
            const s = spring({ frame: frame - i * 3, fps, config: { damping: 13, mass: 0.5 } });
            return (
              <span
                key={w}
                style={{
                  display: "inline-block",
                  marginRight: 28,
                  opacity: s,
                  transform: `translateY(${(1 - s) * 50}px) scale(${0.85 + s * 0.15})`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 8,
            opacity: last,
            transform: `scale(${0.8 + last * 0.2})`,
            transformOrigin: "left center",
          }}
        >
          <Highlight progress={mark}>falta te pagar?</Highlight>
        </div>
      </div>
    </Canvas>
  );
};

/* ---------- 2–7 s: promessas espalhadas em várias conversas ---------- */

type Chat = { label: string; time: string; text: string | null; at: number };

// Conversas encenadas, sem nome nem telefone. Só as duas falas do roteiro
// aparecem escritas; as outras conversas ficam como "digitando".
const CHATS: Chat[] = [
  { label: "Cliente de terça", time: "terça", text: "Te faço o Pix sexta", at: 4 },
  { label: "Cliente de sábado", time: "sábado", text: "Semana que vem eu acerto", at: 26 },
  { label: "Cliente de ontem", time: "ontem", text: null, at: 46 },
  { label: "Cliente de quinta", time: "quinta", text: null, at: 58 },
  { label: "Cliente de hoje", time: "hoje", text: null, at: 70 },
];
const CARD_H = 212;
const CARD_GAP = 24;

const ChatCard = ({ chat, index, frame }: { chat: Chat; index: number; frame: number }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - chat.at, fps, config: { damping: 15, mass: 0.6 } });
  const bubble = appear(frame, chat.at + 6, 10);
  const dots = Math.floor(frame / 5) % 3;
  const fromRight = index % 2 === 0;
  const tilt = (index % 2 === 0 ? -1 : 1) * (index < 2 ? 0 : 1.2);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        width: SAFE_W,
        height: CARD_H,
        top: index < 2 ? index * (CARD_H + CARD_GAP) : 2 * (CARD_H + CARD_GAP) + (index - 2) * 64,
        opacity: s,
        transform: `translateX(${(1 - s) * (fromRight ? 260 : -260)}px) rotate(${tilt}deg)`,
        background: C.white,
        borderRadius: 36,
        padding: "26px 32px",
        boxShadow: "0 10px 30px rgba(74,35,50,0.10)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            background: C.roseSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill={C.rose}>
            <circle cx="12" cy="8" r="4.2" />
            <path d="M3.5 21c.8-4.3 4.3-6.8 8.5-6.8s7.7 2.5 8.5 6.8z" />
          </svg>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.ink, flex: 1 }}>
          {chat.label}
        </div>
        <div style={{ fontSize: 26, fontWeight: 500, color: C.muted }}>{chat.time}</div>
      </div>
      <div
        style={{
          marginTop: 18,
          display: "inline-block",
          background: chat.text ? C.roseSoft : C.surface,
          borderRadius: "10px 30px 30px 30px",
          padding: "16px 28px",
          fontSize: 46,
          fontWeight: 800,
          color: C.wine,
          opacity: bubble,
          transform: `scale(${0.9 + bubble * 0.1})`,
          transformOrigin: "left top",
        }}
      >
        {chat.text ?? (
          <span style={{ letterSpacing: 8, color: C.muted, fontSize: 36 }}>
            {[0, 1, 2].map((d) => (
              <span key={d} style={{ opacity: d === dots ? 1 : 0.3 }}>
                ●
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
};

const Promises = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // A lista sobe conforme novas conversas chegam: a sensação de perder o fio.
  const scroll = 0;
  const count = CHATS.filter((c) => frame >= c.at).length;
  const stamp = spring({ frame: frame - 104, fps, config: { damping: 11, mass: 0.7 } });
  return (
    <Canvas>
      <IllustrativeTag />
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          width: SAFE_W,
          top: 300,
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontSize: 50,
          fontWeight: 800,
          color: C.wine,
          whiteSpace: "nowrap",
          opacity: appear(frame, 0, 10),
        }}
      >
        Cada promessa numa conversa
        <span
          style={{
            minWidth: 64,
            height: 64,
            borderRadius: 32,
            background: C.rose,
            color: C.white,
            fontSize: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Math.max(1, count)}
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 410,
          height: 1060,
          overflow: "hidden",
          maskImage: "linear-gradient(transparent 0, #000 60px, #000 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(transparent 0, #000 60px, #000 88%, transparent 100%)",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 60 + scroll }}>
          {CHATS.map((chat, i) => (
            <ChatCard key={chat.label} chat={chat} index={i} frame={frame} />
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          width: SAFE_W,
          top: 1300,
          fontSize: 56,
          fontWeight: 800,
          color: C.white,
          background: C.wine,
          borderRadius: 30,
          padding: "26px 30px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(74,35,50,0.3)",
          opacity: Math.min(1, stamp * 1.5),
          transform: `scale(${1.25 - stamp * 0.25}) rotate(${(1 - stamp) * -4}deg)`,
        }}
      >
        Quem já pagou? <span style={{ color: C.lime }}>Quem falta?</span>
      </div>
    </Canvas>
  );
};

/* ---------- 7–15 s: telas reais do app ---------- */

// A tela aparece grande numa janela; a câmera só desliza para a parte da
// captura (1080x2400, 360x800 @3x) que importa, sempre mostrando o trecho
// inteiro que a legenda pede para ler.
const WIN = { left: 110, top: 400, width: 860, height: 1090 };
const SCALE = WIN.width / 1080;
const VISIBLE = WIN.height / SCALE; // ~1369 px da captura

type Rect = { x: number; y: number; w: number; h: number };
type Shot = {
  src: string;
  caption: (mark: number) => ReactNode;
  length: number;
  focus: number; // topo do trecho visível, em px da captura
  tap?: { x: number; y: number; at: number };
  ring?: Rect & { at: number };
};

const SHOTS: Shot[] = [
  {
    src: "pagamento.png",
    caption: (m) => (
      <>
        Marque a venda como <Highlight progress={m}>Fiado</Highlight>
      </>
    ),
    length: 54,
    focus: 770,
    tap: { x: 560, y: 1560, at: 22 },
    ring: { x: 60, y: 1452, w: 960, h: 210, at: 26 },
  },
  {
    src: "revisao.png",
    caption: () => "Confira e registre",
    length: 42,
    focus: 800,
    tap: { x: 760, y: 2010, at: 20 },
  },
  {
    src: "fiado-paula.png",
    caption: (m) => (
      <>
        Veja quem <Highlight progress={m}>falta pagar</Highlight>
      </>
    ),
    length: 52,
    focus: 560,
    ring: { x: 48, y: 1242, w: 984, h: 648, at: 8 },
    tap: { x: 390, y: 1788, at: 40 },
  },
  {
    src: "recebi-dialogo.png",
    caption: (m) => (
      <>
        Pix caiu? Toque em <Highlight progress={m}>Recebi</Highlight>
      </>
    ),
    length: 42,
    focus: 700,
    tap: { x: 732, y: 1308, at: 20 },
  },
  {
    src: "fiado-depois.png",
    caption: (m) => (
      <>
        E sai da lista de <Highlight progress={m}>a receber</Highlight>
      </>
    ),
    length: 60,
    focus: 0,
    ring: { x: 48, y: 216, w: 984, h: 408, at: 8 },
  },
];

const Tap = ({ frame, at, x, y }: { frame: number; at: number; x: number; y: number }) => {
  const local = frame - at;
  if (local < -10 || local > 22) return null;
  const press = interpolate(local, [-10, 0, 6], [0, 1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ripple = interpolate(local, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 110,
          top: y - 110,
          width: 220,
          height: 220,
          borderRadius: 110,
          border: `10px solid ${C.lime}`,
          opacity: local >= 0 ? 1 - ripple : 0,
          transform: `scale(${0.4 + ripple * 0.8})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 55,
          top: y - 55,
          width: 110,
          height: 110,
          borderRadius: 55,
          background: "rgba(36,24,30,0.28)",
          border: `5px solid ${C.white}`,
          opacity: press,
          transform: `scale(${1.2 - press * 0.2})`,
        }}
      />
    </>
  );
};

const Screen = ({ shot, frame }: { shot: Shot; frame: number }) => {
  // Entra deslizando da direita e a câmera assenta no trecho em foco.
  const enter = appear(frame, 0, 9);
  const settle = interpolate(frame, [0, 16], [120, 0], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const focus = Math.min(Math.max(0, shot.focus - settle), 2400 - VISIBLE);
  const ring = shot.ring ? appear(frame, shot.ring.at, 10) : 0;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translateX(${(1 - enter) * 140}px)`,
        opacity: enter,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: -focus * SCALE,
          width: 1080,
          height: 2400,
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
        }}
      >
        <Img src={staticFile(`reel-pix/${shot.src}`)} style={{ width: 1080, height: 2400 }} />
        {shot.ring ? (
          <div
            style={{
              position: "absolute",
              left: shot.ring.x,
              top: shot.ring.y,
              width: shot.ring.w,
              height: shot.ring.h,
              borderRadius: 48,
              border: `12px solid ${C.lime}`,
              opacity: ring,
              transform: `scale(${1.05 - ring * 0.05})`,
            }}
          />
        ) : null}
        {shot.tap ? <Tap frame={frame} {...shot.tap} /> : null}
      </div>
    </div>
  );
};

const AppScreens = () => {
  const frame = useCurrentFrame();
  let start = 0;
  const timed = SHOTS.map((s) => {
    const from = start;
    start += s.length;
    return { ...s, from };
  });
  const current = [...timed].reverse().find((s) => frame >= s.from) ?? timed[0];
  const local = frame - current.from;
  const capIn = appear(local, 0, 8);
  const mark = appear(local, 10, 12);
  return (
    <Canvas>
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          width: SAFE_W,
          top: SAFE.top + 16,
          fontSize: 62,
          lineHeight: 1.1,
          fontWeight: 800,
          color: C.wine,
          textAlign: "center",
          whiteSpace: "nowrap",
          opacity: capIn,
          transform: `translateY(${(1 - capIn) * 24}px)`,
        }}
      >
        {current.caption(mark)}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          width: SAFE_W,
          top: SAFE.top + 104,
          textAlign: "center",
          fontSize: 28,
          fontWeight: 700,
          color: C.muted,
        }}
      >
        Telas reais do app, com dados de exemplo
      </div>
      <div
        style={{
          position: "absolute",
          left: WIN.left,
          top: WIN.top,
          width: WIN.width,
          height: WIN.height,
          borderRadius: 44,
          overflow: "hidden",
          background: C.surface,
          border: `8px solid ${C.ink}`,
          boxShadow: "0 30px 70px rgba(74,35,50,0.22)",
        }}
      >
        {timed.map((shot) => (
          <Sequence key={shot.src} from={shot.from} durationInFrames={shot.length} layout="none">
            <Screen shot={shot} frame={frame - shot.from} />
          </Sequence>
        ))}
      </div>
    </Canvas>
  );
};

/* ---------- 15–22 s: fecho ---------- */

const Closing = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l1 = appear(frame, 4, 12);
  const l2 = appear(frame, 16, 12);
  const mark = appear(frame, 30, 16);
  const sig = appear(frame, 60, 14);
  const ask = spring({ frame: frame - 150, fps, config: { damping: 12, mass: 0.6 } });
  const up = interpolate(frame, [140, 158], [0, -170], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Canvas background={C.wine}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${up}px)` }}>
        <div
          style={{
            position: "absolute",
            left: SAFE.left,
            width: SAFE_W,
            top: 540,
            fontSize: 112,
            lineHeight: 1.08,
            fontWeight: 800,
            color: C.canvas,
            letterSpacing: -2,
          }}
        >
          <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 30}px)` }}>
            Venda feita
          </div>
          <div style={{ opacity: l2, transform: `translateY(${(1 - l2) * 30}px)` }}>
            não é{" "}
            <span
              style={{
                color: mark >= 1 ? C.wine : C.canvas,
                backgroundImage: `linear-gradient(${C.lime}, ${C.lime})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${mark * 100}% 100%`,
                padding: "0 12px",
                borderRadius: 12,
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              dinheiro recebido.
            </span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: SAFE.left,
            width: SAFE_W,
            top: 1110,
            display: "flex",
            alignItems: "center",
            gap: 24,
            opacity: sig,
            transform: `translateY(${(1 - sig) * 20}px)`,
          }}
        >
          <Img src={staticFile("icon.png")} style={{ width: 96, height: 96, borderRadius: 24 }} />
          <div style={{ fontSize: 60, fontWeight: 800, color: C.canvas, letterSpacing: -1 }}>
            Lucro Caseiro
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          width: SAFE_W,
          top: 1150,
          background: C.lime,
          color: C.wine,
          borderRadius: 32,
          padding: "30px 34px",
          fontSize: 56,
          lineHeight: 1.18,
          fontWeight: 800,
          textAlign: "center",
          opacity: Math.min(1, ask * 1.5),
          transform: `scale(${0.85 + ask * 0.15})`,
        }}
      >
        Comente FIADO
        <br />
        que eu te mando o link 👇
      </div>
    </Canvas>
  );
};

/* ---------- montagem ---------- */

const PixDepoisReel = () => {
  const frame = useCurrentFrame();
  const volume = interpolate(frame, [0, 20, DURATION - 40, DURATION], [0, 0.5, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cut = () => (
    <TransitionSeries.Transition
      presentation={slide({ direction: "from-bottom" })}
      timing={linearTiming({ durationInFrames: TRANSITION })}
    />
  );
  return (
    <AbsoluteFill style={{ background: C.canvas }}>
      <Audio src={staticFile("reel-pix/musica.wav")} volume={volume} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={HOOK}>
          <Hook />
        </TransitionSeries.Sequence>
        {cut()}
        <TransitionSeries.Sequence durationInFrames={PROMISES}>
          <Promises />
        </TransitionSeries.Sequence>
        {cut()}
        <TransitionSeries.Sequence durationInFrames={APP}>
          <AppScreens />
        </TransitionSeries.Sequence>
        {cut()}
        <TransitionSeries.Sequence durationInFrames={CLOSING}>
          <Closing />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// Capa: a pergunta do gancho sobre a tela real de Fiado.
const PixDepoisCover = () => (
  <Canvas>
    <div
      style={{
        position: "absolute",
        left: WIN.left,
        top: 760,
        width: WIN.width,
        height: 1160,
        borderRadius: "44px 44px 0 0",
        overflow: "hidden",
        border: `8px solid ${C.ink}`,
        borderBottom: "none",
        boxShadow: "0 30px 70px rgba(74,35,50,0.22)",
      }}
    >
      <Img
        src={staticFile("reel-pix/fiado-topo3.png")}
        style={{ width: WIN.width - 16, height: ((WIN.width - 16) * 2400) / 1080 }}
      />
    </div>
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        width: SAFE_W,
        top: SAFE.top + 40,
        fontSize: 104,
        lineHeight: 1.04,
        fontWeight: 800,
        color: C.wine,
        letterSpacing: -3,
      }}
    >
      Você sabe quem ainda <Highlight>falta te pagar?</Highlight>
    </div>
  </Canvas>
);

export const PixDepoisReelCompositions = () => (
  <>
    <Composition
      id="LucroCaseiroReelPixDepois"
      component={PixDepoisReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Still id="LucroCaseiroReelPixDepoisCapa" component={PixDepoisCover} width={1080} height={1920} />
  </>
);
