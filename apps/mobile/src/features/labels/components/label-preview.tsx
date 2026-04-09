import type { LabelData } from "@lucro-caseiro/contracts";
import { Card, Typography } from "@lucro-caseiro/ui";
import React from "react";
import { Image, View } from "react-native";

interface LabelPreviewProps {
  data: LabelData;
  templateId: string;
  logoUrl?: string | null;
  scale?: number;
}

const TEMPLATE_STYLES: Record<
  string,
  { bg: string; accent: string; border: string; font: string }
> = {
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

export function LabelPreview({
  data,
  templateId,
  logoUrl,
  scale = 1,
}: Readonly<LabelPreviewProps>) {
  const style = TEMPLATE_STYLES[templateId] ?? TEMPLATE_STYLES.classico;

  return (
    <Card
      style={{
        backgroundColor: style.bg,
        borderWidth: 2,
        borderColor: style.border,
        borderRadius: 12,
        padding: 16 * scale,
        gap: 8 * scale,
        width: 280 * scale,
        alignSelf: "center",
      }}
    >
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
            style={{ fontWeight: "700", fontSize: 10 * scale }}
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
              style={{ fontSize: 9 * scale, fontWeight: "700" }}
            >
              Fabricacao
            </Typography>
            <Typography
              variant="caption"
              color={style.accent}
              style={{ fontSize: 9 * scale }}
            >
              {data.manufacturingDate}
            </Typography>
          </View>
        )}
        {data.expirationDate && (
          <View>
            <Typography
              variant="caption"
              color={style.accent}
              style={{ fontSize: 9 * scale, fontWeight: "700" }}
            >
              Validade
            </Typography>
            <Typography
              variant="caption"
              color={style.accent}
              style={{ fontSize: 9 * scale }}
            >
              {data.expirationDate}
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
    </Card>
  );
}
