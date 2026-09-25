import type {CSSProperties, ReactNode} from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Sequence,
  Still,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

import {MARKETING_COLORS as C, MARKETING_FONTS as F} from "../marketing-brand";

/**
 * Reel "Quanto você cobraria por isso?" (1080x1920, 30 fps, 21 s).
 * Peça ilustrada (prato pintado personalizado) + tela real da Precificação
 * com valores de exemplo: material 18 + embalagem 6 + trabalho 3 h × 20 = 60,
 * ganho 26 → preço sugerido R$ 110,00 (conferido na demo do app).
 */

const FPS = 30;
const DIR = "reel-preco-peca";

// Cenas (frames)
const HOOK = {from: 0, to: 66};
const MATERIAIS = {from: 66, to: 118};
const PINTURA = {from: 118, to: 170};
const EMBALAGEM = {from: 170, to: 222};
const TEMPO = {from: 222, to: 285};
const APP = {from: 285, to: 480};
const FINAL = {from: 480, to: 630};
export const PRECO_PECA_DURATION = FINAL.to;

const VOICE = [
  {src: "voz-v1.wav", at: 8},
  {src: "voz-v2.wav", at: 70},
  {src: "voz-v3.wav", at: 172},
  {src: "voz-v4.wav", at: 226},
  {src: "voz-v5.wav", at: 300},
  {src: "voz-v6.wav", at: 492},
];

const LEAF = "#6F8F55";
const KRAFT = "#C9A27A";

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const r = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], {...clamp, easing: ease});

/* ---------- elementos comuns ---------- */

const Canvas = ({children, dark = false}: {children: ReactNode; dark?: boolean}) => (
  <AbsoluteFill style={{backgroundColor: dark ? C.wine : C.canvas}}>{children}</AbsoluteFill>
);

const Tag = ({children, dark = false}: {children: ReactNode; dark?: boolean}) => (
  <div
    style={{
      position: "absolute",
      top: 150,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        padding: "10px 26px",
        borderRadius: 999,
        backgroundColor: dark ? "rgba(255,255,255,0.12)" : C.surface,
        color: dark ? "#F0C7D1" : C.muted,
        fontFamily: F.body,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: 0.4,
      }}
    >
      {children}
    </div>
  </div>
);

/** Legenda grande, legível sem áudio. */
const Caption = ({
  children,
  top = 260,
  start = 0,
  size = 76,
  color = C.ink,
}: {
  children: ReactNode;
  top?: number;
  start?: number;
  size?: number;
  color?: string;
}) => {
  const frame = useCurrentFrame();
  const p = r(frame, start, start + 10);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 70,
        right: 70,
        textAlign: "center",
        fontFamily: F.display,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: -2,
        color,
        opacity: p,
        translate: `0px ${interpolate(p, [0, 1], [24, 0])}px`,
      }}
    >
      {children}
    </div>
  );
};

const StepChip = ({n, label}: {n: string; label: string}) => {
  const frame = useCurrentFrame();
  const p = r(frame, 0, 8);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 340,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: p,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "16px 34px 16px 18px",
          borderRadius: 999,
          backgroundColor: C.wine,
          color: C.white,
          fontFamily: F.body,
          fontWeight: 800,
          fontSize: 40,
        }}
      >
        <span
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: C.lime,
            color: C.wine,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          {n}
        </span>
        {label}
      </div>
    </div>
  );
};

/** Corte próximo: leve "punch-in" no começo de cada plano. */
const Punch = ({children, zoom = 1}: {children: ReactNode; zoom?: number}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 12], [1.07, 1], {...clamp, easing: ease});
  const drift = interpolate(frame, [0, 60], [0, 0.03], clamp);
  return (
    <AbsoluteFill style={{scale: s * (zoom + drift)}}>{children}</AbsoluteFill>
  );
};

/* ---------- a peça: prato pintado personalizado (ilustração original) ---------- */

const leaves = Array.from({length: 18}, (_, i) => i);

