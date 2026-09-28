import type {CSSProperties, ReactNode} from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Still,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {MARKETING_COLORS, MARKETING_FONTS} from "./marketing-brand";

/*
 * Vídeo de lançamento horizontal (1920x1080, 30 fps, 44,5 s).
 * Usa só capturas reais do app (public/launch) e textos confirmados no código.
 * Trilha: scripts/launch-audio.py (sintetizada, sem amostras de terceiros).
 */

const C = MARKETING_COLORS;
const F = MARKETING_FONTS;
const FPS = 30;

export const LAUNCH_SCENES = {
  hook: {from: 0, duration: 150},
  pricing: {from: 150, duration: 315},
  product: {from: 465, duration: 240},
  catalog: {from: 705, duration: 270},
  overview: {from: 975, duration: 210},
  closing: {from: 1185, duration: 150},
} as const;

export const LAUNCH_DURATION = 1335;

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

const ramp = (
  frame: number,
  start: number,
  end: number,
  from = 0,
  to = 1,
  easing = EASE_OUT,
) =>
  interpolate(frame, [start, end], [from, to], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** 0 before `inAt`, 1 while shown, back to 0 after `outAt`. */
const visible = (frame: number, inAt: number, outAt: number, len = 12) =>
  Math.min(ramp(frame, inAt, inAt + len), 1 - ramp(frame, outAt, outAt + len));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ */
/* Phone and camera                                                   */
/* ------------------------------------------------------------------ */

const SHOT_W = 1080;
const SHOT_H = 2400;
const SCREEN_H = 920;
const S = SCREEN_H / SHOT_H;
const SCREEN_W = SHOT_W * S;
const PHONE_CX = 1340;
const PHONE_CY = 540;
const SCREEN_LEFT = PHONE_CX - SCREEN_W / 2;
const SCREEN_TOP = PHONE_CY - SCREEN_H / 2;
const BEZEL = 14;

type Cam = {z: number; sx: number; sy: number};
type CamKey = [frame: number, z: number, sx: number, sy: number];

const REST: Cam = {z: 1, sx: SHOT_W / 2, sy: SHOT_H / 2};

const camAt = (frame: number, keys: CamKey[]): Cam => {
  if (frame <= keys[0][0]) {
    return {z: keys[0][1], sx: keys[0][2], sy: keys[0][3]};
  }
  for (let i = 1; i < keys.length; i++) {
    const [f1, z1, x1, y1] = keys[i];
    const [f0, z0, x0, y0] = keys[i - 1];
    if (frame <= f1) {
      const t = EASE_IN_OUT((frame - f0) / Math.max(1, f1 - f0));
      return {z: lerp(z0, z1, t), sx: lerp(x0, x1, t), sy: lerp(y0, y1, t)};
    }
  }
  const last = keys[keys.length - 1];
  return {z: last[1], sx: last[2], sy: last[3]};
};

/** Where a screenshot pixel lands on the 1920x1080 stage for a camera. */
const toStage = (cam: Cam, sx: number, sy: number) => ({
  x: PHONE_CX + (sx - cam.sx) * S * cam.z,
  y: PHONE_CY + (sy - cam.sy) * S * cam.z,
});

const camTransform = (cam: Cam) => {
  const px = SCREEN_LEFT + cam.sx * S;
  const py = SCREEN_TOP + cam.sy * S;
  return `translate(${PHONE_CX - px * cam.z}px, ${PHONE_CY - py * cam.z}px) scale(${cam.z})`;
};

type ScreenLayer = {src: string; style?: CSSProperties};

const Phone = ({
  cam,
  layers,
  children,
  style,
}: {
  cam: Cam;
  layers: ScreenLayer[];
  children?: ReactNode;
  style?: CSSProperties;
}) => (
  <AbsoluteFill style={{transformOrigin: "0 0", transform: camTransform(cam), ...style}}>
    <div
      style={{
        position: "absolute",
        left: SCREEN_LEFT - BEZEL,
        top: SCREEN_TOP - BEZEL,
        width: SCREEN_W + BEZEL * 2,
        height: SCREEN_H + BEZEL * 2,
        borderRadius: 60,
        backgroundColor: C.ink,
        boxShadow:
          "0 60px 120px rgba(74,35,50,0.22), 0 18px 40px rgba(74,35,50,0.16), inset 0 0 0 2px rgba(255,255,255,0.08)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: SCREEN_LEFT,
        top: SCREEN_TOP,
        width: SCREEN_W,
        height: SCREEN_H,
        borderRadius: 46,
        overflow: "hidden",
        backgroundColor: C.canvas,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: SHOT_W,
          height: SHOT_H,
          transformOrigin: "0 0",
          transform: `scale(${S})`,
        }}
      >
        {layers.map((layer) => (
          <Img
            key={layer.src}
            src={staticFile(layer.src)}
            style={{position: "absolute", inset: 0, width: SHOT_W, height: SHOT_H, ...layer.style}}
          />
        ))}
        {children}
      </div>
    </div>
  </AbsoluteFill>
);

/** Shows a region of a phone screenshot, starting at (x, y) in screenshot px. */
const CropImg = ({src, scale, x, y}: {src: string; scale: number; x: number; y: number}) => (
  <Img
    src={staticFile(src)}
    style={{
      position: "absolute",
      left: -x * scale,
      top: -y * scale,
      width: SHOT_W * scale,
      height: SHOT_H * scale,
      maxWidth: "none",
    }}
  />
);

/** Outline drawn in screenshot pixels, with a soft spotlight around it. */
const Highlight = ({
  x,
  y,
  w,
  h,
  p,
  color = C.rose,
  dim = 1,
  radius = 34,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
  color?: string;
  dim?: number;
  radius?: number;
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: radius,
      border: `9px solid ${color}`,
      opacity: p,
      transform: `scale(${1.06 - 0.06 * p})`,
      boxShadow: `0 0 0 4000px rgba(36,24,30,${0.34 * p * dim}), 0 0 40px ${color}66`,
    }}
  />
);

