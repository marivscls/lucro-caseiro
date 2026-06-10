import { useTheme } from "@lucro-caseiro/ui";
import React from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

/**
 * Ilustracoes SVG autorais na paleta da marca — com gradientes, profundidade,
 * sombra e brilhos, no mesmo nivel visual da pagina publica do catalogo.
 * Cada arte usa ids de gradiente proprios (prefixados) para nao colidir.
 */

export type IllustrationName =
  | "basket"
  | "cupcake"
  | "coins"
  | "calendar"
  | "tag"
  | "chart"
  | "clients"
  | "box"
  | "jars"
  | "clipboard";

interface IllustrationProps {
  readonly name: IllustrationName;
  readonly size?: number;
}

/** Fundo organico + faiscas decorativas compartilhadas por todas as artes.
 * No tema escuro o blob fica num marrom profundo translucido, para a arte
 * assentar no fundo em vez de parecer um adesivo claro. */
function Backdrop({ id, dark }: Readonly<{ id: string; dark: boolean }>) {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={dark ? "#4a3a31" : "#f7ece4"} />
          <Stop offset="1" stopColor={dark ? "#3a2d26" : "#f0ddd1"} />
        </LinearGradient>
      </Defs>
      <Path
        d="M60 8 C92 6 112 28 110 60 C108 94 88 112 58 110 C26 108 8 90 10 58 C12 28 30 10 60 8 Z"
        fill={`url(#${id}-bg)`}
      />
      {/* faiscas */}
      <Path
        d="M22 30 L24.5 36 L31 38 L24.5 40 L22 46 L19.5 40 L13 38 L19.5 36 Z"
        fill="#E8B4BC"
        opacity={0.9}
      />
      <Path
        d="M100 78 L101.8 82.5 L106 84 L101.8 85.5 L100 90 L98.2 85.5 L94 84 L98.2 82.5 Z"
        fill="#D4A054"
        opacity={0.85}
      />
      <Circle cx="98" cy="28" r="3" fill="#E8B4BC" opacity={0.7} />
      <Circle cx="16" cy="78" r="2.5" fill="#D4A054" opacity={0.6} />
    </G>
  );
}

/** Sombra suave sob o objeto principal. */
function GroundShadow({ y = 102, rx = 34 }: Readonly<{ y?: number; rx?: number }>) {
  return <Ellipse cx="60" cy={y} rx={rx} ry="6" fill="#1f1813" opacity={0.22} />;
}

