import type { LabelData } from "@lucro-caseiro/contracts";
import { Card, Typography, fonts, spacing } from "@lucro-caseiro/ui";
import React from "react";
import { Image, View, useWindowDimensions } from "react-native";
import { SvgXml } from "react-native-svg";

import { isoToBR } from "../dates";
import { buildQrSvg } from "../qr";

interface LabelPreviewProps {
  data: LabelData;
  templateId: string;
  logoUrl?: string | null;
  qrUrl?: string | null;
  scale?: number;
}

const LABEL_PREVIEW_WIDTH = 280;

export function fitLabelPreviewScale(
  requestedScale: number,
  viewportWidth: number,
): number {
  if (viewportWidth <= 0) return requestedScale;
  const availableWidth = Math.max(0, viewportWidth - spacing.xl * 2);
  return Math.min(requestedScale, availableWidth / LABEL_PREVIEW_WIDTH);
}

type TemplateStyle = {
  bg: string;
  accent: string;
  border: string;
  font: string;
};

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  classico: { bg: "#FFFBEB", accent: "#92400E", border: "#D97706", font: "serif" },
  moderno: { bg: "#FFFFFF", accent: "#1E40AF", border: "#3B82F6", font: "sans-serif" },
  minimalista: {
    bg: "#FFFFFF",
    accent: "#111827",
    border: "#E5E7EB",
    font: "sans-serif",
  },
  artesanal: { bg: "#FDF2F8", accent: "#9D174D", border: "#EC4899", font: "serif" },
  gourmet: { bg: "#F5F3FF", accent: "#5B21B6", border: "#8B5CF6", font: "serif" },
};

function resolveFont(custom: "serif" | "sans" | undefined, fallback: string): string {
  if (custom === "sans") return "sans-serif";
  if (custom === "serif") return "serif";
  return fallback;
}

function tint(hex: string, ratio = 0.93): string {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${channels
    .map((channel) =>
      Math.round(channel + (255 - channel) * ratio)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export interface ResolvedLabelStyle extends TemplateStyle {
  borderStyle: "solid" | "dashed" | "double" | "none";
  corner: "rounded" | "square";
}

export function resolveLabelStyle(
  templateId: string,
  custom?: LabelData["style"],
): ResolvedLabelStyle {
  const base = TEMPLATE_STYLES[templateId] ?? TEMPLATE_STYLES.classico;
  const accent = custom?.accentColor ?? base.accent;
  return {
    accent,
    border: custom?.accentColor ?? base.border,
    bg: custom?.bgColor ?? (custom?.accentColor ? tint(custom.accentColor) : base.bg),
    font: resolveFont(custom?.font, base.font),
    borderStyle: custom?.borderStyle ?? "solid",
    corner: custom?.corner ?? "rounded",
  };
}

export function LabelPreview({
  data,
  templateId,
  logoUrl,
  qrUrl,
  scale = 1,
}: Readonly<LabelPreviewProps>) {
  const { width: viewportWidth } = useWindowDimensions();
  const previewScale = fitLabelPreviewScale(scale, viewportWidth);
  const style = resolveLabelStyle(templateId, data.style);
  const qrSvg = qrUrl ? buildQrSvg(qrUrl) : null;
  const isDouble = style.borderStyle === "double";
  const hasDates = data.manufacturingDate || data.expirationDate;
  const hasContact = data.producerName || data.producerPhone;

  return (
    <Card
      style={{
        backgroundColor: style.bg,
        borderWidth: style.borderStyle === "none" ? 0 : 2,
        borderColor: style.border,
        borderStyle: style.borderStyle === "dashed" ? "dashed" : "solid",
        borderRadius: style.corner === "square" ? 0 : 12,
        padding: (isDouble ? 8 : 18) * previewScale,
        width: LABEL_PREVIEW_WIDTH * previewScale,
        alignSelf: "center",
      }}
    >
      <DoubleBorder visible={isDouble} color={style.border} scale={previewScale}>
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={{
              width: 52 * previewScale,
              height: 52 * previewScale,
              alignSelf: "center",
              borderRadius: 8,
            }}
          />
        ) : null}

        <Typography
          variant="h2"
          color={style.accent}
          style={{ textAlign: "center", fontSize: 20 * previewScale }}
        >
          {data.productName || "Nome do produto"}
        </Typography>

        {data.note?.trim() ? (
          <Typography
            variant="caption"
            color={style.accent}
            style={{ textAlign: "center", fontSize: 10 * previewScale }}
          >
            {data.note}
          </Typography>
        ) : null}

        {hasDates ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 24 * previewScale,
              marginTop: 2 * previewScale,
            }}
          >
            {data.manufacturingDate ? (
              <DateValue
                label="Feito em"
                value={data.manufacturingDate}
                color={style.accent}
                scale={previewScale}
              />
            ) : null}
            {data.expirationDate ? (
              <DateValue
                label="Validade"
                value={data.expirationDate}
                color={style.accent}
                scale={previewScale}
              />
            ) : null}
          </View>
        ) : null}

        {hasContact ? (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: style.border,
              paddingTop: 8 * previewScale,
              marginTop: 2 * previewScale,
              gap: 2 * previewScale,
            }}
          >
            {data.producerName ? (
              <Typography
                variant="caption"
                color={style.accent}
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 10 * previewScale,
                  textAlign: "center",
                }}
              >
                {data.producerName}
              </Typography>
            ) : null}
            {data.producerPhone ? (
              <Typography
                variant="caption"
                color={style.accent}
                style={{ fontSize: 9 * previewScale, textAlign: "center" }}
              >
                {data.producerPhone}
              </Typography>
            ) : null}
          </View>
        ) : null}

        {qrSvg ? (
          <View style={{ alignItems: "center", gap: 2 * previewScale }}>
            <SvgXml xml={qrSvg} width={64 * previewScale} height={64 * previewScale} />
            <Typography
              variant="caption"
              color={style.accent}
              style={{ fontSize: 8 * previewScale }}
            >
              Veja no catálogo
            </Typography>
          </View>
        ) : null}
      </DoubleBorder>
    </Card>
  );
}

function DateValue({
  label,
  value,
  color,
  scale,
}: Readonly<{ label: string; value: string; color: string; scale: number }>) {
  return (
    <View style={{ alignItems: "center" }}>
      <Typography
        variant="caption"
        color={color}
        style={{ fontFamily: fonts.bold, fontSize: 9 * scale }}
      >
        {label}
      </Typography>
      <Typography variant="caption" color={color} style={{ fontSize: 9 * scale }}>
        {isoToBR(value)}
      </Typography>
    </View>
  );
}

function DoubleBorder({
  visible,
  color,
  scale,
  children,
}: Readonly<{
  visible: boolean;
  color: string;
  scale: number;
  children: React.ReactNode;
}>) {
  if (!visible) return <View style={{ gap: 10 * scale }}>{children}</View>;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: color,
        borderRadius: 8,
        padding: 10 * scale,
        gap: 10 * scale,
      }}
    >
      {children}
    </View>
  );
}