const Cursor = ({x, y, clickAt, frame}: {x: number; y: number; clickAt: number; frame: number}) => {
  const press = visible(frame, clickAt - 3, clickAt + 3, 3);
  const ring = ramp(frame, clickAt, clickAt + 18);
  return (
    <div style={{position: "absolute", left: x, top: y, pointerEvents: "none"}}>
      {frame >= clickAt ? (
        <div
          style={{
            position: "absolute",
            left: -40,
            top: -40,
            width: 80,
            height: 80,
            borderRadius: 40,
            border: `5px solid ${C.lime}`,
            opacity: 1 - ring,
            transform: `scale(${0.4 + ring * 1.2})`,
          }}
        />
      ) : null}
      <svg
        width="54"
        height="54"
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: -6,
          top: -4,
          transform: `scale(${1 - press * 0.14})`,
          transformOrigin: "6px 4px",
          filter: "drop-shadow(0 6px 10px rgba(36,24,30,0.35))",
        }}
      >
        <path
          d="M5 3l14 8.2-6.3 1.6 3.7 7-2.7 1.4-3.7-7L5 18.6z"
          fill={C.white}
          stroke={C.ink}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Type                                                               */
/* ------------------------------------------------------------------ */

const RevealLine = ({
  frame,
  at,
  children,
  style,
}: {
  frame: number;
  at: number;
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const p = ramp(frame, at, at + 22);
  return (
    <div style={{overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em"}}>
      <div style={{transform: `translateY(${(1 - p) * 110}%)`, opacity: p, ...style}}>{children}</div>
    </div>
  );
};

const headline: CSSProperties = {
  fontFamily: F.accent,
  fontWeight: 700,
  color: C.wine,
  letterSpacing: "-0.02em",
  lineHeight: 1.02,
};

const Kicker = ({frame, at, children}: {frame: number; at: number; children: ReactNode}) => {
  const p = ramp(frame, at, at + 16);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: p,
        transform: `translateX(${(1 - p) * -24}px)`,
        fontFamily: F.body,
        fontWeight: 800,
        fontSize: 26,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.rose,
        marginBottom: 26,
      }}
    >
      <span style={{width: 14, height: 14, borderRadius: 7, backgroundColor: C.lime}} />
      {children}
    </div>
  );
};

const Footnote = ({opacity, left = 140}: {opacity: number; left?: number}) => (
  <div
    style={{
      position: "absolute",
      left,
      bottom: 54,
      fontFamily: F.body,
      fontWeight: 700,
      fontSize: 22,
      color: C.muted,
      opacity,
    }}
  >
    Telas reais do app, com dados de exemplo
  </div>
);

/* ------------------------------------------------------------------ */
/* Background                                                         */
/* ------------------------------------------------------------------ */