const Plate = ({paint = 1, size = 700}: {paint?: number; size?: number}) => {
  const textP = interpolate(paint, [0.45, 1], [0, 1], clamp);
  return (
    <svg width={size} height={size} viewBox="-360 -360 720 720">
      <defs>
        <radialGradient id="plateShade" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFE9E4" />
        </radialGradient>
        <clipPath id="textReveal">
          <rect x={-220} y={-120} width={440 * textP} height={240} />
        </clipPath>
      </defs>
      <circle r={340} fill="rgba(36,24,30,0.08)" cx={10} cy={18} />
      <circle r={340} fill="url(#plateShade)" stroke="#E4DBD4" strokeWidth={4} />
      <circle r={262} fill="none" stroke="#EAE2DB" strokeWidth={5} />
      <circle r={318} fill="none" stroke={C.rose} strokeWidth={6} strokeDasharray={`${2000 * interpolate(paint, [0, 0.25], [0, 1], clamp)} 2000`} transform="rotate(-90)" />
      {leaves.map((i) => {
        const a = (i / leaves.length) * Math.PI * 2;
        const appear = interpolate(paint, [0.05 + i * 0.022, 0.12 + i * 0.022], [0, 1], clamp);
        const x = Math.cos(a) * 208;
        const y = Math.sin(a) * 208;
        const deg = (a * 180) / Math.PI + 90;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${deg}) scale(${appear})`}>
            <ellipse rx={13} ry={30} fill={LEAF} transform="rotate(35) translate(0 -14)" />
            <ellipse rx={12} ry={26} fill={LEAF} opacity={0.8} transform="rotate(-35) translate(0 -12)" />
            {i % 3 === 0 ? (
              <g>
                {[0, 72, 144, 216, 288].map((p) => (
                  <ellipse key={p} rx={10} ry={17} fill={C.rose} transform={`rotate(${p}) translate(0 -14)`} />
                ))}
                <circle r={9} fill={C.lime} />
              </g>
            ) : i % 3 === 1 ? (
              <circle r={11} fill={C.lime} stroke={C.wine} strokeWidth={3} />
            ) : null}
          </g>
        );
      })}
      <g clipPath="url(#textReveal)">
        <text
          y={-18}
          textAnchor="middle"
          fontFamily={F.accent}
          fontSize={62}
          fill={C.rose}
        >
          Família
        </text>
        <text
          y={62}
          textAnchor="middle"
          fontFamily={F.accent}
          fontSize={92}
          fill={C.wine}
        >
          Rocha
        </text>
      </g>
    </svg>
  );
};

/* ---------- cenas do processo ---------- */

const Hook = () => {
  const frame = useCurrentFrame();
  const p = r(frame, 0, 18);
  return (
    <Canvas>
      <Tag>Exemplo ilustrativo</Tag>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", top: 180}}>
        <div
          style={{
            opacity: p,
            scale: interpolate(frame, [0, 66], [0.92, 1.02], clamp),
            rotate: `${interpolate(frame, [0, 66], [-8, 0], clamp)}deg`,
          }}
        >
          <Plate paint={1} size={800} />
        </div>
      </AbsoluteFill>
      <Caption top={270} start={4} size={92}>
        Quanto você
        <br />
        cobraria por isso?
      </Caption>
    </Canvas>
  );
};

const Pot = ({color, x, y, delay}: {color: string; x: number; y: number; delay: number}) => {
  const frame = useCurrentFrame();
  const p = r(frame, delay, delay + 12);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 170,
        height: 170,
        borderRadius: 85,
        backgroundColor: "#FFFFFF",
        border: "6px solid #E4DBD4",
        boxShadow: "0 14px 30px rgba(36,24,30,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: p,
        translate: `0px ${interpolate(p, [0, 1], [60, 0])}px`,
      }}
    >
      <div style={{width: 128, height: 128, borderRadius: 64, backgroundColor: color}} />
    </div>
  );
};

const Brush = ({x, y, rot, delay, tip}: {x: number; y: number; rot: number; delay: number; tip: string}) => {
  const frame = useCurrentFrame();
  const p = r(frame, delay, delay + 12);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        rotate: `${rot}deg`,
        opacity: p,
        translate: `${interpolate(p, [0, 1], [80, 0])}px 0px`,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{width: 300, height: 26, borderRadius: 13, backgroundColor: "#8C5A3C"}} />
      <div style={{width: 60, height: 30, backgroundColor: "#B8B2AE"}} />
      <div style={{width: 70, height: 34, borderRadius: "4px 40px 40px 4px", backgroundColor: tip}} />
    </div>
  );
};

const Materiais = () => (
  <Canvas>
    <Tag>Exemplo ilustrativo</Tag>
    <Caption>Materiais</Caption>
    <Punch>
      <div style={{position: "absolute", left: 120, top: 560, opacity: 1}}>
        <Plate paint={0} size={560} />
      </div>
      <Pot color={C.rose} x={700} y={540} delay={4} />
      <Pot color={LEAF} x={760} y={740} delay={8} />
      <Pot color={C.wine} x={700} y={940} delay={12} />
      <Brush x={180} y={1170} rot={-12} delay={10} tip={C.rose} />
      <Brush x={260} y={1250} rot={-6} delay={14} tip={LEAF} />
    </Punch>
    <StepChip n="1" label="Prato, tintas e verniz" />
  </Canvas>
);

const Pintura = () => {
  const frame = useCurrentFrame();
  const paint = interpolate(frame, [0, 50], [0.15, 1], clamp);
  // pincel acompanha a escrita do nome
  const tp = interpolate(paint, [0.45, 1], [0, 1], clamp);
  const bx = interpolate(tp, [0, 1], [-200, 200]);
  const by = 40 + Math.sin(frame / 2.2) * 26;
  return (
    <Canvas>
      <Tag>Exemplo ilustrativo</Tag>
      <Caption>Personalização</Caption>
      <Punch zoom={1.25}>
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", top: 120}}>
          <div style={{position: "relative"}}>
            <Plate paint={paint} size={700} />
            <div
              style={{
                position: "absolute",
                left: 350 + bx * (700 / 720),
                top: 350 + by * (700 / 720),
                rotate: "-50deg",
                transformOrigin: "0 50%",
                display: "flex",
                alignItems: "center",
                flexDirection: "row-reverse",
                translate: "0px -17px",
              }}
            >
              <div style={{width: 360, height: 24, borderRadius: 12, backgroundColor: "#8C5A3C"}} />
              <div style={{width: 50, height: 28, backgroundColor: "#B8B2AE"}} />
              <div style={{width: 56, height: 30, borderRadius: "40px 4px 4px 40px", backgroundColor: C.wine}} />
            </div>
          </div>
        </AbsoluteFill>
      </Punch>
      <StepChip n="2" label="Pintura com o nome" />
    </Canvas>
  );
};

const Embalagem = () => {
  const frame = useCurrentFrame();
  const drop = r(frame, 0, 16);
  const lid = r(frame, 16, 30);
  const ribbon = r(frame, 28, 40);
  const boxW = 640;
  return (
    <Canvas>
      <Tag>Exemplo ilustrativo</Tag>
      <Caption>Embalagem</Caption>
      <Punch>
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", top: 140}}>
          <div style={{position: "relative", width: boxW, height: boxW}}>
            {/* fundo da caixa */}
            <div style={{position: "absolute", inset: 0, borderRadius: 28, backgroundColor: KRAFT, boxShadow: "0 30px 60px rgba(36,24,30,0.2)"}} />
            <div style={{position: "absolute", inset: 26, borderRadius: 18, backgroundColor: "#F3E7F0"}} />
            {/* papel de seda */}
            <div style={{position: "absolute", inset: 26, borderRadius: 18, background: `repeating-linear-gradient(45deg, ${C.roseSoft} 0 26px, #FFFFFF 26px 52px)`}} />
            <div
              style={{
                position: "absolute",
                left: 45,
                top: 45,
                opacity: interpolate(drop, [0, 0.2], [0, 1], clamp),
                translate: `0px ${interpolate(drop, [0, 1], [-700, 0])}px`,
              }}
            >
              <Plate paint={1} size={550} />
            </div>
            {/* tampa */}
            <div
              style={{
                position: "absolute",
                inset: -14,
                borderRadius: 32,
                backgroundColor: KRAFT,
                border: "6px solid #B88F66",
                opacity: interpolate(lid, [0, 0.15], [0, 1], clamp),
                translate: `0px ${interpolate(lid, [0, 1], [-900, 0])}px`,
              }}
            >
              <div style={{position: "absolute", left: "50%", top: 0, bottom: 0, width: 70, marginLeft: -35, backgroundColor: C.rose, scale: `1 ${ribbon}`}} />
              <div style={{position: "absolute", top: "50%", left: 0, right: 0, height: 70, marginTop: -35, backgroundColor: C.rose, scale: `${ribbon} 1`}} />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 200,
                  height: 120,
                  marginLeft: -100,
                  marginTop: -60,
                  scale: ribbon,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div style={{width: 100, height: 80, borderRadius: "50% 10% 10% 50%", backgroundColor: C.wine, rotate: "-12deg"}} />
                <div style={{width: 40, height: 40, borderRadius: 12, backgroundColor: C.wine, zIndex: 1, margin: "0 -8px"}} />
                <div style={{width: 100, height: 80, borderRadius: "10% 50% 50% 10%", backgroundColor: C.wine, rotate: "12deg"}} />
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Punch>
      <StepChip n="3" label="Caixa, papel e fita" />
    </Canvas>
  );
};

const Tempo = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [4, 48], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const minutes = t * 180;
  const hh = Math.floor(minutes / 60);
  const mm = Math.floor(minutes % 60);
  const size = 620;
  return (
    <Canvas>
      <Tag>Exemplo ilustrativo</Tag>
      <Caption>O seu tempo</Caption>
      <Punch>
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", top: 60}}>
          <svg width={size} height={size} viewBox="-310 -310 620 620">
            <circle r={300} fill={C.white} stroke={C.wine} strokeWidth={16} />
            {/* arco do tempo gasto */}
            <circle
              r={230}
              fill="none"
              stroke={C.lime}
              strokeWidth={70}
              strokeDasharray={`${2 * Math.PI * 230 * (minutes / 720)} ${2 * Math.PI * 230}`}
              transform="rotate(-90)"
              opacity={0.9}
            />
            {Array.from({length: 12}, (_, i) => (
              <line key={i} x1={0} y1={-270} x2={0} y2={-248} stroke={C.ink} strokeWidth={8} strokeLinecap="round" transform={`rotate(${i * 30})`} />
            ))}
            <line x1={0} y1={0} x2={0} y2={-150} stroke={C.wine} strokeWidth={16} strokeLinecap="round" transform={`rotate(${minutes / 2})`} />
            <line x1={0} y1={0} x2={0} y2={-220} stroke={C.rose} strokeWidth={10} strokeLinecap="round" transform={`rotate(${minutes * 6})`} />
            <circle r={18} fill={C.wine} />
          </svg>
          <div
            style={{
              marginTop: 40,
              fontFamily: F.display,
              fontWeight: 800,
              fontSize: 120,
              color: C.wine,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {hh}h{String(mm).padStart(2, "0")}
          </div>
        </AbsoluteFill>
      </Punch>
      <StepChip n="4" label="3 horas de trabalho" />
    </Canvas>
  );
};

/* ---------- tela real do app ---------- */

// Capturas 360×1500 css px (dpr 3). Coordenadas abaixo em css px.
const SHOT_W = 360;
const PHONE_W = 640;
const PHONE_H = 1110;
const BEZEL = 16;
const SCREEN_W = PHONE_W - BEZEL * 2;
const K = SCREEN_W / SHOT_W; // css px → px do vídeo

type Box = {y: number; h: number; x?: number; w?: number};

const SHOTS: {
  src: string;
  from: number;
  to: number;
  focusY: number;
  boxes: Box[];
  callout: ReactNode;
}[] = [
  {
    src: "precificacao-custos.png",
    from: 0,
    to: 60,
    focusY: 640,
    boxes: [
      {y: 645, h: 125},
      {y: 785, h: 125},
    ],
    callout: (
      <>
        Material <b>R$ 18</b> · Embalagem <b>R$ 6</b>
      </>
    ),
  },
  {
    src: "precificacao-tempo.png",
    from: 60,
    to: 120,
    focusY: 660,
    boxes: [
      {y: 620, h: 82, x: 50, w: 260},
      {y: 816, h: 82, x: 50, w: 260},
      {y: 910, h: 58, x: 50, w: 260},
    ],
    callout: (
      <>
        Tempo <b>3 h</b> × <b>R$ 20</b>/h = <b>R$ 60</b>
      </>
    ),
  },
  {
    src: "precificacao-resultado.png",
    from: 120,
    to: 195,
    focusY: 860,
    boxes: [
      {y: 1004, h: 116, x: 44, w: 272},
      {y: 632, h: 50, x: 30, w: 190},
    ],
    callout: (
      <>
        Custos <b>R$ 84</b> + ganho <b>R$ 26</b> = <b>R$ 110</b>
      </>
    ),
  },
];

const AppScreen = () => {
  const frame = useCurrentFrame();
  const enter = r(frame, 0, 14);
  const shot = SHOTS.find((s) => frame >= s.from && frame < s.to) ?? SHOTS[SHOTS.length - 1];
  const local = frame - shot.from;
  const viewH = (PHONE_H - BEZEL * 2) / K; // css px visíveis
  const offset = Math.max(0, Math.min(1500 - viewH, shot.focusY - viewH / 2));
  const drift = interpolate(local, [0, shot.to - shot.from], [14, -14], clamp);
  const flash = interpolate(local, [0, 6], [0.6, 0], clamp);

  return (
    <Canvas>
      <Caption top={210} size={64}>
        Material + embalagem
        <br />+ <span style={{color: C.rose}}>tempo</span> entram na conta
      </Caption>
      <AbsoluteFill style={{alignItems: "center", top: 390}}>
        <div
          style={{
            width: PHONE_W,
            height: PHONE_H,
            padding: BEZEL,
            borderRadius: 70,
            backgroundColor: "#211B19",
            boxShadow: "0 40px 90px rgba(36,24,30,0.28)",
            opacity: enter,
            translate: `0px ${interpolate(enter, [0, 1], [80, 0])}px`,
          }}
        >
          <div style={{position: "relative", width: SCREEN_W, height: PHONE_H - BEZEL * 2, overflow: "hidden", borderRadius: 56, backgroundColor: C.canvas}}>
            <div style={{position: "absolute", left: 0, top: (-offset + drift) * K, width: SCREEN_W}}>
              <Img src={staticFile(`${DIR}/${shot.src}`)} style={{width: SCREEN_W, display: "block"}} />
              {shot.boxes.map((b, i) => {
                const p = r(local, 10 + i * 9, 20 + i * 9);
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: (b.x ?? 14) * K,
                      top: b.y * K,
                      width: (b.w ?? SHOT_W - 28) * K,
                      height: b.h * K,
                      borderRadius: 18,
                      border: `6px solid ${C.lime}`,
                      boxShadow: `0 0 0 6px ${C.wine}`,
                      opacity: p,
                      scale: interpolate(p, [0, 1], [1.08, 1]),
                    }}
                  />
                );
              })}
            </div>
            <AbsoluteFill style={{backgroundColor: C.white, opacity: flash}} />
          </div>
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 1440,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: r(local, 14, 24),
          translate: `0px ${interpolate(r(local, 14, 24), [0, 1], [20, 0])}px`,
        }}
      >
        <div
          style={{
            padding: "22px 40px",
            borderRadius: 30,
            backgroundColor: C.wine,
            color: C.white,
            fontFamily: F.body,
            fontSize: 46,
            fontWeight: 700,
            boxShadow: "0 20px 40px rgba(36,24,30,0.25)",
          }}
        >
          {shot.callout}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1560,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: F.body,
          fontWeight: 700,
          fontSize: 30,
          color: C.muted,
        }}
      >
        Tela real do Lucro Caseiro · valores de exemplo
      </div>
    </Canvas>
  );
};

