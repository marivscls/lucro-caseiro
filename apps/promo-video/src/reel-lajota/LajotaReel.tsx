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
  staticFile,
  useCurrentFrame,
} from "remotion";

import {
  MARKETING_COLORS as C,
  MARKETING_FONTS as F,
} from "../marketing-brand";

/**
 * Reel "A lajota" (1080x1920, 30 fps, ~30 s).
 * Abertura: encenação ilustrada (original) de uma confeiteira cobrindo uma lajota,
 * inspirada numa história que viralizou em set/2026; não usa o vídeo original
 * nem identifica a confeiteira. Depois, telas reais do app (demo com dados de
 * exemplo): venda no Fiado e a lista de quem ainda precisa pagar.
 */

const DIR = "reel-lajota";
const src = (f: string) => staticFile(`${DIR}/${f}`);

// Cenas (frames)
const ENCENACAO = { from: 0, to: 150 };
const PAUSA = { from: 150, to: 390 };
const APP = { from: 390, to: 690 };
const FINAL = { from: 690, to: 915 };
const COMENTE = { from: 915, to: 1020 };
export const LAJOTA_DURATION = FINAL.to;
export const LAJOTA_COMENTE_DURATION = COMENTE.to;

const VOICE = [
  { file: "voz-a1.wav", at: 158 },
  { file: "voz-a2.wav", at: 212 },
  { file: "voz-b1.wav", at: 402 },
  { file: "voz-b2.wav", at: 512 },
  { file: "voz-c1.wav", at: 702 },
  { file: "voz-c2.wav", at: 790 },
];
const VOICE_COMENTE = { file: "voz-c3.wav", at: 930 };

const TERRACOTA = "#C4673F";
const TERRACOTA_DARK = "#9E4E2E";
const CREAM = "#FFF7F1";
const GREEN = "#3F8F5A";

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const r = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], { ...clamp, easing: ease });

/* ---------- elementos comuns ---------- */

const Canvas = ({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) => (
  <AbsoluteFill style={{ backgroundColor: dark ? C.wine : C.canvas }}>
    {children}
  </AbsoluteFill>
);

/** Legenda grande (o vídeo precisa funcionar sem som). Área segura: 230–1560 px. */
const Caption = ({
  children,
  top = 250,
  from = 0,
  to = 99999,
  size = 68,
  color = C.ink,
  instant = false,
}: {
  children: ReactNode;
  top?: number;
  from?: number;
  to?: number;
  size?: number;
  color?: string;
  instant?: boolean;
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const p = instant ? 1 : r(frame, from, from + 9);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 80,
        right: 110,
        textAlign: "center",
        fontFamily: F.display,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.1,
        letterSpacing: -1.5,
        color,
        opacity: p,
        translate: `0px ${interpolate(p, [0, 1], [18, 0])}px`,
      }}
    >
      {children}
    </div>
  );
};

const Hl = ({
  children,
  color = C.rose,
}: {
  children: ReactNode;
  color?: string;
}) => <span style={{ color }}>{children}</span>;