const Backdrop = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90);
  return (
    <AbsoluteFill style={{backgroundColor: C.canvas, overflow: "hidden"}}>
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          borderRadius: 550,
          right: -260 + drift * 30,
          top: -300 + drift * 20,
          background: `radial-gradient(circle at 50% 50%, ${C.roseSoft} 0%, rgba(245,229,232,0) 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: 450,
          left: -320 - drift * 24,
          bottom: -420,
          background: "radial-gradient(circle at 50% 50%, rgba(220,232,106,0.22) 0%, rgba(220,232,106,0) 65%)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Cost chips (hook) — colors match the bar in the pricing screen      */
/* ------------------------------------------------------------------ */

type CostItem = {label: string; value: string; color: string; icon: ReactNode};

const iconProps = {
  width: 30,
  height: 30,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: C.white,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Valores da simulação real em apps/web/public/landing/CAPTURES.md.
const COSTS: CostItem[] = [
  {
    label: "Materiais",
    value: "R$ 10,00",
    color: "#8E6424",
    icon: (
      <svg {...iconProps}>
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      </svg>
    ),
  },
  {
    label: "Embalagem",
    value: "R$ 2,00",
    color: "#46708A",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="8" width="18" height="13" rx="2" />
        <path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1s4 1 6 1c2 0 6 2 6-1s-4-3-6 1" />
      </svg>
    ),
  },
  {
    label: "Tempo de trabalho",
    value: "R$ 8,10",
    color: "#6E58A2",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    label: "Custos fixos",
    value: "R$ 3,00",
    color: "#B04848",
    icon: (
      <svg {...iconProps}>
        <path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" />
      </svg>
    ),
  },
];

const CHIP_W = 500;
const CHIP_H = 72;

const Chip = ({item, style}: {item: CostItem; style?: CSSProperties}) => (
  <div
    style={{
      position: "absolute",
      width: CHIP_W,
      height: CHIP_H,
      borderRadius: 36,
      backgroundColor: C.white,
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "0 28px 0 12px",
      boxShadow: "0 14px 34px rgba(74,35,50,0.12), 0 0 0 1.5px rgba(74,35,50,0.06)",
      fontFamily: F.body,
      ...style,
    }}
  >
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: item.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {item.icon}
    </div>
    <div style={{flex: 1, fontWeight: 800, fontSize: 29, color: C.ink, whiteSpace: "nowrap"}}>{item.label}</div>
    <div style={{fontWeight: 700, fontSize: 29, color: C.muted, whiteSpace: "nowrap"}}>{item.value}</div>
  </div>
);

// Receipt card geometry (stage px), shared by the hook and the pricing intro.
const CARD = {x: 1090, y: 210, w: 560, h: 600};
const rowPos = (i: number) => ({x: CARD.x + 30, y: CARD.y + 96 + i * 92});

const ReceiptShell = ({p, totalP, children}: {p: number; totalP: number; children?: ReactNode}) => (
  <div
    style={{
      position: "absolute",
      left: CARD.x,
      top: CARD.y,
      width: CARD.w,
      height: CARD.h,
      borderRadius: 40,
      backgroundColor: `rgba(255,255,255,${0.92 * p})`,
      boxShadow: `0 40px 90px rgba(74,35,50,${0.16 * p})`,
      border: `2px solid rgba(74,35,50,${0.06 * p})`,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 38,
        top: 34,
        fontFamily: F.body,
        fontWeight: 800,
        fontSize: 24,
        letterSpacing: "0.14em",
        color: C.rose,
        opacity: p,
      }}
    >
      A CONTA DE CADA VENDA
    </div>
    <div
      style={{
        position: "absolute",
        left: 38,
        right: 38,
        top: 474,
        height: 3,
        borderRadius: 2,
        backgroundColor: C.wine,
        transformOrigin: "0 50%",
        transform: `scaleX(${totalP})`,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 38,
        right: 38,
        top: 496,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        fontFamily: F.body,
        opacity: totalP,
        transform: `translateY(${(1 - totalP) * 14}px)`,
      }}
    >
      <span style={{fontWeight: 800, fontSize: 32, color: C.ink}}>Custo total</span>
      <span style={{fontWeight: 800, fontSize: 44, color: C.wine}}>R$ 23,10</span>
    </div>
    {children}
  </div>
);

const ReceiptRows = () => (
  <>
    {COSTS.map((item, i) => {
      const r = rowPos(i);
      return <Chip key={item.label} item={item} style={{left: r.x - CARD.x, top: r.y - CARD.y}} />;
    })}
  </>
);

/* ------------------------------------------------------------------ */
/* Scene 1 — Hook                                                     */
/* ------------------------------------------------------------------ */

const SCATTER = [
  {x: 1180, y: 120, r: -6},
  {x: 1400, y: 360, r: 5},
  {x: 1040, y: 640, r: 4},
  {x: 1360, y: 860, r: -5},
];

const HookScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const exit = ramp(frame, 128, 150);
  const converge = (i: number) => ramp(frame, 78 + i * 4, 108 + i * 4, 0, 1, EASE_IN_OUT);
  const cardP = ramp(frame, 92, 116);
  const totalP = ramp(frame, 112, 128);
  const underline = ramp(frame, 62, 88);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 250,
          opacity: 1 - exit,
          transform: `translateY(${exit * -50}px)`,
        }}
      >
        <RevealLine frame={frame} at={4} style={{...headline, fontSize: 132}}>
          Você vende.
        </RevealLine>
        <div style={{height: 34}} />
        <RevealLine frame={frame} at={32} style={{...headline, fontSize: 112, color: C.ink}}>
          Mas sabe o que
        </RevealLine>
        <RevealLine frame={frame} at={42} style={{...headline, fontSize: 112, color: C.rose}}>
          <span style={{position: "relative", display: "inline-block"}}>
            sobra?
            <svg
              viewBox="0 0 300 24"
              preserveAspectRatio="none"
              style={{position: "absolute", left: -6, right: -6, bottom: -14, width: "105%", height: 26}}
            >
              <path
                d="M4 15C80 5 190 4 296 11"
                stroke={C.lime}
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - underline}
              />
            </svg>
          </span>
        </RevealLine>
      </div>

      <ReceiptShell p={cardP} totalP={totalP} />

      {COSTS.map((item, i) => {
        const enter = spring({frame: frame - (12 + i * 8), fps, config: {damping: 14, stiffness: 140}});
        const c = converge(i);
        const from = SCATTER[i];
        const to = rowPos(i);
        const bob = Math.sin((frame + i * 20) / 16) * 8 * (1 - c);
        return (
          <Chip
            key={item.label}
            item={item}
            style={{
              left: lerp(from.x, to.x, c),
              top: lerp(from.y, to.y, c) + bob,
              opacity: Math.min(1, enter * 1.4),
              transform: `scale(${0.6 + 0.4 * enter}) rotate(${from.r * (1 - c)}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 2 — Pricing                                                  */
/* ------------------------------------------------------------------ */

const PRICING_CAM: CamKey[] = [
  [0, 1, 540, 1200],
  [52, 1, 540, 1200],
  [82, 2.0, 540, 660],
  [124, 2.0, 540, 660],
  [152, 1.75, 520, 1340],
  [216, 1.75, 520, 1340],
  [244, 2.0, 540, 1790],
  [286, 2.0, 540, 1790],
  [312, 1, 540, 1200],
];

// Breakdown card of current-pricing.png (screenshot px) — the receipt lands here.
const BREAKDOWN = {x: 54, y: 876, w: 972, h: 696};

const BigValue = ({label, value, accent}: {label: string; value: string; accent?: boolean}) => (
  <div style={{fontFamily: F.body}}>
    <div style={{fontWeight: 800, fontSize: 34, color: C.muted, marginBottom: 6}}>{label}</div>
    <div
      style={{
        display: "inline-block",
        fontWeight: 800,
        fontSize: 96,
        letterSpacing: "-0.02em",
        color: C.wine,
        padding: accent ? "0 18px" : 0,
        marginLeft: accent ? -18 : 0,
        borderRadius: 18,
        backgroundColor: accent ? C.lime : "transparent",
      }}
    >
      {value}
    </div>
  </div>
);

const PricingScene = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame, PRICING_CAM);

  // Receipt flies into the breakdown card while the phone arrives.
  const land = ramp(frame, 0, 30, 0, 1, EASE_IN_OUT);
  const target = {
    x: SCREEN_LEFT + BREAKDOWN.x * S,
    y: SCREEN_TOP + BREAKDOWN.y * S,
    scale: (BREAKDOWN.w * S) / CARD.w,
  };
  const receiptFade = ramp(frame, 28, 36);
  const phoneIn = ramp(frame, 4, 28);

  const exit = ramp(frame, 292, 312);
  const beatA = visible(frame, 84, 128);
  const beatB = visible(frame, 150, 218);
  const beatC = visible(frame, 244, 292);
  const rowsLit = visible(frame, 150, 218);

  return (
    <AbsoluteFill>
      <Phone
        cam={cam}
        layers={[{src: "launch/current-pricing.png"}]}
        style={{opacity: phoneIn}}
      >
        <Highlight x={54} y={498} w={972} h={324} p={visible(frame, 84, 126)} color={C.rose} />
        <Highlight x={80} y={1136} w={940} h={404} p={rowsLit} color={C.rose} />
        <Highlight x={84} y={1776} w={470} h={170} p={visible(frame, 248, 288)} color={C.lime} />
      </Phone>

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          opacity: 1 - receiptFade,
          transformOrigin: "0 0",
          transform: `translate(${lerp(0, target.x - CARD.x * lerp(1, target.scale, land), land)}px, ${lerp(
            0,
            target.y - (CARD.y + 80) * lerp(1, target.scale, land),
            land,
          )}px) scale(${lerp(1, target.scale, land)})`,
        }}
      >
        <ReceiptShell p={1} totalP={1}>
          <ReceiptRows />
        </ReceiptShell>
      </div>

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 210,
          width: 760,
          opacity: 1 - exit,
          transform: `translateY(${exit * -40}px)`,
        }}
      >
        <Kicker frame={frame} at={30}>
          Precificação
        </Kicker>
        <RevealLine frame={frame} at={36} style={{...headline, fontSize: 124}}>
          Preço
        </RevealLine>
        <RevealLine frame={frame} at={44} style={{...headline, fontSize: 124}}>
          sem chute.
        </RevealLine>

        <div style={{position: "relative", marginTop: 70, height: 360}}>
          <div style={{position: "absolute", inset: 0, opacity: beatA, transform: `translateY(${(1 - beatA) * 20}px)`}}>
            <BigValue label="Preço estimado" value="R$ 30,49" />
          </div>
          <div style={{position: "absolute", inset: 0, opacity: beatB}}>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.muted, marginBottom: 18}}>
              O cálculo considera
            </div>
            {["Insumos", "Embalagem", "Mão de obra", "Custos fixos"].map((label, i) => {
              const p = ramp(frame, 158 + i * 12, 172 + i * 12);
              return (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    marginBottom: 12,
                    opacity: p,
                    transform: `translateX(${(1 - p) * -20}px)`,
                    fontFamily: F.body,
                    fontWeight: 800,
                    fontSize: 44,
                    color: C.ink,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: COSTS[i].color,
                    }}
                  />
                  {label}
                </div>
              );
            })}
          </div>
          <div style={{position: "absolute", inset: 0, opacity: beatC, transform: `translateY(${(1 - beatC) * 20}px)`}}>
            <BigValue label="Lucro por unidade" value="R$ 7,39" accent />
          </div>
        </div>
      </div>
      <Footnote opacity={phoneIn} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 3 — Product                                                  */
