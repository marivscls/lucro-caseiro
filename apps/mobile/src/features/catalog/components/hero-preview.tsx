import { Typography, radii } from "@lucro-caseiro/ui";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

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

interface HeroPreviewProps {
  readonly baseColor: string; // hex #rrggbb
  readonly businessName: string;
  readonly tagline?: string | null;
}

/** Miniatura do topo da pagina publica com o gradiente da cor escolhida. */
export function HeroPreview({ baseColor, businessName, tagline }: HeroPreviewProps) {
  const dark = shade(baseColor, 0, 0.25);
  const light = shade(baseColor, 255, 0.2);

  return (
    <View style={{ borderRadius: radii.xl, overflow: "hidden" }}>
      <Svg width="100%" height={HEIGHT}>
        <Defs>
          <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={dark} />
            <Stop offset="0.55" stopColor={baseColor} />
            <Stop offset="1" stopColor={light} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#hero)" />
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