const Chip = ({
  children,
  top,
  dark = false,
}: {
  children: ReactNode;
  top: number;
  dark?: boolean;
}) => (
  <div
    style={{
      position: "absolute",
      top,
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
        backgroundColor: dark ? "rgba(255,255,255,0.14)" : C.wine,
        color: C.white,
        fontFamily: F.body,
        fontWeight: 800,
        fontSize: 30,
        letterSpacing: 1.5,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  </div>
);

/* ---------- 1. Encenação (ilustração original) ---------- */

const BRICK = { x: 250, y: 360, w: 420, h: 200, depth: 110, lift: 70 };

const Lajota = () => {
  const { x, y, w, h, depth, lift } = BRICK;
  const holes = [0, 1, 2].flatMap((row) => [0, 1].map((col) => ({ row, col })));
  return (
    <g>
      {/* topo */}
      <polygon
        points={`${x},${y} ${x + w},${y} ${x + w + depth},${y - lift} ${x + depth},${y - lift}`}
        fill="#D37A52"
      />
      {/* frente */}
      <rect x={x} y={y} width={w} height={h} fill={TERRACOTA} />
      {[0.33, 0.66].map((k) => (
        <line
          key={k}
          x1={x}
          x2={x + w}
          y1={y + h * k}
          y2={y + h * k}
          stroke={TERRACOTA_DARK}
          strokeWidth={3}
          opacity={0.35}
        />
      ))}
      {/* lateral com furos */}
      <polygon
        points={`${x + w},${y} ${x + w + depth},${y - lift} ${x + w + depth},${y + h - lift} ${x + w},${y + h}`}
        fill={TERRACOTA_DARK}
      />
      {holes.map(({ row, col }) => {
        const hx = x + w + 18 + col * 44;
        const hy = y + 22 + row * 60 - (18 + col * 44) * (lift / depth);
        return (
          <rect
            key={`${row}-${col}`}
            x={hx}
            y={hy}
            width={30}
            height={40}
            rx={6}
            fill="#5C2A17"
            transform={`skewY(${(-Math.atan(lift / depth) * 180) / Math.PI})`}
            style={{
              transformOrigin: `${hx}px ${hy}px`,
              transformBox: "view-box",
            }}
          />
        );
      })}
    </g>
  );
};

const Encenacao = () => {
  const frame = useCurrentFrame();
  const { x, y, w, h, depth, lift } = BRICK;
  // Cobertura avança da esquerda para a direita (frames 18–110)
  const cover = interpolate(frame, [18, 110], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const coverX = x - 20 + cover * (w + depth + 50);
  const spatulaOn = frame >= 12 && frame < 122;
  const spatulaWiggle = Math.sin(frame / 3.2) * 8;
  const rosettes = Array.from({ length: 7 }, (_, i) => i);
  const zoom = interpolate(frame, [0, 150], [1, 1.06]);

  return (
    <Canvas>
      <Chip top={250}>Encenação</Chip>
      <Caption top={340} instant size={70}>
        Ela entregou o pedido anterior <Hl>e não recebeu</Hl>
      </Caption>
      <div
        style={{
          position: "absolute",
          top: 620,
          left: 60,
          width: 960,
          height: 820,
          scale: String(zoom * 1.18),
        }}
      >
        <svg viewBox="0 0 960 820" width={960} height={820}>
          <defs>
            <clipPath id="cobertura">
              <rect x={0} y={0} width={coverX} height={820} />
            </clipPath>
          </defs>
          {/* bancada */}
          <rect x={0} y={640} width={960} height={180} fill={C.surface} />
          {/* base do bolo */}
          <ellipse cx={500} cy={640} rx={380} ry={70} fill="#D9D2CC" />
          <ellipse cx={500} cy={630} rx={380} ry={70} fill="#EDE8E3" />
          <g transform="translate(0, 60)">
            <Lajota />
            {/* chantilly cobrindo */}
            <g clipPath="url(#cobertura)">
              <path
                d={`M ${x - 18} ${y + h + 12}
                    L ${x - 18} ${y - 10}
                    Q ${x + depth * 0.5} ${y - lift - 30} ${x + depth + 20} ${y - lift - 20}
                    L ${x + w + depth + 16} ${y - lift - 20}
                    L ${x + w + depth + 16} ${y + h - lift + 12}
                    L ${x + w + 14} ${y + h + 14} Z`}
                fill={CREAM}
                stroke="#EBDDD4"
                strokeWidth={4}
              />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <path
                  key={i}
                  d={`M ${x + 10 + i * 70} ${y + 40} q 30 -18 60 0`}
                  stroke="#EFE2D9"
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                />
              ))}
            </g>
            {/* confeitos (bicos) */}
            {rosettes.map((i) => {
              const at = 112 + i * 4;
              const s = r(frame, at, at + 8);
              const cx = x + 30 + i * ((w + depth - 60) / 6);
              const cy = y - (i / 6) * lift - 14;
              return (
                <g key={i} transform={`translate(${cx} ${cy}) scale(${s})`}>
                  <circle
                    r={20}
                    fill={C.roseSoft}
                    stroke={C.rose}
                    strokeWidth={4}
                  />
                  <circle r={7} fill={C.rose} />
                </g>
              );
            })}
            {/* espátula */}
            {spatulaOn ? (
              <g
                transform={`translate(${coverX} ${y - 40 + spatulaWiggle}) rotate(-28)`}
              >
                <rect
                  x={-12}
                  y={-150}
                  width={24}
                  height={200}
                  rx={10}
                  fill="#C9CED3"
                />
                <rect
                  x={-16}
                  y={-270}
                  width={32}
                  height={130}
                  rx={14}
                  fill="#8A5A3B"
                />
              </g>
            ) : null}
          </g>
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1500,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: F.body,
          fontWeight: 700,
          fontSize: 28,
          color: C.muted,
        }}
      >
        Imagens originais · não é a confeiteira real
      </div>
    </Canvas>
  );
};

/* ---------- Pausa: interrompe a cena ---------- */