function Basket() {
  return (
    <G>
      <Defs>
        <LinearGradient id="bk-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a06a50" />
          <Stop offset="1" stopColor="#7a4c39" />
        </LinearGradient>
        <LinearGradient id="bk-rim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#86573f" />
          <Stop offset="1" stopColor="#6e4534" />
        </LinearGradient>
        <LinearGradient id="bk-p1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E8B4BC" />
          <Stop offset="1" stopColor="#C4707E" />
        </LinearGradient>
        <LinearGradient id="bk-p2" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#9fdcbd" />
          <Stop offset="1" stopColor="#5da883" />
        </LinearGradient>
        <LinearGradient id="bk-p3" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ecc78a" />
          <Stop offset="1" stopColor="#c08c3f" />
        </LinearGradient>
      </Defs>
      <GroundShadow />
      {/* alca */}
      <Path
        d="M36 56 Q60 22 84 56"
        stroke="#6e4534"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M38 55 Q60 25 82 55"
        stroke="#9c6b50"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity={0.8}
      />
      {/* macarons/produtos */}
      <Circle cx="44" cy="50" r="14" fill="url(#bk-p1)" />
      <Ellipse cx="40" cy="45" rx="5" ry="3" fill="#ffffff" opacity={0.5} />
      <Circle cx="66" cy="45" r="12.5" fill="url(#bk-p2)" />
      <Ellipse cx="62.5" cy="40.5" rx="4.5" ry="2.6" fill="#ffffff" opacity={0.5} />
      <Circle cx="82" cy="54" r="10" fill="url(#bk-p3)" />
      <Ellipse cx="79" cy="50.5" rx="3.6" ry="2.2" fill="#ffffff" opacity={0.55} />
      {/* corpo da cesta */}
      <Path
        d="M24 58 L96 58 L89 95 Q87.8 101.5 81.5 101.5 L38.5 101.5 Q32.2 101.5 31 95 Z"
        fill="url(#bk-body)"
      />
      {/* trama: faixas */}
      <Path d="M27.5 76 L92.5 76 L91 83 L29 83 Z" fill="#6e4534" opacity={0.35} />
      <Line
        x1="42"
        y1="60"
        x2="45"
        y2="100"
        stroke="#5e3a2b"
        strokeWidth="3.5"
        opacity={0.45}
      />
      <Line
        x1="60"
        y1="60"
        x2="60"
        y2="101"
        stroke="#5e3a2b"
        strokeWidth="3.5"
        opacity={0.45}
      />
      <Line
        x1="78"
        y1="60"
        x2="75"
        y2="100"
        stroke="#5e3a2b"
        strokeWidth="3.5"
        opacity={0.45}
      />
      {/* borda superior */}
      <Rect x="22" y="55" width="76" height="10" rx="5" fill="url(#bk-rim)" />
      <Rect x="26" y="57" width="68" height="3" rx="1.5" fill="#a06a50" opacity={0.7} />
      {/* brilho lateral */}
      <Path
        d="M33 66 Q34 88 38 98"
        stroke="#c89a7e"
        strokeWidth="3"
        opacity={0.35}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

function Cupcake() {
  return (
    <G>
      <Defs>
        <LinearGradient id="cp-frost" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f6cdd4" />
          <Stop offset="1" stopColor="#d88d99" />
        </LinearGradient>
        <LinearGradient id="cp-frost2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d98c99" />
          <Stop offset="1" stopColor="#b95f6f" />
        </LinearGradient>
        <LinearGradient id="cp-liner" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a06a50" />
          <Stop offset="1" stopColor="#74452f" />
        </LinearGradient>
        <LinearGradient id="cp-cherry" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#e0626f" />
          <Stop offset="1" stopColor="#b03c4c" />
        </LinearGradient>
      </Defs>
      <GroundShadow rx={28} />
      {/* cobertura: tres camadas de chantilly */}
      <Path
        d="M34 62 Q31 46 44 44 Q44 30 60 31 Q76 30 76 44 Q89 46 86 62 Z"
        fill="url(#cp-frost)"
      />
      <Path
        d="M40 62 Q40 52 50 53 Q51 44 61 46 Q72 44 71 54 Q80 53 80 62 Z"
        fill="url(#cp-frost2)"
        opacity={0.85}
      />
      <Ellipse cx="48" cy="42" rx="6" ry="3.4" fill="#ffffff" opacity={0.55} />
      {/* cereja com talo e brilho */}
      <Path
        d="M60 24 Q63 14 71 15"
        stroke="#5da883"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="60" cy="27" r="7.5" fill="url(#cp-cherry)" />
      <Ellipse cx="57.5" cy="24.5" rx="2.6" ry="1.8" fill="#ffffff" opacity={0.6} />
      {/* granulados */}
      <Rect
        x="46"
        y="52"
        width="6"
        height="2.4"
        rx="1.2"
        fill="#fff"
        transform="rotate(24 49 53)"
        opacity={0.9}
      />
      <Rect
        x="62"
        y="48"
        width="6"
        height="2.4"
        rx="1.2"
        fill="#FFF3D6"
        transform="rotate(-18 65 49)"
        opacity={0.95}
      />
      <Rect
        x="72"
        y="55"
        width="6"
        height="2.4"
        rx="1.2"
        fill="#fff"
        transform="rotate(10 75 56)"
        opacity={0.9}
      />
      {/* forminha */}
      <Path
        d="M36 62 L84 62 L77 98 Q76 102.5 71 102.5 L49 102.5 Q44 102.5 43 98 Z"
        fill="url(#cp-liner)"
      />
      <Path d="M36 62 L84 62 L82.6 69 L37.4 69 Z" fill="#5e3a2b" opacity={0.5} />
      <Line
        x1="48"
        y1="63"
        x2="52"
        y2="101"
        stroke="#5e3a2b"
        strokeWidth="3"
        opacity={0.5}
      />
      <Line
        x1="60"
        y1="63"
        x2="60"
        y2="102"
        stroke="#5e3a2b"
        strokeWidth="3"
        opacity={0.5}
      />
      <Line
        x1="72"
        y1="63"
        x2="68"
        y2="101"
        stroke="#5e3a2b"
        strokeWidth="3"
        opacity={0.5}
      />
      <Path
        d="M45 66 Q46 86 48 98"
        stroke="#c89a7e"
        strokeWidth="2.5"
        opacity={0.4}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

function Coins() {
  return (
    <G>
      <Defs>
        <LinearGradient id="cn-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#dc8e9b" />
          <Stop offset="1" stopColor="#b05a6a" />
        </LinearGradient>
        <LinearGradient id="cn-coin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ecc78a" />
          <Stop offset="1" stopColor="#c08c3f" />
        </LinearGradient>
      </Defs>
      <GroundShadow />
      {/* moedas caindo */}
      <Circle cx="60" cy="24" r="10" fill="url(#cn-coin)" />
      <Circle cx="60" cy="24" r="6" fill="none" stroke="#8f6620" strokeWidth="1.8" />
      <Path
        d="M58 21 Q62 21 62 24 Q62 27 58 27"
        stroke="#8f6620"
        strokeWidth="1.6"
        fill="none"
      />
      <Circle cx="36" cy="18" r="6" fill="url(#cn-coin)" opacity={0.95} />
      <Circle cx="84" cy="14" r="5" fill="url(#cn-coin)" opacity={0.9} />
      <Circle cx="88" cy="34" r="3" fill="#ecc78a" opacity={0.8} />
      {/* corpo do cofrinho */}
      <Ellipse cx="60" cy="72" rx="35" ry="27" fill="url(#cn-body)" />
      <Ellipse cx="48" cy="60" rx="12" ry="7" fill="#ffffff" opacity={0.28} />
      {/* orelha */}
      <Path d="M40 50 Q36 40 48 44 Q44 48 44 52 Z" fill="#c97987" />
      {/* focinho */}
      <Ellipse cx="92" cy="68" rx="9" ry="8" fill="#c97987" />
      <Circle cx="90" cy="66" r="1.6" fill="#7a3c48" />
      <Circle cx="94.5" cy="66" r="1.6" fill="#7a3c48" />
      {/* olho fechado feliz */}
      <Path
        d="M74 60 Q78 56 82 60"
        stroke="#7a3c48"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* bochecha */}
      <Ellipse cx="76" cy="70" rx="5" ry="3.4" fill="#E8B4BC" opacity={0.85} />
      {/* fenda */}
      <Rect x="48" y="49" width="24" height="4.6" rx="2.3" fill="#7a3c48" />
      {/* pernas */}
      <Rect x="38" y="93" width="10" height="11" rx="4" fill="#b05a6a" />
      <Rect x="70" y="93" width="10" height="11" rx="4" fill="#b05a6a" />
      {/* rabinho */}
      <Path
        d="M25 70 Q18 68 21 62 Q26 58 27 64"
        stroke="#c97987"
        strokeWidth="3.4"
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

function CalendarHeart() {
  return (
    <G>
      <Defs>
        <LinearGradient id="cl-top" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a06a50" />
          <Stop offset="1" stopColor="#7a4c39" />
        </LinearGradient>
        <LinearGradient id="cl-heart" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E8B4BC" />
          <Stop offset="1" stopColor="#C4707E" />
        </LinearGradient>
      </Defs>
      <GroundShadow y={104} rx={38} />
      {/* folha de tras */}
      <Rect
        x="29"
        y="35"
        width="72"
        height="66"
        rx="11"
        fill="#dcc7b8"
        opacity={0.7}
        transform="rotate(3 65 68)"
      />
      {/* folha principal */}
      <Rect x="23" y="32" width="74" height="68" rx="11" fill="#fffaf5" />
      <Rect x="23" y="32" width="74" height="22" rx="11" fill="url(#cl-top)" />
      <Rect x="23" y="44" width="74" height="10" fill="url(#cl-top)" />
      {/* argolas */}
      <Rect x="37" y="24" width="7" height="16" rx="3.5" fill="#5e3a2b" />
      <Rect x="76" y="24" width="7" height="16" rx="3.5" fill="#5e3a2b" />
      <Rect x="38.5" y="25.5" width="2" height="13" rx="1" fill="#9c6b50" />
      <Rect x="77.5" y="25.5" width="2" height="13" rx="1" fill="#9c6b50" />
      {/* pontinhos de dias */}
      <Circle cx="38" cy="63" r="3" fill="#e9d5c8" />
      <Circle cx="51" cy="63" r="3" fill="#e9d5c8" />
      <Circle cx="69" cy="63" r="3" fill="#e9d5c8" />
      <Circle cx="82" cy="63" r="3" fill="#e9d5c8" />
      <Circle cx="38" cy="74" r="3" fill="#e9d5c8" />
      <Circle cx="82" cy="74" r="3" fill="#e9d5c8" />
      {/* coracao com brilho */}
      <Path
        d="M60 92 C46 81 42 71 49 65 Q56 61 60 69 Q64 61 71 65 C78 71 74 81 60 92 Z"
        fill="url(#cl-heart)"
      />
      <Ellipse cx="53" cy="69" rx="3.4" ry="2.2" fill="#ffffff" opacity={0.55} />
    </G>
  );
}

function Tag() {
  return (
    <G>
      <Defs>
        <LinearGradient id="tg-body" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d98c99" />
          <Stop offset="1" stopColor="#ad5564" />
        </LinearGradient>
      </Defs>
      <GroundShadow y={100} rx={36} />
      {/* etiqueta de tras */}
      <Path
        d="M34 40 Q34 31 43 31 L62 31 Q66 31 69 34 L92 57 Q97 62 92 67 L67 93 Q62 98 57 93 L35 70 Q32 67 32 63 Z"
        fill="#dcc7b8"
        opacity={0.75}
        transform="rotate(4 60 62)"
      />
      {/* etiqueta principal */}
      <G transform="rotate(-7 60 60)">
        <Path
          d="M32 38 Q32 28 42 28 L63 28 Q67 28 70 31 L95 56 Q101 62 95 68 L68 96 Q62 102 56 96 L33 72 Q30 69 30 65 Z"
          fill="url(#tg-body)"
        />
        {/* costura interna */}
        <Path
          d="M37 39 Q37 33 43 33 L62 33 Q65 33 67 35 L90 58 Q94 62 90 66 L65 92 Q61 96 57 92 L36 70 Q34 68 34 65 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeDasharray="4 4"
          opacity={0.55}
        />
        {/* furo com ilhos */}
        <Circle cx="45" cy="42" r="7" fill="#8f4250" />
        <Circle cx="45" cy="42" r="4.4" fill="#fffaf5" />
        {/* texto fake */}
        <Line
          x1="52"
          y1="62"
          x2="78"
          y2="62"
          stroke="#ffffff"
          strokeWidth="4.4"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Line
          x1="56"
          y1="73"
          x2="80"
          y2="73"
          stroke="#f0c2ca"
          strokeWidth="4.4"
          strokeLinecap="round"
          opacity={0.8}
        />
        {/* brilho */}
        <Ellipse cx="55" cy="40" rx="7" ry="3.4" fill="#ffffff" opacity={0.35} />
      </G>
      {/* cordinha */}
      <Path
        d="M42 35 Q28 20 16 28 Q12 32 18 36"
        stroke="#8c5a45"
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

function Chart() {
  return (
    <G>
      <Defs>
        <LinearGradient id="ch-1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e6d2c3" />
          <Stop offset="1" stopColor="#cdb3a1" />
        </LinearGradient>
        <LinearGradient id="ch-2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f0c2ca" />
          <Stop offset="1" stopColor="#d98c99" />
        </LinearGradient>
        <LinearGradient id="ch-3" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d98c99" />
          <Stop offset="1" stopColor="#ad5564" />
        </LinearGradient>
        <LinearGradient id="ch-4" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9fdcbd" />
          <Stop offset="1" stopColor="#5da883" />
        </LinearGradient>
      </Defs>
      <GroundShadow y={103} rx={40} />
      {/* barras com topo brilhante */}
      <Rect x="24" y="66" width="15" height="36" rx="5" fill="url(#ch-1)" />
      <Rect x="45" y="54" width="15" height="48" rx="5" fill="url(#ch-2)" />
      <Rect x="66" y="42" width="15" height="60" rx="5" fill="url(#ch-3)" />
      <Rect x="87" y="28" width="15" height="74" rx="5" fill="url(#ch-4)" />
      <Ellipse cx="31.5" cy="69" rx="4.6" ry="1.8" fill="#fff" opacity={0.4} />
      <Ellipse cx="52.5" cy="57" rx="4.6" ry="1.8" fill="#fff" opacity={0.45} />
      <Ellipse cx="73.5" cy="45" rx="4.6" ry="1.8" fill="#fff" opacity={0.45} />
      <Ellipse cx="94.5" cy="31" rx="4.6" ry="1.8" fill="#fff" opacity={0.5} />
      {/* linha de tendencia com pontos */}
      <Path
        d="M28 56 Q52 48 70 34 Q80 26 92 18"
        stroke="#8c5a45"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M92 18 L81 19 M92 18 L90 29"
        stroke="#8c5a45"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Circle cx="28" cy="56" r="3.6" fill="#fffaf5" stroke="#8c5a45" strokeWidth="2.4" />
      <Circle cx="62" cy="40" r="3.6" fill="#fffaf5" stroke="#8c5a45" strokeWidth="2.4" />
    </G>
  );
}

function Clients() {
  return (
    <G>
      <Defs>
        <LinearGradient id="us-1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#dc8e9b" />
          <Stop offset="1" stopColor="#b05a6a" />
        </LinearGradient>
        <LinearGradient id="us-2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#c89a7e" />
          <Stop offset="1" stopColor="#9c6b50" />
        </LinearGradient>
      </Defs>
      <GroundShadow y={103} rx={42} />
      {/* pessoa de tras */}
      <Circle cx="79" cy="44" r="13" fill="url(#us-2)" />
      <Ellipse cx="75" cy="39" rx="4.4" ry="2.6" fill="#fff" opacity={0.3} />
      <Path d="M57 102 Q57 71 79 71 Q101 71 101 102 Z" fill="url(#us-2)" />
      {/* pessoa da frente */}
      <Circle cx="45" cy="50" r="16" fill="url(#us-1)" />
      <Ellipse cx="40" cy="44" rx="5.4" ry="3" fill="#fff" opacity={0.35} />
      <Path d="M17 103 Q17 73 45 73 Q73 73 73 103 Z" fill="url(#us-1)" />
      {/* golinha */}
      <Path
        d="M37 76 Q45 84 53 76"
        stroke="#fffaf5"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* coracao flutuante */}
      <Path
        d="M92 22 C87 17 81 20 81 25 Q81 31 92 38 Q103 31 103 25 C103 20 97 17 92 22 Z"
        fill="#C4707E"
      />
      <Ellipse cx="87" cy="23.5" rx="2.6" ry="1.7" fill="#fff" opacity={0.55} />
    </G>
  );
}

function GiftBox() {
  return (
    <G>
      <Defs>
        <LinearGradient id="bx-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#c89a7e" />
          <Stop offset="1" stopColor="#9c6b50" />
        </LinearGradient>
        <LinearGradient id="bx-lid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a06a50" />
          <Stop offset="1" stopColor="#7a4c39" />
        </LinearGradient>
        <LinearGradient id="bx-ribbon" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E8B4BC" />
          <Stop offset="1" stopColor="#C4707E" />
        </LinearGradient>
      </Defs>
      <GroundShadow rx={36} />
      {/* corpo da caixa */}
      <Rect x="30" y="52" width="60" height="48" rx="6" fill="url(#bx-body)" />
      {/* fita vertical */}
      <Rect x="53" y="52" width="14" height="48" fill="url(#bx-ribbon)" />
      {/* tampa */}
      <Rect x="24" y="40" width="72" height="18" rx="6" fill="url(#bx-lid)" />
      <Rect x="53" y="40" width="14" height="18" fill="#C4707E" />
      <Rect x="27" y="42.5" width="66" height="3" rx="1.5" fill="#b3886c" opacity={0.7} />
      {/* laco */}
      <Path d="M60 38 Q46 24 40 32 Q36 40 54 40 Z" fill="url(#bx-ribbon)" />
      <Path d="M60 38 Q74 24 80 32 Q84 40 66 40 Z" fill="url(#bx-ribbon)" />
      <Circle cx="60" cy="38" r="5.4" fill="#ad5564" />
      <Ellipse cx="58.4" cy="36.4" rx="1.8" ry="1.2" fill="#fff" opacity={0.55} />
      {/* brilhos */}
      <Path
        d="M36 60 Q36 80 38 96"
        stroke="#e0c3ad"
        strokeWidth="3"
        opacity={0.4}
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="42" cy="46" rx="6" ry="2.4" fill="#fff" opacity={0.25} />
    </G>
  );
}

function Jars() {
  return (
    <G>
      <Defs>
        <LinearGradient id="jr-sack" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f2e3d5" />
          <Stop offset="1" stopColor="#d9bfa8" />
        </LinearGradient>
        <LinearGradient id="jr-glass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fdf6ef" />
          <Stop offset="1" stopColor="#ecd9c8" />
        </LinearGradient>
        <LinearGradient id="jr-fill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#dc8e9b" />
          <Stop offset="1" stopColor="#b05a6a" />
        </LinearGradient>
        <LinearGradient id="jr-lid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a06a50" />
          <Stop offset="1" stopColor="#7a4c39" />
        </LinearGradient>
      </Defs>
      <GroundShadow rx={40} />
      {/* saco de farinha */}
      <Path
        d="M30 50 Q26 46 32 43 L36 41 Q34 34 41 34 L51 34 Q58 34 56 41 L60 43 Q66 46 62 50 Q66 70 63 92 Q62.5 100 54 100 L38 100 Q29.5 100 29 92 Q26 70 30 50 Z"
        fill="url(#jr-sack)"
      />
      {/* amarracao do saco */}
      <Path
        d="M34 42 Q46 47 58 42"
        stroke="#b3886c"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* rotulo do saco */}
      <Rect x="34" y="60" width="24" height="18" rx="4" fill="#fffaf5" />
      <Line
        x1="38"
        y1="66"
        x2="54"
        y2="66"
        stroke="#C4707E"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <Line
        x1="38"
        y1="72"
        x2="50"
        y2="72"
        stroke="#e0c3ad"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* pozinho saindo */}
      <Circle cx="40" cy="30" r="2.4" fill="#f2e3d5" opacity={0.9} />
      <Circle cx="48" cy="26" r="1.8" fill="#f2e3d5" opacity={0.7} />
      {/* pote de vidro com tampa */}
      <Rect x="64" y="52" width="32" height="48" rx="9" fill="url(#jr-glass)" />
      <Rect x="64" y="74" width="32" height="26" rx="9" fill="url(#jr-fill)" />
      <Rect x="64" y="74" width="32" height="8" fill="#c97987" opacity={0.6} />
      <Rect x="62" y="44" width="36" height="11" rx="5" fill="url(#jr-lid)" />
      <Rect x="65" y="46" width="30" height="2.6" rx="1.3" fill="#a06a50" opacity={0.8} />
      {/* reflexo do vidro */}
      <Path
        d="M70 58 Q69 78 70 94"
        stroke="#ffffff"
        strokeWidth="3.4"
        opacity={0.5}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

function Clipboard() {
  return (
    <G>
      <Defs>
        <LinearGradient id="cb-board" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a06a50" />
          <Stop offset="1" stopColor="#7a4c39" />
        </LinearGradient>
        <LinearGradient id="cb-coin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ecc78a" />
          <Stop offset="1" stopColor="#c08c3f" />
        </LinearGradient>
      </Defs>
      <GroundShadow rx={34} />
      {/* prancheta */}
      <Rect x="30" y="26" width="60" height="76" rx="9" fill="url(#cb-board)" />
      <Rect x="36" y="34" width="48" height="62" rx="6" fill="#fffaf5" />
      {/* clipe */}
      <Rect x="50" y="20" width="20" height="12" rx="5" fill="#5e3a2b" />
      <Rect x="56" y="16" width="8" height="8" rx="4" fill="#9c6b50" />
      {/* linhas com checks */}
      <Circle cx="43" cy="46" r="3.4" fill="#9fdcbd" />
      <Path
        d="M41.4 46 L42.8 47.6 L45 44.8"
        stroke="#2e7d32"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <Line
        x1="50"
        y1="46"
        x2="78"
        y2="46"
        stroke="#e0c3ad"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <Circle cx="43" cy="58" r="3.4" fill="#9fdcbd" />
      <Path
        d="M41.4 58 L42.8 59.6 L45 56.8"
        stroke="#2e7d32"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <Line
        x1="50"
        y1="58"
        x2="74"
        y2="58"
        stroke="#e0c3ad"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <Circle cx="43" cy="70" r="3.4" fill="#f0c2ca" />
      <Line
        x1="50"
        y1="70"
        x2="76"
        y2="70"
        stroke="#e0c3ad"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* total destacado */}
      <Rect x="40" y="80" width="40" height="10" rx="5" fill="#f7efe9" />
      <Line
        x1="45"
        y1="85"
        x2="60"
        y2="85"
        stroke="#C4707E"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* moeda */}
      <Circle cx="86" cy="86" r="12" fill="url(#cb-coin)" />
      <Circle cx="86" cy="86" r="7.4" fill="none" stroke="#8f6620" strokeWidth="1.8" />
      <Path
        d="M83.5 82.5 Q88.5 82.5 88.5 86 Q88.5 89.5 83.5 89.5"
        stroke="#8f6620"
        strokeWidth="1.8"
        fill="none"
      />
      <Ellipse cx="82" cy="81" rx="3" ry="1.8" fill="#fff" opacity={0.5} />
    </G>
  );
}

const ART: Record<
  IllustrationName,
  { Component: () => React.ReactElement; bgId: string }
> = {
  basket: { Component: Basket, bgId: "il-basket" },
  cupcake: { Component: Cupcake, bgId: "il-cupcake" },
  coins: { Component: Coins, bgId: "il-coins" },
  calendar: { Component: CalendarHeart, bgId: "il-calendar" },
  tag: { Component: Tag, bgId: "il-tag" },
  chart: { Component: Chart, bgId: "il-chart" },
  clients: { Component: Clients, bgId: "il-clients" },
  box: { Component: GiftBox, bgId: "il-box" },
  jars: { Component: Jars, bgId: "il-jars" },
  clipboard: { Component: Clipboard, bgId: "il-clipboard" },
};

export function Illustration({ name, size = 128 }: IllustrationProps) {
  const { theme } = useTheme();
  const { Component, bgId } = ART[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Backdrop id={bgId} dark={theme.mode === "dark"} />
      <Component />
    </Svg>
  );
}