/* ---------- fechamento ---------- */

const Final = () => {
  const frame = useCurrentFrame();
  const brand = r(frame, 80, 96);
  const text: CSSProperties = {
    fontFamily: F.display,
    fontWeight: 800,
    fontSize: 104,
    lineHeight: 1.02,
    letterSpacing: -3,
    color: C.white,
    textAlign: "center",
  };
  const p = r(frame, 4, 18);
  return (
    <Canvas dark>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", padding: "0 80px", top: -140}}>
        <div
          style={{
            ...text,
            opacity: p,
            translate: `0px ${interpolate(p, [0, 1], [40, 0]) - interpolate(brand, [0, 1], [0, 80])}px`,
          }}
        >
          Seu <span style={{color: C.lime}}>tempo</span> também
          <br />
          faz parte do preço.
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 1150,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          opacity: brand,
          scale: interpolate(brand, [0, 1], [0.9, 1]),
        }}
      >
        <Img src={staticFile("play-store/icon.png")} style={{width: 120, height: 120, borderRadius: 30}} />
        <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 76, color: C.white, letterSpacing: -1.5}}>
          Lucro Caseiro
        </div>
      </div>
    </Canvas>
  );
};

/* ---------- composição ---------- */

const seq = (s: {from: number; to: number}, name: string, node: ReactNode) => (
  <Sequence from={s.from} durationInFrames={s.to - s.from} name={name}>
    {node}
  </Sequence>
);