const PauseFlash = () => {
  const frame = useCurrentFrame();
  const p = r(frame, 0, 6);
  const out = r(frame, 14, 22);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: p * (1 - out),
      }}
    >
      <AbsoluteFill style={{ backgroundColor: "rgba(36,24,30,0.45)" }} />
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: C.white,
          display: "flex",
          gap: 26,
          justifyContent: "center",
          alignItems: "center",
          scale: String(interpolate(p, [0, 1], [0.7, 1])),
        }}
      >
        <div
          style={{
            width: 30,
            height: 80,
            borderRadius: 8,
            backgroundColor: C.wine,
          }}
        />
        <div
          style={{
            width: 30,
            height: 80,
            borderRadius: 8,
            backgroundColor: C.wine,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const StatusCard = ({
  from,
  top,
  icon,
  title,
  value,
  tone,
}: {
  from: number;
  top: number;
  icon: ReactNode;
  title: string;
  value: ReactNode;
  tone: string;
}) => {
  const frame = useCurrentFrame();
  const p = r(frame, from, from + 12);
  if (frame < from) return null;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 100,
        right: 130,
        padding: "40px 44px",
        borderRadius: 36,
        backgroundColor: C.white,
        boxShadow: "0 18px 50px rgba(74,35,50,0.10)",
        display: "flex",
        alignItems: "center",
        gap: 30,
        opacity: p,
        translate: `0px ${interpolate(p, [0, 1], [40, 0])}px`,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 999,
          backgroundColor: tone,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ fontFamily: F.body }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.muted }}>
          {title}
        </div>
        <div
          style={{
            fontSize: 62,
            fontWeight: 800,
            color: C.ink,
            letterSpacing: -1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
};

const Check = () => (
  <svg width={66} height={66} viewBox="0 0 24 24">
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      stroke={C.white}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Clock = ({ frame }: { frame: number }) => (
  <svg width={70} height={70} viewBox="0 0 24 24">
    <circle
      cx={12}
      cy={12}
      r={9}
      stroke={C.wine}
      strokeWidth={2.4}
      fill="none"
    />
    <line
      x1={12}
      y1={12}
      x2={12}
      y2={6.5}
      stroke={C.wine}
      strokeWidth={2.4}
      strokeLinecap="round"
      transform={`rotate(${frame * 6} 12 12)`}
    />
    <line
      x1={12}
      y1={12}
      x2={15.5}
      y2={12}
      stroke={C.wine}
      strokeWidth={2.4}
      strokeLinecap="round"
    />
  </svg>
);

const Pausa = () => {
  const frame = useCurrentFrame();
  // frames relativos ao início da cena (150)
  const dots = ".".repeat(1 + (Math.floor(frame / 10) % 3));
  return (
    <Canvas>
      <Caption top={560} from={8} to={62} size={96}>
        A história <Hl>viralizou.</Hl>
      </Caption>
      <Caption top={300} from={62} to={162}>
        Mas quem vende por encomenda <Hl>conhece o problema:</Hl>
      </Caption>
      <Caption top={300} from={162} to={240}>
        entregar e ficar
        <br />
        <Hl>esperando o pagamento.</Hl>
      </Caption>
      <StatusCard
        from={78}
        top={660}
        tone={GREEN}
        icon={<Check />}
        title="Encomenda"
        value="Entregue"
      />
      <StatusCard
        from={166}
        top={960}
        tone={C.roseSoft}
        icon={<Clock frame={frame} />}
        title="Pagamento"
        value={<span>Aguardando{dots}</span>}
      />
    </Canvas>
  );
};

/* ---------- App: telas reais ---------- */

type Shot = {
  file: string;
  from: number;
  to: number;
  /** trecho da tela (px da captura, 1080 de largura) no topo da janela: início e fim */
  y: [number, number];
  /** destaque em px da captura */
  hl?: { x: number; y: number; w: number; h: number; at: number };
  label: string;
};

const WIN = { top: 560, width: 800, height: 1000 };
const SCALE = WIN.width / 1080;

const SHOTS: Shot[] = [
  {
    file: "produto.png",
    from: 0,
    to: 60,
    y: [740, 790],
    hl: { x: 30, y: 1085, w: 1020, h: 670, at: 14 },
    label: "1  Escolha o que foi vendido",
  },
  {
    file: "pagamento-fiado.png",
    from: 60,
    to: 120,
    y: [420, 480],
    hl: { x: 30, y: 1452, w: 1020, h: 210, at: 12 },
    label: "2  Pagamento: Fiado",
  },
  {
    file: "revisao-alta.png",
    from: 120,
    to: 175,
    y: [900, 1080],
    hl: { x: 60, y: 1590, w: 960, h: 470, at: 16 },
    label: "3  Revise e registre",
  },
  {
    file: "registrada.png",
    from: 175,
    to: 215,
    y: [420, 420],
    label: "3  Venda registrada",
  },
  {
    file: "fiado-lista-alta.png",
    from: 215,
    to: 300,
    y: [120, 300],
    hl: { x: 20, y: 990, w: 1040, h: 660, at: 44 },
    label: "4  Quem ainda precisa pagar",
  },
];

const Screen = ({ shot }: { shot: Shot }) => {
  const frame = useCurrentFrame();
  const len = shot.to - shot.from;
  const y = interpolate(frame, [6, len - 4], shot.y, {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const hlP = shot.hl ? r(frame, shot.hl.at, shot.hl.at + 10) : 0;
  const listTotal =
    shot.file === "fiado-lista-alta.png" ? 1 - r(frame, 40, 50) : 0;
  return (
    <div
      style={{
        position: "absolute",
        top: WIN.top,
        left: (1080 - WIN.width) / 2 - 10,
        width: WIN.width,
        height: WIN.height,
        borderRadius: 44,
        overflow: "hidden",
        backgroundColor: C.white,
        boxShadow: "0 24px 70px rgba(74,35,50,0.16), 0 0 0 10px #2A1A21",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: -y * SCALE,
          width: WIN.width,
        }}
      >
        <Img
          src={src(shot.file)}
          style={{ width: WIN.width, display: "block" }}
        />
        {shot.hl ? (
          <div
            style={{
              position: "absolute",
              left: shot.hl.x * SCALE,
              top: shot.hl.y * SCALE,
              width: shot.hl.w * SCALE,
              height: shot.hl.h * SCALE,
              borderRadius: 28,
              border: `6px solid ${C.lime}`,
              boxShadow: `0 0 0 4px ${C.wine}`,
              opacity: hlP,
              scale: String(interpolate(hlP, [0, 1], [1.04, 1])),
            }}
          />
        ) : null}
        {listTotal > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 30 * SCALE,
              top: 205 * SCALE,
              width: 1020 * SCALE,
              height: 430 * SCALE,
              borderRadius: 30,
              border: `6px solid ${C.lime}`,
              opacity: listTotal * r(frame, 8, 16),
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

const StepLabel = ({ text }: { text: string }) => {
  const frame = useCurrentFrame();
  const p = r(frame, 0, 8);
  return (
    <div
      style={{
        position: "absolute",
        top: 480,
        left: 0,
        right: 20,
        display: "flex",
        justifyContent: "center",
        opacity: p,
      }}
    >
      <div
        style={{
          padding: "10px 26px",
          borderRadius: 999,
          backgroundColor: C.roseSoft,
          color: C.wine,
          fontFamily: F.body,
          fontWeight: 800,
          fontSize: 32,
          whiteSpace: "pre",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const AppScene = () => (
  <Canvas>
    <Caption top={235} from={0} to={122} size={60}>
      No Lucro Caseiro, você registra
      <br />
      <Hl>o que ficou pendente,</Hl>
    </Caption>
    <Caption top={235} from={122} to={206} size={60}>
      e acompanha
      <br />
      <Hl>quem ainda precisa pagar,</Hl>
    </Caption>
    <Caption top={235} from={206} to={300} size={60}>
      com o valor organizado
      <br />
      <Hl>no mesmo lugar.</Hl>
    </Caption>
    {SHOTS.map((s) => (
      <Sequence
        key={s.file}
        from={s.from}
        durationInFrames={s.to - s.from}
        layout="none"
      >
        <Screen shot={s} />
        <StepLabel text={s.label} />
      </Sequence>
    ))}
    <div
      style={{
        position: "absolute",
        top: WIN.top + WIN.height + 28,
        left: 0,
        right: 20,
        textAlign: "center",
        fontFamily: F.body,
        fontWeight: 700,
        fontSize: 28,
        color: C.muted,
      }}
    >
      Tela real do app · dados de exemplo
    </div>
  </Canvas>
);

/* ---------- Final ---------- */

const Logo = ({ size = 200 }: { size?: number }) => (
  <Img
    src={staticFile("play-store/icon.png")}
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
    }}
  />
);

const Final = ({ comente = false }: { comente?: boolean }) => {
  const frame = useCurrentFrame();
  const logoP = r(frame, 0, 12);
  const l1 = r(frame, 12, 22);
  const l2 = r(frame, 100, 110);
  const l3 = r(frame, 238, 250);
  const text: CSSProperties = {
    position: "absolute",
    left: 90,
    right: 120,
    textAlign: "center",
    fontFamily: F.display,
    fontWeight: 800,
    letterSpacing: -1.5,
  };
  return (
    <Canvas dark>
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 0,
          right: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
          opacity: logoP,
          scale: String(interpolate(logoP, [0, 1], [0.85, 1])),
        }}
      >
        <Logo />
        <div
          style={{
            fontFamily: F.accent,
            fontWeight: 700,
            fontSize: 64,
            color: C.white,
          }}
        >
          Lucro Caseiro
        </div>
      </div>
      <div
        style={{
          ...text,
          top: 820,
          fontSize: 84,
          lineHeight: 1.08,
          color: C.white,
          opacity: l1,
        }}
      >
        Venda feita{" "}
        <span style={{ color: C.lime }}>não é dinheiro recebido.</span>
      </div>
      <div
        style={{
          ...text,
          top: 1120,
          fontSize: 60,
          lineHeight: 1.15,
          color: "#F0C7D1",
          opacity: l2,
        }}
      >
        Organize suas cobranças com o Lucro Caseiro.
      </div>
      {comente ? (
        <div
          style={{
            position: "absolute",
            top: 1330,
            left: 0,
            right: 30,
            display: "flex",
            justifyContent: "center",
            opacity: l3,
            translate: `0px ${interpolate(l3, [0, 1], [24, 0])}px`,
          }}
        >
          <div
            style={{
              padding: "22px 36px",
              borderRadius: 30,
              backgroundColor: C.lime,
              color: C.wine,
              fontFamily: F.body,
              fontWeight: 800,
              fontSize: 48,
              textAlign: "center",
              maxWidth: 820,
            }}
          >
            Comente FIADO que eu te mando o link 👇
          </div>
        </div>
      ) : null}
    </Canvas>
  );
};

/* ---------- Composição ---------- */

const Soundtrack = ({ comente }: { comente: boolean }) => {
  const end = comente ? LAJOTA_COMENTE_DURATION : LAJOTA_DURATION;
  const voices = comente ? [...VOICE, VOICE_COMENTE] : VOICE;
  return (
    <>
      <Audio
        src={src("trilha.wav")}
        volume={(f) =>
          interpolate(
            f,
            [0, 150, 158, end - 45, end],
            [0.55, 0.55, 0.2, 0.2, 0],
            clamp,
          )
        }
      />
      {voices.map((v) => (
        <Sequence key={v.file} from={v.at} layout="none">
          <Audio src={src(v.file)} volume={1} />
        </Sequence>
      ))}
    </>
  );
};

export const LajotaReel = ({ comente = false }: { comente?: boolean }) => (
  <AbsoluteFill style={{ backgroundColor: C.canvas }}>
    <Sequence
      from={ENCENACAO.from}
      durationInFrames={ENCENACAO.to - ENCENACAO.from + 22}
    >
      <Encenacao />
    </Sequence>
    <Sequence from={ENCENACAO.to - 6} durationInFrames={28}>
      <PauseFlash />
    </Sequence>
    <Sequence
      from={PAUSA.from + 16}
      durationInFrames={PAUSA.to - PAUSA.from - 16}
    >
      <Sequence from={-16}>
        <Pausa />
      </Sequence>
    </Sequence>
    <Sequence from={APP.from} durationInFrames={APP.to - APP.from}>
      <AppScene />
    </Sequence>
    <Sequence from={FINAL.from}>
      <Final comente={comente} />
    </Sequence>
    <Soundtrack comente={comente} />
  </AbsoluteFill>
);

export const LajotaCapa = () => (
  <Canvas>
    <Caption top={360} instant size={84}>
      Entregou o pedido <Hl>e não recebeu?</Hl>
    </Caption>
    <div
      style={{
        position: "absolute",
        top: 760,
        left: 0,
        right: 30,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Logo size={260} />
    </div>
    <Caption top={1120} instant size={64}>
      Venda feita não é <Hl>dinheiro recebido.</Hl>
    </Caption>
  </Canvas>
);

export const LajotaCompositions = () => (
  <>
    <Composition
      id="LucroCaseiroReelLajota"
      component={LajotaReel}
      durationInFrames={LAJOTA_DURATION}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ comente: false }}
    />
    <Composition
      id="LucroCaseiroReelLajotaComente"
      component={LajotaReel}
      durationInFrames={LAJOTA_COMENTE_DURATION}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ comente: true }}
    />
    <Still
      id="LucroCaseiroReelLajotaCapa"
      component={LajotaCapa}
      width={1080}
      height={1920}
    />
  </>
);