/* ------------------------------------------------------------------ */

const PRODUCT_CAM: CamKey[] = [
  [0, 1, 540, 1200],
  [108, 1, 540, 1200],
  [140, 1.8, 560, 1010],
  [212, 1.8, 560, 1010],
  [238, 1, 540, 1200],
];

// Stage position of the "Salvar e criar produto" callout.
const SAVE_BTN = {x: 140, y: 580, w: 560, h: 96};

const ProductScene = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame, PRODUCT_CAM);
  const exit = ramp(frame, 218, 238);

  const btnIn = ramp(frame, 26, 44);
  const clickAt = 70;
  const btnFly = ramp(frame, clickAt + 2, clickAt + 26, 0, 1, EASE_IN_OUT);
  const wipe = ramp(frame, clickAt + 6, clickAt + 38, 0, 1, EASE_IN_OUT);

  const cursorPath = ramp(frame, 38, clickAt - 2, 0, 1, EASE_IN_OUT);
  const cursorX = lerp(1000, SAVE_BTN.x + SAVE_BTN.w * 0.62, cursorPath);
  const cursorY = lerp(980, SAVE_BTN.y + SAVE_BTN.h * 0.55, cursorPath);
  const cursorOpacity = visible(frame, 36, clickAt + 14, 8);

  const priceLit = visible(frame, 142, 212);
  const stockLit = visible(frame, 170, 212);
  const listA = visible(frame, 142, 214);
  const listB = visible(frame, 170, 214);

  return (
    <AbsoluteFill>
      <Phone
        cam={cam}
        layers={[
          {src: "launch/current-pricing.png"},
          {
            src: "launch/current-products.png",
            style: {clipPath: `inset(${(1 - wipe) * 100}% 0 0 0)`},
          },
        ]}
      >
        {wipe > 0 && wipe < 1 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: (1 - wipe) * SHOT_H - 6,
              height: 12,
              backgroundColor: C.lime,
              boxShadow: `0 0 40px ${C.lime}`,
            }}
          />
        ) : null}
        <Highlight x={244} y={846} w={196} h={86} p={priceLit} radius={22} dim={0.6} />
        <Highlight x={244} y={1106} w={170} h={86} p={priceLit} radius={22} dim={0} />
        <Highlight x={746} y={838} w={276} h={98} p={stockLit} color={C.lime} radius={30} dim={0} />
        <Highlight x={852} y={1102} w={170} h={96} p={stockLit} color={C.lime} radius={30} dim={0} />
      </Phone>

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 200,
          width: 900,
          opacity: 1 - exit,
          transform: `translateY(${exit * -40}px)`,
        }}
      >
        <Kicker frame={frame} at={4}>
          Produtos
        </Kicker>
        <RevealLine frame={frame} at={8} style={{...headline, fontSize: 72, whiteSpace: "nowrap"}}>
          Da conta ao produto.
        </RevealLine>
        <RevealLine frame={frame} at={18} style={{...headline, fontSize: 72, color: C.rose, whiteSpace: "nowrap"}}>
          Sem começar de novo.
        </RevealLine>

        <div style={{position: "relative", marginTop: 110}}>
          {[
            {label: "Preço de venda na lista", p: listA, color: C.rose},
            {label: "Estoque de cada item", p: listB, color: C.lime},
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginBottom: 20,
                opacity: row.p,
                transform: `translateX(${(1 - row.p) * -24}px)`,
                fontFamily: F.body,
                fontWeight: 800,
                fontSize: 46,
                color: C.ink,
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: row.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={row.color === C.lime ? C.wine : C.white} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              {row.label}
            </div>
          ))}
        </div>
      </div>

      {/* The real button label from the pricing result; it flies into the phone on click. */}
      <div
        style={{
          position: "absolute",
          left: lerp(SAVE_BTN.x, PHONE_CX - SAVE_BTN.w / 2, btnFly),
          top: lerp(SAVE_BTN.y, PHONE_CY - SAVE_BTN.h / 2, btnFly),
          width: SAVE_BTN.w,
          height: SAVE_BTN.h,
          opacity: btnIn * (1 - ramp(frame, clickAt + 14, clickAt + 26)),
          transform: `scale(${(0.92 + 0.08 * btnIn) * lerp(1, 0.4, btnFly)})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: -48,
            fontFamily: F.body,
            fontWeight: 800,
            fontSize: 26,
            color: C.muted,
            opacity: 1 - btnFly,
          }}
        >
          No fim do cálculo:
        </div>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 24,
            backgroundColor: C.rose,
            color: C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.body,
            fontWeight: 800,
            fontSize: 38,
            boxShadow: "0 20px 44px rgba(182,95,114,0.35)",
          }}
        >
          Salvar e criar produto
        </div>
      </div>

      <div style={{opacity: cursorOpacity}}>
        <Cursor x={cursorX} y={cursorY} clickAt={clickAt} frame={frame} />
      </div>
      <Footnote opacity={1} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 4 — Catalog                                                  */
/* ------------------------------------------------------------------ */

const CATALOG_CAM: CamKey[] = [
  [0, 1, 540, 1200],
  [84, 1, 540, 1200],
  [114, 1.9, 540, 1330],
  [214, 1.9, 540, 1330],
  [240, 1, 540, 1200],
];

// Brigadeiro card in current-products.png (screenshot px).
const PRODUCT_CARD = {x: 46, y: 978, w: 988, h: 230};
// "17 produtos" stat in current-catalog.png.
const CATALOG_STAT = {x: 269, y: 1176};

const ChatIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.6-5.4A8.4 8.4 0 1 1 21 11.5z" />
    <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" strokeWidth="3" />
  </svg>
);

const CatalogScene = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame, CATALOG_CAM);
  const exit = ramp(frame, 244, 270, 0, 1, EASE_IN_OUT);

  const swap = ramp(frame, 24, 50, 0, 1, EASE_IN_OUT);
  const lift = ramp(frame, 6, 24);
  const fly = ramp(frame, 28, 64, 0, 1, EASE_IN_OUT);
  const cardFade = ramp(frame, 58, 70);
  const pulse = ramp(frame, 64, 92);

  const start = {x: SCREEN_LEFT + PRODUCT_CARD.x * S, y: SCREEN_TOP + PRODUCT_CARD.y * S};
  const statStage = toStage(REST, CATALOG_STAT.x, CATALOG_STAT.y);
  const cardW = PRODUCT_CARD.w * S;
  const cardH = PRODUCT_CARD.h * S;
  const flyScale = lerp(1 + lift * 0.1, 0.3, fly);
  const cardX = lerp(start.x + cardW / 2 - 60 * lift, statStage.x, fly);
  // arc upward while flying
  const cardY = lerp(start.y + cardH / 2, statStage.y, fly) - Math.sin(fly * Math.PI) * 120;

  const clickAt = 160;
  const share = toStage(cam, 540, 1527);
  const cursorP = ramp(frame, 118, clickAt - 2, 0, 1, EASE_IN_OUT);
  const cursorX = lerp(1880, share.x + 60, cursorP);
  const cursorY = lerp(980, share.y + 6, cursorP);

  const pedido = ramp(frame, 188, 210);
  const semTaxa = ramp(frame, 212, 230);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: 1 - exit,
          transformOrigin: `${PHONE_CX}px ${PHONE_CY}px`,
          transform: `scale(${1 - exit * 0.12})`,
        }}
      >
        <Phone
          cam={cam}
          layers={[
            {src: "launch/current-products.png"},
            {
              src: "launch/current-catalog.png",
              style: {clipPath: `inset(0 0 ${(1 - swap) * 100}% 0)`},
            },
          ]}
        >
          {swap > 0 && swap < 1 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: swap * SHOT_H - 6,
                height: 12,
                backgroundColor: C.lime,
                boxShadow: `0 0 40px ${C.lime}`,
              }}
            />
          ) : null}
          {/* gap left by the lifted card */}
          <div
            style={{
              position: "absolute",
              left: PRODUCT_CARD.x,
              top: PRODUCT_CARD.y,
              width: PRODUCT_CARD.w,
              height: PRODUCT_CARD.h,
              borderRadius: 40,
              backgroundColor: C.surface,
              opacity: lift * (1 - swap),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: CATALOG_STAT.x - 150,
              top: CATALOG_STAT.y - 150,
              width: 300,
              height: 300,
              borderRadius: 150,
              border: `10px solid ${C.lime}`,
              opacity: frame > 64 ? 1 - pulse : 0,
              transform: `scale(${0.4 + pulse * 0.8})`,
            }}
          />
          <Highlight x={92} y={1322} w={896} h={136} p={visible(frame, 116, 150)} color={C.rose} />
          <Highlight x={92} y={1476} w={896} h={102} p={visible(frame, 150, 214)} color={C.lime} radius={26} />
        </Phone>

        {fly < 1 ? (
          <div
            style={{
              position: "absolute",
              left: cardX - cardW / 2,
              top: cardY - cardH / 2,
              width: cardW,
              height: cardH,
              borderRadius: 16,
              opacity: lift * (1 - cardFade),
              transform: `scale(${flyScale})`,
              overflow: "hidden",
              boxShadow: `0 ${10 + lift * 30}px ${20 + lift * 40}px rgba(74,35,50,${0.1 + lift * 0.2})`,
            }}
          >
            <CropImg src="launch/current-products.png" scale={S} x={PRODUCT_CARD.x} y={PRODUCT_CARD.y} />
          </div>
        ) : null}

        {frame >= 110 && frame < 200 ? (
          <div style={{opacity: visible(frame, 112, 186, 8)}}>
            <Cursor x={cursorX} y={cursorY} clickAt={clickAt} frame={frame} />
          </div>
        ) : null}
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 170,
          width: 820,
          opacity: 1 - exit,
          transform: `translateY(${exit * -40}px)`,
        }}
      >
        <Kicker frame={frame} at={4}>
          Catálogo
        </Kicker>
        <RevealLine frame={frame} at={10} style={{...headline, fontSize: 116}}>
          Mostre.
        </RevealLine>
        <RevealLine frame={frame} at={clickAt - 4} style={{...headline, fontSize: 116}}>
          Compartilhe.
        </RevealLine>
        <RevealLine frame={frame} at={184} style={{...headline, fontSize: 116, color: C.rose}}>
          Venda.
        </RevealLine>

        <div
          style={{
            marginTop: 54,
            display: "flex",
            alignItems: "center",
            gap: 24,
            opacity: pedido,
            transform: `translateY(${(1 - pedido) * 20}px)`,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: C.wine,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ChatIcon />
          </div>
          <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 38, color: C.ink, lineHeight: 1.2}}>
            O cliente escolhe e inicia
            <br />o pedido pelo WhatsApp.
          </div>
        </div>
        <div
          style={{
            marginTop: 18,
            marginLeft: 100,
            fontFamily: F.body,
            fontWeight: 700,
            fontSize: 30,
            color: C.muted,
            opacity: semTaxa,
          }}
        >
          Sem comissão por pedido.
        </div>
      </div>
      <Footnote opacity={1 - exit} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 5 — Overview                                                 */
/* ------------------------------------------------------------------ */

const DESK_W = 2160;
const DESK_H = 1350;

const DesktopWindow = ({src, width, style}: {src: string; width: number; style?: CSSProperties}) => {
  const scale = width / DESK_W;
  return (
    <div
      style={{
        position: "absolute",
        width,
        height: DESK_H * scale + 44,
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: C.white,
        boxShadow: "0 50px 100px rgba(74,35,50,0.2), 0 0 0 1.5px rgba(74,35,50,0.08)",
        ...style,
      }}
    >
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 20px",
          backgroundColor: C.surface,
          borderBottom: "1.5px solid rgba(74,35,50,0.08)",
        }}
      >
        {["#E3B9C2", "#E9DFA4", "#CFE3CF"].map((color) => (
          <span key={color} style={{width: 14, height: 14, borderRadius: 7, backgroundColor: color}} />
        ))}
      </div>
      <Img src={staticFile(src)} style={{width, height: DESK_H * scale, display: "block"}} />
    </div>
  );
};

const OVERVIEW_ITEMS = [
  {title: "Vendas organizadas", text: "Pedidos, pagamentos e o que falta receber."},
  {title: "Agenda de encomendas", text: "Prazos e entregas em um só lugar."},
  {title: "Dinheiro mais claro", text: "Quanto entrou, quanto saiu e o que sobrou."},
];

// Entradas/Saídas region of current-finance.png (skips the period summary card).
const FIN_CROP = {x: 20, y: 1180, w: 1040, h: 700};

const OverviewScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const exit = ramp(frame, 190, 210, 0, 1, EASE_IN_OUT);
  const push = interpolate(frame, [0, 210], [1, 1.05]);

  const inV = spring({frame: frame - 4, fps, config: {damping: 18, stiffness: 110}});
  const inA = spring({frame: frame - 62, fps, config: {damping: 18, stiffness: 110}});
  const inF = spring({frame: frame - 120, fps, config: {damping: 18, stiffness: 110}});
  const active = frame < 62 ? 0 : frame < 120 ? 1 : 2;
  const itemP = (i: number) => visible(frame, [8, 66, 124][i], [58, 116, 250][i], 12);
  const both = ramp(frame, 150, 168);

  const finScale = 0.52;

  return (
    <AbsoluteFill style={{opacity: 1 - exit}}>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 92,
          ...headline,
          fontSize: 76,
          opacity: ramp(frame, 0, 18),
          transform: `translateY(${(1 - ramp(frame, 0, 18)) * 24}px)`,
        }}
      >
        Depois da venda, <span style={{color: C.rose}}>tudo em ordem.</span>
      </div>

      <AbsoluteFill style={{transformOrigin: "700px 640px", transform: `scale(${push})`}}>
        <DesktopWindow
          src="launch/desktop-vendas.jpg"
          width={1100}
          style={{
            left: 140,
            top: 250,
            opacity: inV,
            transformOrigin: "50% 0",
            transform: `translateY(${(1 - inV) * 160}px) scale(${1 - inA * 0.08}) translateX(${inA * -30}px)`,
            filter: `brightness(${1 - inA * 0.08})`,
          }}
        />
        <DesktopWindow
          src="launch/desktop-agenda.jpg"
          width={1040}
          style={{
            left: 330,
            top: 330,
            opacity: inA,
            transform: `translateX(${(1 - inA) * 500}px) scale(${1 - inF * 0.05})`,
            filter: `brightness(${1 - inF * 0.06})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 780,
            top: 520,
            width: FIN_CROP.w * finScale,
            height: FIN_CROP.h * finScale,
            borderRadius: 30,
            overflow: "hidden",
            opacity: inF,
            transform: `translateY(${(1 - inF) * 300}px) rotate(${(1 - inF) * 4}deg)`,
            boxShadow: "0 50px 100px rgba(74,35,50,0.28), 0 0 0 10px #24181E",
            backgroundColor: C.canvas,
          }}
        >
          <CropImg src="launch/current-finance.png" scale={finScale} x={FIN_CROP.x} y={FIN_CROP.y} />
        </div>
      </AbsoluteFill>

      <div style={{position: "absolute", left: 1420, top: 330, width: 400}}>
        <div style={{display: "flex", gap: 10, marginBottom: 34}}>
          {OVERVIEW_ITEMS.map((item, i) => (
            <span
              key={item.title}
              style={{
                width: i === active ? 44 : 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: i === active ? C.rose : "rgba(74,35,50,0.18)",
              }}
            />
          ))}
        </div>
        <div style={{position: "relative", height: 300}}>
          {OVERVIEW_ITEMS.map((item, i) => {
            const p = itemP(i);
            return (
              <div
                key={item.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 26}px)`,
                }}
              >
                <div style={{...headline, fontSize: 58, marginBottom: 18}}>{item.title}</div>
                <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 34, color: C.ink, lineHeight: 1.25}}>
                  {item.text}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 30,
            display: "inline-flex",
            padding: "12px 24px",
            borderRadius: 30,
            backgroundColor: C.lime,
            fontFamily: F.body,
            fontWeight: 800,
            fontSize: 28,
            color: C.wine,
            whiteSpace: "nowrap",
            opacity: both,
            transform: `scale(${0.9 + both * 0.1})`,
          }}
        >
          No celular e no computador
        </div>
      </div>
      <Footnote opacity={1} left={1420} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 6 — Closing                                                  */
/* ------------------------------------------------------------------ */

const EMOJI_FONT = `${F.body}, "Noto Color Emoji", "Apple Color Emoji", sans-serif`;

/** Convite para comentar (sem link no vídeo; o link vai na legenda do post). */
const CommentInvite = ({size = 150, bounce = 0}: {size?: number; bounce?: number}) => (
  <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
    <div style={{fontFamily: F.body, fontWeight: 800, fontSize: size * 0.46, color: C.rose, marginBottom: 14}}>
      Comente
    </div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.2,
        padding: `${size * 0.1}px ${size * 0.34}px`,
        borderRadius: size * 0.34,
        backgroundColor: C.wine,
        color: C.white,
        fontFamily: EMOJI_FONT,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "0.01em",
        lineHeight: 1.15,
        whiteSpace: "nowrap",
      }}
    >
      <span>PRECIFICAÇÃO</span>
      <span style={{fontSize: size * 0.8, transform: `translateY(${bounce}px)`}}>👇</span>
    </div>
  </div>
);

const ClosingScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const logo = spring({frame: frame - 2, fps, config: {damping: 13, stiffness: 120}});
  const invite = spring({frame: frame - 26, fps, config: {damping: 12, stiffness: 120}});
  const bounce = frame > 40 ? Math.abs(Math.sin((frame - 40) / 7)) * 12 : 0;
  const glow = 0.5 + 0.5 * Math.sin(frame / 12);

  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 34,
            overflow: "hidden",
            boxShadow: "0 24px 56px rgba(74,35,50,0.2)",
            transform: `scale(${logo}) rotate(${(1 - logo) * -10}deg)`,
            marginBottom: 34,
          }}
        >
          <Img src={staticFile("launch/logo.png")} style={{width: 132, height: 132}} />
        </div>
        <RevealLine frame={frame} at={8} style={{...headline, fontSize: 80, textAlign: "center"}}>
          Quer saber quanto cobrar
        </RevealLine>
        <RevealLine frame={frame} at={14} style={{...headline, fontSize: 80, textAlign: "center"}}>
          pelo que você <span style={{color: C.rose}}>vende?</span>
        </RevealLine>
        <div
          style={{
            marginTop: 52,
            display: "flex",
            opacity: Math.min(1, invite * 1.5),
            transform: `scale(${0.7 + 0.3 * invite})`,
            filter: `drop-shadow(0 24px 40px rgba(74,35,50,${0.2 + glow * 0.08}))`,
          }}
        >
          <CommentInvite size={124} bounce={bounce} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

/** Capa (thumbnail) do vídeo de lançamento. */
const LaunchCover = () => (
  <AbsoluteFill style={{backgroundColor: C.canvas}}>
    <Backdrop />
    <Phone cam={REST} layers={[{src: "launch/current-pricing.png"}]}>
      <Highlight x={84} y={1776} w={470} h={170} p={1} color={C.lime} dim={0} />
    </Phone>
    <div style={{position: "absolute", left: 140, top: 190, width: 900}}>
      <div style={{display: "flex", alignItems: "center", gap: 22, marginBottom: 46}}>
        <div style={{width: 92, height: 92, borderRadius: 24, overflow: "hidden", boxShadow: "0 16px 36px rgba(74,35,50,0.18)"}}>
          <Img src={staticFile("launch/logo.png")} style={{width: 92, height: 92}} />
        </div>
        <div style={{...headline, fontSize: 54}}>Lucro Caseiro</div>
      </div>
      <div style={{...headline, fontSize: 104}}>
        Saiba quanto cobrar e <span style={{color: C.rose}}>o que sobra</span> de cada venda.
      </div>
      <div style={{marginTop: 56, display: "inline-flex", alignItems: "flex-end", gap: 18}}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "20px 38px",
            borderRadius: 50,
            backgroundColor: C.wine,
            color: C.white,
            fontFamily: EMOJI_FONT,
            fontWeight: 800,
            fontSize: 40,
          }}
        >
          Comente&nbsp;<span style={{color: C.lime}}>PRECIFICAÇÃO</span>
        </div>
        <div style={{fontFamily: EMOJI_FONT, fontSize: 56}}>👇</div>
      </div>
    </div>
  </AbsoluteFill>
);

export const LaunchVideo = () => {
  const sc = LAUNCH_SCENES;
  return (
    <AbsoluteFill style={{backgroundColor: C.canvas}}>
      <Backdrop />
      <Sequence from={sc.hook.from} durationInFrames={sc.hook.duration} name="1 Gancho">
        <HookScene />
      </Sequence>
      <Sequence from={sc.pricing.from} durationInFrames={sc.pricing.duration} name="2 Precificação">
        <PricingScene />
      </Sequence>
      <Sequence from={sc.product.from} durationInFrames={sc.product.duration} name="3 Produto">
        <ProductScene />
      </Sequence>
      <Sequence from={sc.catalog.from} durationInFrames={sc.catalog.duration} name="4 Catálogo">
        <CatalogScene />
      </Sequence>
      <Sequence from={sc.overview.from} durationInFrames={sc.overview.duration} name="5 Visão geral">
        <OverviewScene />
      </Sequence>
      <Sequence from={sc.closing.from} durationInFrames={sc.closing.duration} name="6 Encerramento">
        <ClosingScene />
      </Sequence>
      <Audio src={staticFile("launch/trilha.mp3")} volume={0.9} />
    </AbsoluteFill>
  );
};

export const LaunchComposition = () => (
  <>
    <Composition
      id="LucroCaseiroLancamento"
      component={LaunchVideo}
      durationInFrames={LAUNCH_DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Still id="LucroCaseiroLancamentoCapa" component={LaunchCover} width={1920} height={1080} />
  </>
);
