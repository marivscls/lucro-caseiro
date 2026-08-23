import type { Label } from "@lucro-caseiro/contracts";
import { Typography, fonts, radii } from "@lucro-caseiro/ui";
import React from "react";
import { Image, View } from "react-native";

import { displayLabelName, labelThumbnailShape } from "../domain";
import { resolveLabelStyle } from "./label-preview";

const SLOT = 72;
const INNER = 64;

function thumbnailMetrics(shape: ReturnType<typeof labelThumbnailShape>): {
  width: number;
  height: number;
  borderRadius: number;
} {
  if (shape === "circle") {
    return { width: INNER, height: INNER, borderRadius: radii.full };
  }
  if (shape === "oval") {
    return { width: 56, height: INNER, borderRadius: radii.full };
  }
  if (shape === "scalloped") {
    return { width: INNER, height: INNER, borderRadius: 22 };
  }
  return { width: INNER, height: 58, borderRadius: radii.md };
}

export function LabelThumbnail({
  label,
}: Readonly<{
  label: Label;
}>) {
  const style = resolveLabelStyle(label.templateId, label.data.style);
  const { width, height, borderRadius } = thumbnailMetrics(
    labelThumbnailShape(label.templateId),
  );
  const title = displayLabelName(label.data.productName || label.name);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{
        width: SLOT,
        height: SLOT,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width,
          height,
          borderRadius,
          overflow: "hidden",
          backgroundColor: style.bg,
          borderWidth: 1.5,
          borderColor: style.border,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 6,
          gap: 4,
        }}
      >
        {label.logoUrl ? (
          <Image
            source={{ uri: label.logoUrl }}
            resizeMode="contain"
            style={{ width: 22, height: 22, borderRadius: 4 }}
          />
        ) : null}
        <Typography
          color={style.accent}
          numberOfLines={2}
          style={{
            fontFamily: fonts.bold,
            fontSize: 9,
            lineHeight: 11,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          {title}
        </Typography>
      </View>
    </View>
  );
}
