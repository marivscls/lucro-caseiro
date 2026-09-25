import type { CSSProperties, ReactNode } from "react";
import { Audio } from "@remotion/media";
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
const DURATION = 660; // 22 s
const C = MARKETING_COLORS;
const FONT = "ManropeReel, Arial, sans-serif";

// Área segura TikTok/Instagram (1080x1920): nada importante acima de 220,
// abaixo de 1500 ou à direita de 940.
const SAFE = { top: 220, bottom: 1500, left: 80, right: 940 };

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

const Canvas = ({ children }: { children: ReactNode }) => (
  <AbsoluteFill style={{ background: C.canvas, fontFamily: FONT, color: C.ink }}>
    <style>{fontFaces}</style>
    {children}
  </AbsoluteFill>
);

const Highlight = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      background: `linear-gradient(transparent 58%, ${C.lime} 58%, ${C.lime} 92%, transparent 92%)`,
      padding: "0 6px",
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
  const lines: ReactNode[] = [
    "Você sabe",
    "quem ainda",
    <Highlight key="h">falta te pagar?</Highlight>,
  ];
  return (
    <Canvas>
      <IllustrativeTag />
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          right: 1080 - SAFE.right,
          top: 560,
          fontSize: 118,
          lineHeight: 1.08,
          fontWeight: 800,
          color: C.wine,
          letterSpacing: -2,
        }}
      >
        {lines.map((line, i) => {
          const p = appear(frame, i * 6, 10);
          return (
            <div
              key={i}
              style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </Canvas>
  );
};

/* ---------- 2–7 s: promessas espalhadas em várias conversas ---------- */

type Chat = {
  label: string;
  time: string;
  text: string | null;
  at: number;
  y: number;
};

// Conversas encenadas, sem nome nem telefone. Só as duas falas do roteiro
// aparecem escritas; as outras conversas ficam como "digitando".
const CHATS: Chat[] = [
  { label: "Cliente de terça", time: "terça", text: "Te faço o Pix sexta", at: 6, y: 470 },
  { label: "Cliente de sábado", time: "sábado", text: "Semana que vem eu acerto", at: 30, y: 760 },
  { label: "Cliente de ontem", time: "ontem", text: null, at: 54, y: 1050 },
];

const ChatCard = ({ chat, frame }: { chat: Chat; frame: number }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - chat.at, fps, config: { damping: 16, mass: 0.7 } });
  const bubble = appear(frame, chat.at + 8, 10);
  const dots = Math.floor(frame / 6) % 3;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        width: SAFE.right - SAFE.left,
        top: chat.y,
        opacity: s,
        transform: `translateY(${(1 - s) * 60}px)`,
        background: C.white,
        borderRadius: 36,
        padding: "28px 32px",
        boxShadow: "0 10px 30px rgba(74,35,50,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            background: C.roseSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill={C.rose}>
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
          marginTop: 22,
          display: "inline-block",
          background: C.surface,
          borderRadius: "10px 30px 30px 30px",
          padding: "20px 28px",
          fontSize: 46,
          fontWeight: 700,
          color: C.ink,
          opacity: bubble,
          transform: `scale(${0.9 + bubble * 0.1})`,
          transformOrigin: "left top",
        }}
      >
        {chat.text ?? (
          <span style={{ letterSpacing: 8, color: C.muted }}>
            {[0, 1, 2].map((d) => (
              <span key={d} style={{ opacity: d === dots ? 1 : 0.35 }}>
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
  const q = appear(frame, 96, 12);
  return (
    <Canvas>
      <IllustrativeTag />
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          right: 1080 - SAFE.right,
          top: 310,
          fontSize: 62,
          fontWeight: 800,
          color: C.wine,
          lineHeight: 1.1,
          opacity: appear(frame, 0, 10),
        }}
      >
        Cada promessa numa conversa
      </div>
      {CHATS.map((chat) => (
        <ChatCard key={chat.label} chat={chat} frame={frame} />
      ))}
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          right: 1080 - SAFE.right,
          top: 1330,
          fontSize: 60,
          fontWeight: 800,
          color: C.white,
          background: C.wine,
          borderRadius: 28,
          padding: "22px 30px",
          textAlign: "center",
          opacity: q,
          transform: `scale(${0.92 + q * 0.08})`,
        }}
      >
        Quem já pagou? <span style={{ color: C.lime }}>Quem falta?</span>
      </div>
    </Canvas>
  );
};