export const PrecoPecaReel = () => (
  <AbsoluteFill style={{backgroundColor: C.canvas}}>
    {seq(HOOK, "Peça pronta", <Hook />)}
    {seq(MATERIAIS, "Materiais", <Materiais />)}
    {seq(PINTURA, "Personalização", <Pintura />)}
    {seq(EMBALAGEM, "Embalagem", <Embalagem />)}
    {seq(TEMPO, "Tempo", <Tempo />)}
    {seq(APP, "Precificação no app", <AppScreen />)}
    {seq(FINAL, "Ideia central", <Final />)}
    <Audio src={staticFile(`${DIR}/trilha.wav`)} volume={0.35} />
    {VOICE.map((v) => (
      <Sequence key={v.src} from={v.at} layout="none">
        <Audio src={staticFile(`${DIR}/${v.src}`)} volume={1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

export const PrecoPecaReelComposition = () => (
  <>
    <Composition
      id="LucroCaseiroReelPrecoPeca"
      component={PrecoPecaReel}
      durationInFrames={PRECO_PECA_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Still id="LucroCaseiroReelPrecoPecaCapa" component={Capa} width={1080} height={1920} />
  </>
);

/** Capa do Reel: peça pronta + pergunta. */
const Capa = () => (
  <Canvas>
    <Tag>Exemplo ilustrativo</Tag>
    <AbsoluteFill style={{alignItems: "center", justifyContent: "center", top: 180}}>
      <Plate paint={1} size={800} />
    </AbsoluteFill>
    <div
      style={{
        position: "absolute",
        top: 270,
        left: 70,
        right: 70,
        textAlign: "center",
        fontFamily: F.display,
        fontWeight: 800,
        fontSize: 92,
        lineHeight: 1.04,
        letterSpacing: -2,
        color: C.ink,
      }}
    >
      Quanto você
      <br />
      cobraria por isso?
    </div>
  </Canvas>
);
