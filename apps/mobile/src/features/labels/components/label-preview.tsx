import type { LabelData } from "@lucro-caseiro/contracts";
import { Card, Typography, fonts } from "@lucro-caseiro/ui";
import React from "react";
import { Image, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { isoToBR } from "../dates";
import { NUTRITION_FIELDS, hasNutrition } from "../nutrition";
import { buildQrSvg } from "../qr";

interface LabelPreviewProps {
  data: LabelData;
  templateId: string;
  logoUrl?: string | null;
  qrUrl?: string | null;
  scale?: number;
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

/** Tinta clara derivada da cor de destaque (fundo automatico). */
function tint(hex: string, ratio = 0.93): string {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${channels
    .map((c) =>
      Math.round(c + (255 - c) * ratio)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export interface ResolvedLabelStyle extends TemplateStyle {
  borderStyle: "solid" | "dashed" | "double" | "none";
  corner: "rounded" | "square";
}

/** Mescla o template com o estilo customizado salvo no rotulo (Premium). */
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
  const style = resolveLabelStyle(templateId, data.style);
  const qrSvg = qrUrl ? buildQrSvg(qrUrl) : null;
  // RN nao tem borda "double": simulamos com borda externa + filete interno.
  const isDouble = style.borderStyle === "double";

  return (
    <Card
      style={{
        backgroundColor: style.bg,
        borderWidth: style.borderStyle === "none" ? 0 : 2,
        borderColor: style.border,
        borderStyle: style.borderStyle === "dashed" ? "dashed" : "solid",
        borderRadius: style.corner === "square" ? 0 : 12,
        padding: (isDouble ? 8 : 16) * scale,
        gap: 8 * scale,
        width: 280 * scale,
        alignSelf: "center",
      }}
    >
      <DoubleBorder visible={isDouble} color={style.border} scale={scale}>
        {logoUrl && (
          <Image
            source={{ uri: logoUrl }}
            style={{
              width: 48 * scale,
              height: 48 * scale,
              alignSelf: "center",
              borderRadius: 8,
            }}
          />
        )}

        <Typography
          variant="h2"
          color={style.accent}
          style={{
            textAlign: "center",
            fontSize: 18 * scale,
          }}
        >
          {data.productName || "Nome do produto"}
        </Typography>

        {data.ingredients && (
          <View style={{ gap: 2 }}>
            <Typography
              variant="caption"
              color={style.accent}
              style={{ fontFamily: fonts.bold, fontSize: 10 * scale }}
            >
              Ingredientes:
            </Typography>
            <Typography
              variant="caption"
              color={style.accent}
              style={{ fontSize: 9 * scale }}
            >
              {data.ingredients}
            </Typography>
          </View>
        )}

        {hasNutrition(data.nutrition) && (
          <View
            style={{
              borderWidth: 1,
              borderColor: style.accent,
              borderRadius: 6,
              padding: 6 * scale,
              gap: 2,
            }}
          >
            <Typography
              variant="caption"
              color={style.accent}
              style={{ fontFamily: fonts.bold, fontSize: 10 * scale }}
            >
              Informação nutricional
            </Typography>
            {NUTRITION_FIELDS.filter((f) => data.nutrition?.[f.key]?.trim()).map((f) => (
              <View
                key={f.key}
                style={{ flexDirection: "row", justifyContent: "space-between" }}
              >
                <Typography
                  variant="caption"
                  color={style.accent}
                  style={{ fontSize: 9 * scale }}
                >
                  {f.label}
                </Typography>
                <Typography
                  variant="caption"
                  color={style.accent}
                  style={{ fontSize: 9 * scale, fontFamily: fonts.bold }}
                >
                  {data.nutrition?.[f.key]}
                </Typography>
              </View>
            ))}
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          {data.manufacturingDate && (
            <View>
              <Typography
                variant="caption"
                color={style.accent}
                style={{ fontSize: 9 * scale, fontFamily: fonts.bold }}
              >
                Fabricacao
              </Typography>
              <Typography
                variant="caption"
                color={style.accent}
                style={{ fontSize: 9 * scale }}
              >
                {isoToBR(data.manufacturingDate)}
              </Typography>
            </View>
          )}
          {data.expirationDate && (
            <View>
              <Typography
                variant="caption"
                color={style.accent}
                style={{ fontSize: 9 * scale, fontFamily: fonts.bold }}
              >
                Validade
              </Typography>
              <Typography
                variant="caption"
                color={style.accent}
                style={{ fontSize: 9 * scale }}
              >
                {isoToBR(data.expirationDate)}
              </Typography>
            </View>
          )}
        </View>

        {(data.producerName || data.producerPhone) && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: style.border,
              paddingTop: 6,
              marginTop: 4,
            }}
          >
            {data.producerName && (
              <Typography
                variant="caption"
                color={style.accent}
                style={{ fontSize: 10 * scale, textAlign: "center" }}
              >
                {data.producerName}
              </Typography>
            )}
            {data.producerPhone && (
              <Typography
                variant="caption"
                color={style.accent}
                style={{ fontSize: 9 * scale, textAlign: "center" }}
              >
                {data.producerPhone}
              </Typography>
            )}
          </View>
        )}

        {qrSvg && (
          <View style={{ alignItems: "center", marginTop: 4 }}>
            <SvgXml xml={qrSvg} width={64 * scale} height={64 * scale} />
          </View>
        )}
      </DoubleBorder>
    </Card>
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
  if (!visible) return <>{children}</>;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: color,
        borderRadius: 8,
        padding: 8 * scale,
        gap: 8 * scale,
      }}
    >
      {children}
    </View>
  );
}
