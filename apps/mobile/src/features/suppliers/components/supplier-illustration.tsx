import React from "react";
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from "react-native-svg";

export type SupplierIllustrationName =
  | "supplies-mixing-bowl"
  | "supplies-flour-bag"
  | "supplies-wheat"
  | "supplies-chocolate"
  | "supplies-jar"
  | "supplies-box"
  | "packaging-cardboard-box"
  | "packaging-bag"
  | "packaging-tape"
  | "packaging-label"
  | "packaging-container"
  | "packaging-set"
  | "food-produce-crate"
  | "food-fruit"
  | "food-vegetables"
  | "food-bottle"
  | "food-dairy"
  | "food-basket"
  | "other-stationery"
  | "other-cleaning"
  | "other-tools"
  | "other-documents"
  | "other-equipment"
  | "other-box";

type IllustrationProps = Readonly<{
  name: SupplierIllustrationName;
  size?: number;
  color?: string;
}>;

function Drawing({ name }: Readonly<{ name: SupplierIllustrationName }>) {
  switch (name) {
    case "supplies-mixing-bowl":
      return (
        <>
          <Path d="M8 25h30c-1 9-6 14-15 14S9 34 8 25Z" />
          <Path d="M11 25c4 2 9 3 14 2" />
          <Path d="m29 8-12 17M34 11 22 26" />
          <Path d="M29 8c2 1 3 3 2 5M34 11c2 1 2 3 1 5" />
        </>
      );
    case "supplies-flour-bag":
      return (
        <>
          <Path d="m15 10 4 4h10l4-4M15 10h18l4 10-2 19H13l-2-19 4-10Z" />
          <Path d="M12 21c7 2 17 2 24 0" />
          <Ellipse cx="24" cy="29" rx="5" ry="6" />
          <Path d="M24 24c1-2 3-3 5-3" />
        </>
      );
    case "supplies-wheat":
      return (
        <>
          <Path d="M24 41V9" />
          <Path d="M24 16c-5 0-8-3-8-7 5 0 8 3 8 7ZM24 22c5 0 8-3 8-7-5 0-8 3-8 7Z" />
          <Path d="M24 28c-5 0-8-3-8-7 5 0 8 3 8 7ZM24 34c5 0 8-3 8-7-5 0-8 3-8 7Z" />
          <Path d="M24 39c-5 0-8-3-8-7" />
        </>
      );
    case "supplies-chocolate":
      return (
        <>
          <Rect x="13" y="8" width="22" height="26" rx="2" />
          <Line x1="24" y1="9" x2="24" y2="27" />
          <Line x1="14" y1="18" x2="34" y2="18" />
          <Rect x="17" y="12" width="4" height="3" rx="0.5" />
          <Rect x="27" y="12" width="4" height="3" rx="0.5" />
          <Path d="m10 31 6-4 7 4 7-4 8 4v9H10v-9Z" />
        </>
      );
    case "supplies-jar":
      return (
        <>
          <Rect x="15" y="13" width="18" height="27" rx="5" />
          <Rect x="14" y="8" width="20" height="7" rx="2" />
          <Line x1="17" y1="11.5" x2="31" y2="11.5" />
          <Path d="M18 25c4 2 8 2 12 0" />
        </>
      );
    case "supplies-box":
      return (
        <>
          <Polygon points="8,16 24,8 40,16 24,24" />
          <Path d="M8 16v19l16 8 16-8V16M24 24v19" />
          <Path d="m16 12 16 8v7l-4-2-4 3-4-3-4 2v-7" />
        </>
      );
    case "packaging-cardboard-box":
      return (
        <>
          <Rect x="10" y="19" width="28" height="21" rx="2" />
          <Path d="m10 19 7-9 7 9 7-9 7 9M24 19v21" />
          <Path d="M19 31h10M26 28l3 3-3 3" />
        </>
      );
    case "packaging-bag":
      return (
        <>
          <Path d="M12 16h24l-2 25H14l-2-25Z" />
          <Path d="M18 20v-7c0-4 2-6 6-6s6 2 6 6v7" />
          <Path d="M19 29c3 3 7 3 10 0" />
        </>
      );
    case "packaging-tape":
      return (
        <>
          <Circle cx="22" cy="22" r="12" />
          <Circle cx="22" cy="22" r="5" />
          <Path d="M31 30h9v10H24l7-10Z" />
          <Path d="m35 34 2 2-2 2" />
        </>
      );
    case "packaging-label":
      return (
        <>
          <Path d="M8 22 22 8h14l4 4v14L26 40 8 22Z" />
          <Circle cx="31" cy="16" r="2.5" />
          <Path d="m17 24 7 7M21 20l7 7" />
        </>
      );
    case "packaging-container":
      return (
        <>
          <Path d="M12 18h24l-2 22H14l-2-22Z" />
          <Rect x="10" y="12" width="28" height="7" rx="2" />
          <Path d="M18 8h12l3 4H15l3-4ZM19 28h10" />
        </>
      );
    case "packaging-set":
      return (
        <>
          <Rect x="7" y="24" width="16" height="16" rx="2" />
          <Rect x="25" y="18" width="16" height="22" rx="2" />
          <Path d="m7 24 8-5 8 5M15 19v21M25 18l8-5 8 5M33 13v27" />
          <Path d="M11 29h8M29 24h8" />
        </>
      );
    case "food-produce-crate":
      return (
        <>
          <Rect x="7" y="20" width="34" height="20" rx="2" />
          <Path d="M8 27h32M8 34h32M15 20v20M33 20v20" />
          <Circle cx="16" cy="16" r="5" />
          <Circle cx="27" cy="15" r="6" />
          <Path d="M27 9c1-3 3-4 6-4" />
        </>
      );
    case "food-fruit":
      return (
        <>
          <Path d="M24 15c9-6 17 1 14 11-2 8-8 15-14 15S12 34 10 26c-3-10 5-17 14-11Z" />
          <Path d="M24 15c0-4 2-7 5-9M25 10c4-3 8-2 10 1-3 3-7 4-10 1" />
          <Path d="M17 22c2-3 5-4 8-3" />
        </>
      );
    case "food-vegetables":
      return (
        <>
          <Path d="M22 15c8 7 8 17-2 27-10-10-10-20-2-27l2-2 2 2Z" />
          <Path d="M20 14c-1-5-4-7-8-8M20 14c2-5 6-7 10-7M20 14c0-5 2-8 5-11" />
          <Path d="M17 23h8M16 29h8M17 35h4" />
          <Path d="M31 19c6-2 10 2 8 8-2 5-8 8-13 5" />
        </>
      );
    case "food-bottle":
      return (
        <>
          <Rect x="19" y="6" width="10" height="8" rx="2" />
          <Path d="M18 14h12l4 7v17c0 2-1 3-3 3H17c-2 0-3-1-3-3V21l4-7Z" />
          <Path d="M15 25h18M18 31c4 2 8 2 12 0" />
        </>
      );
    case "food-dairy":
      return (
        <>
          <Path d="M13 15h22l-2 25H15l-2-25Z" />
          <Path d="m12 15 4-6h16l4 6H12ZM18 9l3 6M30 9l-3 6" />
          <Ellipse cx="24" cy="27" rx="5" ry="7" />
        </>
      );
    case "food-basket":
      return (
        <>
          <Path d="M8 21h32l-4 19H12L8 21Z" />
          <Path d="M15 22c0-9 3-14 9-14s9 5 9 14M12 28h24M16 22l2 18M32 22l-2 18" />
          <Circle cx="20" cy="18" r="4" />
          <Circle cx="28" cy="17" r="5" />
        </>
      );
    case "other-stationery":
      return (
        <>
          <Rect x="9" y="9" width="23" height="30" rx="2" />
          <Path d="M15 16h11M15 22h9M15 28h7" />
          <Path d="m31 37 9-22-5-2-9 22 2 5 3-3ZM35 13l2-4 5 2-2 4" />
        </>
      );
    case "other-cleaning":
      return (
        <>
          <Path d="M20 14h12v5l4 5v15H16V24l4-5v-5Z" />
          <Path d="M22 14V9h12l4 4h-6M17 27h18" />
          <Path d="M11 12h6M8 17h7M10 22h5" />
        </>
      );
    case "other-tools":
      return (
        <>
          <Path d="M29 8a9 9 0 0 0-8 12L9 32a5 5 0 0 0 7 7l12-12a9 9 0 0 0 11-11l-6 6-6-2-2-6 4-6Z" />
          <Path d="m10 10 10 10M8 8l5-2 4 4-2 5" />
        </>
      );
    case "other-documents":
      return (
        <>
          <Path d="M13 11h17l6 6v24H13V11Z" />
          <Path d="M30 11v7h6M18 24h13M18 30h13M18 36h9" />
          <Path d="M9 35H6V7h21v4" />
        </>
      );
    case "other-equipment":
      return (
        <>
          <Path d="M13 40h24M17 40v-9h14v9" />
          <Path d="M15 9h18l4 7-4 15H15l-4-15 4-7Z" />
          <Circle cx="24" cy="20" r="6" />
          <Path d="M20 9V5h8v4M16 25h16" />
        </>
      );
    case "other-box":
      return (
        <>
          <Path d="M8 18h32v21H8V18Z" />
          <Path d="m8 18 8-9 8 9 8-9 8 9M24 18v21" />
          <Polyline points="18,29 22,33 30,25" />
        </>
      );
  }
}

/** Família vetorial local dos avatares de fornecedores. */
export function SupplierIllustration({
  name,
  size = 34,
  color = "#6E2F3B",
}: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <G stroke={color} strokeWidth={2.15} strokeLinecap="round" strokeLinejoin="round">
        <Drawing name={name} />
      </G>
    </Svg>
  );
}
