import type {ReactNode} from "react";
import {Audio, Video} from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

import {MARKETING_COLORS as C, MARKETING_FONTS as F} from "../marketing-brand";
import {
  AppScreen,
  Caption,
  DIR,
  Embalagem,
  Final,
  Materiais,
  Pintura,
  Plate,
  StepChip,
  Tag,
  Tempo,
  clamp,
  r,
} from "./PrecoPecaReel";

/**
 * Versão longa (40 s) do Reel "Quanto você cobraria por isso?", feita para
 * filmagens reais de produção. Cada cena do processo usa o clipe de CLIPS
 * quando existe e cai na ilustração original quando ainda não há filmagem.
 */

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

const HOOK = {from: 0, to: s(3)};
const MATERIAIS = {from: s(3), to: s(7)};
const PINTURA = {from: s(7), to: s(13)};
const EMBALAGEM = {from: s(13), to: s(17)};
const TEMPO = {from: s(17), to: s(21)};
const APP = {from: s(21), to: s(34)};
const FINAL = {from: s(34), to: s(40)};
export const PRECO_PECA_LONGO_DURATION = FINAL.to;

/**
 * Clipes reais em public/reel-preco-peca/clipes/. `start` é o segundo do
 * clipe onde o corte começa. `null` = usa a ilustração.
 */
type Clip = {src: string; start?: number} | null;
const CLIPS: Record<"peca" | "materiais" | "pintura" | "embalagem" | "maos", Clip> = {
  peca: null,
  materiais: null,
  pintura: null,
  embalagem: null,
  maos: null,
};

/** Rótulo das cenas do processo (troca conforme a origem das imagens). */
const PROCESS_LABEL = "Exemplo ilustrativo";

const VOICE = [
  {src: "longo/voz-l1.wav", at: s(0.3)},
  {src: "longo/voz-l2.wav", at: s(3.2)},
  {src: "longo/voz-l3.wav", at: s(7.3)},
  {src: "longo/voz-l4.wav", at: s(13.2)},
  {src: "longo/voz-l5.wav", at: s(17.3)},
  {src: "longo/voz-l6.wav", at: s(21.3)},
  {src: "longo/voz-l7.wav", at: s(24.4)},
  {src: "longo/voz-l8.wav", at: s(30.6)},
  {src: "longo/voz-l9.wav", at: s(34.6)},
];

/** Filmagem em tela cheia com véu para as legendas. */
const Footage = ({clip, children}: {clip: NonNullable<Clip>; children: ReactNode}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 150], [1.06, 1], {...clamp, easing: Easing.out(Easing.quad)});
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <AbsoluteFill style={{scale}}>
        <Video
          src={staticFile(`${DIR}/clipes/${clip.src}`)}
          trimBefore={s(clip.start ?? 0)}
          muted
          style={{width: "100%", height: "100%", objectFit: "cover"}}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(36,24,30,0.72) 0%, rgba(36,24,30,0) 30%, rgba(36,24,30,0) 62%, rgba(36,24,30,0.6) 100%)",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

const ProcessScene = ({
  clip,
  fallback,
  title,
  n,
  chip,
  extra,
}: {
  clip: Clip;
  fallback: ReactNode;
  title: string;
  n: string;
  chip: string;
  extra?: ReactNode;
}) => {
  if (!clip) return <>{fallback}</>;
  return (
    <Footage clip={clip}>
      <Tag dark>{PROCESS_LABEL}</Tag>
      <Caption color={C.white}>{title}</Caption>
      {extra}
      <StepChip n={n} label={chip} />
    </Footage>
  );
};

const HookScene = () => {
  const frame = useCurrentFrame();
  const clip = CLIPS.peca;
  const question = (
    <Caption top={270} start={4} size={92} color={clip ? C.white : C.ink}>
      Quanto você
      <br />
      cobraria por isso?
    </Caption>
  );
  if (clip) {
    return (
      <Footage clip={clip}>
        <Tag dark>{PROCESS_LABEL}</Tag>
        {question}
      </Footage>
    );
  }
  return (
    <AbsoluteFill style={{backgroundColor: C.canvas}}>
      <Tag>{PROCESS_LABEL}</Tag>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", top: 180}}>
        <div
          style={{
            opacity: r(frame, 0, 18),
            scale: interpolate(frame, [0, HOOK.to], [0.92, 1.03], clamp),
            rotate: `${interpolate(frame, [0, HOOK.to], [-8, 0], clamp)}deg`,
          }}
        >
          <Plate paint={1} size={800} />
        </div>
      </AbsoluteFill>
      {question}
    </AbsoluteFill>
  );
};

/** Contador de horas sobre a filmagem das mãos trabalhando. */
const HoursBadge = () => {
  const frame = useCurrentFrame();
  const minutes = interpolate(frame, [6, 96], [0, 180], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const hh = Math.floor(minutes / 60);
  const mm = Math.floor(minutes % 60);
  return (
    <div
      style={{
        position: "absolute",
        top: 760,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          padding: "18px 44px",
          borderRadius: 40,
          backgroundColor: "rgba(36,24,30,0.78)",
          color: C.lime,
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: 150,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {hh}h{String(mm).padStart(2, "0")}
      </div>
    </div>
  );
};

const seq = (range: {from: number; to: number}, name: string, node: ReactNode) => (
  <Sequence from={range.from} durationInFrames={range.to - range.from} name={name}>
    {node}
  </Sequence>
);

export const PrecoPecaLongo = () => (
  <AbsoluteFill style={{backgroundColor: C.canvas}}>
    {seq(HOOK, "Peça pronta", <HookScene />)}
    {seq(
      MATERIAIS,
      "Materiais",
      <ProcessScene clip={CLIPS.materiais} fallback={<Materiais />} title="Materiais" n="1" chip="Prato, tintas e verniz" />,
    )}
    {seq(
      PINTURA,
      "Personalização",
      <ProcessScene clip={CLIPS.pintura} fallback={<Pintura />} title="Personalização" n="2" chip="Pintura com o nome" />,
    )}
    {seq(
      EMBALAGEM,
      "Embalagem",
      <ProcessScene clip={CLIPS.embalagem} fallback={<Embalagem />} title="Embalagem" n="3" chip="Caixa, papel e fita" />,
    )}
    {seq(
      TEMPO,
      "Tempo",
      <ProcessScene
        clip={CLIPS.maos}
        fallback={<Tempo />}
        title="O seu tempo"
        n="4"
        chip="3 horas de trabalho"
        extra={<HoursBadge />}
      />,
    )}
    {seq(APP, "Precificação no app", <AppScreen starts={[0, s(6), s(9)]} pace={1.5} />)}
    {seq(FINAL, "Ideia central", <Final />)}
    <Audio src={staticFile(`${DIR}/longo/trilha.wav`)} volume={0.35} />
    {VOICE.map((v) => (
      <Sequence key={v.src} from={v.at} layout="none">
        <Audio src={staticFile(`${DIR}/${v.src}`)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

export const PrecoPecaLongoComposition = () => (
  <Composition
    id="LucroCaseiroReelPrecoPecaLongo"
    component={PrecoPecaLongo}
    durationInFrames={PRECO_PECA_LONGO_DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
