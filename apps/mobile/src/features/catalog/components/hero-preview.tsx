import type { CatalogPatternKey } from "@lucro-caseiro/contracts";
import { Typography, radii } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop } from "react-native-svg";

const HEIGHT = 130;

/** Mesma derivacao de paleta do backend (paletteFromHex). */
function mix(channel: number, target: number, ratio: number): number {
  return Math.round(channel + (target - channel) * ratio);
}

function shade(hex: string, target: number, ratio: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${[r, g, b]
    .map((c) => mix(c, target, ratio).toString(16).padStart(2, "0"))
    .join("")}`;
}

function PatternOverlay({
  pattern,
  width,
}: Readonly<{ pattern: CatalogPatternKey; width: number }>) {
  const stroke = "rgba(255,255,255,0.18)";
  const fill = "rgba(255,255,255,0.2)";
  const elements: React.ReactElement[] = [];

  if (pattern === "dots") {
    for (let x = 8; x < width; x += 16) {
      for (let y = 8; y < HEIGHT; y += 16) {
        elements.push(<Circle key={`d${x}-${y}`} cx={x} cy={y} r={1.5} fill={fill} />);
      }
    }
  } else if (pattern === "bubbles") {
    for (let x = 24; x < width + 28; x += 56) {
      for (let y = 24; y < HEIGHT + 28; y += 56) {
        elements.push(
          <Circle key={`b${x}-${y}`} cx={x} cy={y} r={9} fill="rgba(255,255,255,0.14)" />,
        );
      }
    }
  } else if (pattern === "grid") {
    for (let x = 0; x <= width; x += 26) {
      elements.push(
        <Line key={`gv${x}`} x1={x} y1={0} x2={x} y2={HEIGHT} stroke={stroke} />,
      );
    }
    for (let y = 0; y <= HEIGHT; y += 26) {
      elements.push(
        <Line key={`gh${y}`} x1={0} y1={y} x2={width} y2={y} stroke={stroke} />,
      );
    }
  } else {
    // stripes (45 graus)
    for (let x = -HEIGHT; x < width + HEIGHT; x += 24) {
      elements.push(
        <Line
          key={`s${x}`}
          x1={x}
          y1={HEIGHT}
          x2={x + HEIGHT}
          y2={0}
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={10}
        />,
      );
    }
  }

  return <>{elements}</>;
}

interface HeroPreviewProps {
  readonly baseColor: string; // hex #rrggbb
  readonly pattern: CatalogPatternKey | null;
  readonly businessName: string;
  readonly tagline?: string | null;
}

/** Miniatura do topo da pagina publica: gradiente da cor + estampa escolhida. */
export function HeroPreview({
  baseColor,
  pattern,
  businessName,
  tagline,
}: HeroPreviewProps) {
  const [width, setWidth] = React.useState(0);
  const dark = shade(baseColor, 0, 0.25);
  const light = shade(baseColor, 255, 0.2);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ borderRadius: radii.xl, overflow: "hidden" }}
    >
      <Svg width="100%" height={HEIGHT}>
        <Defs>
          <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={dark} />
            <Stop offset="0.55" stopColor={baseColor} />
            <Stop offset="1" stopColor={light} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#hero)" />
        {pattern && width > 0 && <PatternOverlay pattern={pattern} width={width} />}
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
      >
        <Typography variant="h3" serif color="#ffffff" numberOfLines={1}>
          {businessName}
        </Typography>
        <Typography
          variant="caption"
          color="rgba(255,255,255,0.85)"
          numberOfLines={1}
          style={{ marginTop: 4 }}
        >
          {tagline?.trim() || "Catálogo de produtos"}
        </Typography>
      </View>
    </View>
  );
}