/* ---------- 7–15 s: telas reais do app ---------- */

// Coordenadas em pixels da captura (1080x2400, 360x800 @3x).
type Shot = {
  src: string;
  caption: ReactNode;
  from: number;
  length: number;
  tap: { x: number; y: number; at: number };
  ring?: { x: number; y: number; w: number; h: number };
  cameraY: number;
};

const SHOTS: Shot[] = [
  {
    src: "pagamento.png",
    caption: (
      <>
        Registre a venda no <Highlight>Fiado</Highlight>
      </>
    ),
    from: 0,
    length: 66,
    tap: { x: 560, y: 1560, at: 30 },
    ring: { x: 60, y: 1452, w: 960, h: 210 },
    cameraY: 0,
  },
  {
    src: "revisao.png",
    caption: "Confira e registre",
    from: 66,
    length: 54,
    tap: { x: 760, y: 2010, at: 26 },
    cameraY: -80,
  },
  {
    src: "fiado-paula.png",
    caption: (
      <>
        Veja quem <Highlight>falta pagar</Highlight>
      </>
    ),
    from: 120,
    length: 66,
    tap: { x: 390, y: 1788, at: 50 },
    ring: { x: 48, y: 1242, w: 984, h: 648 },
    cameraY: 0,
  },
  {
    src: "recebi-dialogo.png",
    caption: (
      <>
        Pix caiu? Toque em <Highlight>Recebi</Highlight>
      </>
    ),
    from: 186,
    length: 54,
    tap: { x: 732, y: 1308, at: 26 },
    cameraY: 0,
  },
];

const PHONE_W = 640;
const SCREEN_SCALE = (PHONE_W - 28) / 1080;
const PHONE_H = 2400 * SCREEN_SCALE + 28;
const PHONE_TOP = 414;

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

