import React from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

/** Blobs decorativos suaves no fundo das telas de auth, na paleta da marca. */
export function BackgroundDecor() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="lg-blob1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#C4707E" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#C4707E" stopOpacity="0.04" />
          </LinearGradient>
          <LinearGradient id="lg-blob2" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#D4A054" stopOpacity="0.16" />
            <Stop offset="1" stopColor="#D4A054" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Circle cx="12%" cy="6%" r="130" fill="url(#lg-blob1)" />
        <Circle cx="96%" cy="32%" r="90" fill="url(#lg-blob2)" />
        <Circle cx="6%" cy="88%" r="110" fill="url(#lg-blob2)" />
        <Circle cx="90%" cy="96%" r="70" fill="url(#lg-blob1)" />
      </Svg>
    </View>
  );
}

/** Marca do app: lojinha com toldo num círculo com gradiente + faísca dourada. */
export function BrandMark({ size = 92 }: Readonly<{ size?: number }>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 92 92">
      <Defs>
        <LinearGradient id="lg-brand" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d98c99" />
          <Stop offset="1" stopColor="#ad5564" />
        </LinearGradient>
      </Defs>
      <Circle cx="46" cy="46" r="42" fill="url(#lg-brand)" />
      <Circle
        cx="46"
        cy="46"
        r="42"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />
      <Path
        d="M28 36 L64 36 L66 44 Q63 48 59 44 Q56 48 52 44 Q49 48 46 44 Q43 48 40 44 Q37 48 33 44 Q29 48 26 44 Z"
        fill="#fffaf5"
      />
      <Path d="M28 36 L64 36 L64 32 Q64 29 61 29 L31 29 Q28 29 28 32 Z" fill="#f3e0d6" />
      <Path d="M31 47 L61 47 L61 62 Q61 65 58 65 L34 65 Q31 65 31 62 Z" fill="#fffaf5" />
      <Path
        d="M37 65 L37 53 Q37 50 40 50 L46 50 Q49 50 49 53 L49 65 Z"
        fill="#ad5564"
        opacity="0.85"
      />
      <Circle cx="55" cy="55" r="3.4" fill="#ecc78a" />
      <Path
        d="M74 16 L76 21 L81 23 L76 25 L74 30 L72 25 L67 23 L72 21 Z"
        fill="#ecc78a"
      />
    </Svg>
  );
}