const PhoneShot = ({ shot }: { shot: Shot }) => {
  const frame = useCurrentFrame();
  const enter = appear(frame, 0, 8);
  const ring = shot.ring ? appear(frame, 8, 10) : 0;
  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <div
        style={{
          position: "absolute",
          left: (1080 - PHONE_W) / 2,
          top: PHONE_TOP + shot.cameraY,
          width: PHONE_W,
          height: PHONE_H,
          borderRadius: 64,
          background: C.ink,
          padding: 14,
          boxShadow: "0 30px 70px rgba(74,35,50,0.22)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 1080,
            height: 2400,
            transform: `scale(${SCREEN_SCALE})`,
            transformOrigin: "top left",
            borderRadius: 110,
            overflow: "hidden",
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
                transform: `scale(${1.04 - ring * 0.04})`,
              }}
            />
          ) : null}
          <Tap frame={frame} {...shot.tap} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const AppScreens = () => {
  const frame = useCurrentFrame();
  const current = [...SHOTS].reverse().find((s) => frame >= s.from) ?? SHOTS[0];
  const capIn = appear(frame - current.from, 0, 8);
  return (
    <Canvas>
      {SHOTS.map((shot) => (
        <Sequence key={shot.src} from={shot.from} durationInFrames={shot.length} layout="none">
          <PhoneShot shot={shot} />
        </Sequence>
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 390,
          background: `linear-gradient(${C.canvas} 90%, rgba(250,248,246,0))`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          right: 1080 - SAFE.right,
          top: SAFE.top + 20,
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
        {current.caption}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          right: 1080 - SAFE.right,
          top: SAFE.top + 100,
          textAlign: "center",
          opacity: appear(frame, 0, 10),
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>
          Telas reais do app, com dados de exemplo
        </span>
      </div>
    </Canvas>
  );
};

/* ---------- 15–22 s: fecho ---------- */

const Signature = ({ opacity, top }: { opacity: number; top: number }) => (
  <div
    style={{
      position: "absolute",
      left: SAFE.left,
      right: 1080 - SAFE.right,
      top,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 26,
      opacity,
    }}
  >
    <Img src={staticFile("icon.png")} style={{ width: 104, height: 104, borderRadius: 26 }} />
    <div style={{ fontSize: 64, fontWeight: 800, color: C.wine, letterSpacing: -1 }}>
      Lucro Caseiro
    </div>
  </div>
);

const Closing = () => {
  const frame = useCurrentFrame();
  const l1 = appear(frame, 0, 12);
  const l2 = appear(frame, 14, 12);
  const sig = appear(frame, 50, 14);
  const ask = appear(frame, 150, 12);
  const up = interpolate(frame, [140, 158], [0, -150], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Canvas>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${up}px)` }}>
        <div
          style={{
            position: "absolute",
            left: SAFE.left,
            right: 1080 - SAFE.right,
            top: 560,
            fontSize: 104,
            lineHeight: 1.08,
            fontWeight: 800,
            color: C.wine,
            letterSpacing: -2,
          }}
        >
          <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 30}px)` }}>
            Venda feita
          </div>
          <div style={{ opacity: l2, transform: `translateY(${(1 - l2) * 30}px)` }}>
            não é <Highlight>dinheiro</Highlight>
            <br />
            <Highlight>recebido.</Highlight>
          </div>
        </div>
        <Signature opacity={sig} top={1080} />
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          right: 1080 - SAFE.right,
          top: 1140,
          background: C.wine,
          color: C.white,
          borderRadius: 32,
          padding: "30px 34px",
          fontSize: 54,
          lineHeight: 1.18,
          fontWeight: 800,
          textAlign: "center",
          opacity: ask,
          transform: `scale(${0.9 + ask * 0.1})`,
        }}
      >
        Comente <span style={{ color: C.lime }}>FIADO</span>
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
  return (
    <AbsoluteFill style={{ background: C.canvas }}>
      <Audio src={staticFile("reel-pix/musica.wav")} volume={volume} />
      <Sequence durationInFrames={60}>
        <Hook />
      </Sequence>
      <Sequence from={60} durationInFrames={150}>
        <Promises />
      </Sequence>
      <Sequence from={210} durationInFrames={240}>
        <AppScreens />
      </Sequence>
      <Sequence from={450} durationInFrames={DURATION - 450}>
        <Closing />
      </Sequence>
    </AbsoluteFill>
  );
};

const coverText: CSSProperties = {
  position: "absolute",
  left: SAFE.left,
  right: 1080 - SAFE.right,
  top: SAFE.top + 20,
  fontSize: 92,
  lineHeight: 1.06,
  fontWeight: 800,
  color: C.wine,
  letterSpacing: -2,
};

// Capa: a pergunta do gancho sobre a tela real de Fiado.
const PixDepoisCover = () => (
  <Canvas>
    <div
      style={{
        position: "absolute",
        left: (1080 - PHONE_W) / 2,
        top: 700,
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 64,
        background: C.ink,
        padding: 14,
        boxShadow: "0 30px 70px rgba(74,35,50,0.22)",
      }}
    >
      <div
        style={{
          width: 1080,
          height: 2400,
          transform: `scale(${SCREEN_SCALE})`,
          transformOrigin: "top left",
          borderRadius: 110,
          overflow: "hidden",
        }}
      >
        <Img src={staticFile("reel-pix/fiado-paula.png")} style={{ width: 1080, height: 2400 }} />
      </div>
    </div>
    <div style={coverText}>
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
