import {
  DEFAULT_LABEL_LAYOUT,
  LABEL_LAYOUT_LIMITS,
  calculateLabelSheetCapacity,
  type LabelLayout,
} from "@lucro-caseiro/contracts";
import { Badge, Input, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";

interface LabelLayoutEditorProps {
  readonly value: LabelLayout | undefined;
  readonly onChange: (layout: LabelLayout) => void;
  readonly onValidityChange?: (valid: boolean) => void;
  readonly locked?: boolean;
  readonly onLockedPress?: () => void;
}

function decimalText(value: number): string {
  return String(value).replace(".", ",");
}

function parseDecimal(value: string): number {
  return Number(value.replace(",", "."));
}

export function LabelLayoutEditor({
  value,
  onChange,
  onValidityChange,
  locked = false,
  onLockedPress,
}: LabelLayoutEditorProps) {
  const { theme } = useTheme();
  const layout = value ?? DEFAULT_LABEL_LAYOUT;
  const [width, setWidth] = useState(decimalText(layout.widthMm));
  const [height, setHeight] = useState(decimalText(layout.heightMm));
  const [copies, setCopies] = useState(String(layout.copiesPerSheet));

  const widthValue = parseDecimal(width);
  const heightValue = parseDecimal(height);
  const copiesValue = Number(copies);
  const widthValid =
    Number.isFinite(widthValue) &&
    widthValue >= LABEL_LAYOUT_LIMITS.minWidthMm &&
    widthValue <= LABEL_LAYOUT_LIMITS.maxWidthMm;
  const heightValid =
    Number.isFinite(heightValue) &&
    heightValue >= LABEL_LAYOUT_LIMITS.minHeightMm &&
    heightValue <= LABEL_LAYOUT_LIMITS.maxHeightMm;
  const capacity =
    widthValid && heightValid
      ? calculateLabelSheetCapacity(widthValue, heightValue)
      : calculateLabelSheetCapacity(layout.widthMm, layout.heightMm);
  const copiesValid =
    Number.isInteger(copiesValue) && copiesValue >= 1 && copiesValue <= capacity;
  const valid = widthValid && heightValid && copiesValid;

  useEffect(() => {
    setWidth(decimalText(layout.widthMm));
    setHeight(decimalText(layout.heightMm));
    setCopies(String(layout.copiesPerSheet));
  }, [layout.widthMm, layout.heightMm, layout.copiesPerSheet]);

  useEffect(() => {
    onValidityChange?.(valid);
  }, [onValidityChange, valid]);

  function commitDraft(clampCopies = false) {
    if (!widthValid || !heightValid) return;
    const nextCopies = clampCopies
      ? Math.min(Math.max(1, copiesValue || 1), capacity)
      : copiesValue;
    if (!Number.isInteger(nextCopies) || nextCopies < 1 || nextCopies > capacity) return;
    setCopies(String(nextCopies));
    onChange({ widthMm: widthValue, heightMm: heightValue, copiesPerSheet: nextCopies });
  }

  const fields = (
    <View style={{ gap: spacing.md }} pointerEvents={locked ? "none" : "auto"}>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Input
          label="Largura (mm)"
          value={width}
          onChangeText={setWidth}
          onBlur={() => commitDraft(true)}
          keyboardType="decimal-pad"
          inputMode="decimal"
          error={
            widthValid
              ? undefined
              : `${LABEL_LAYOUT_LIMITS.minWidthMm} a ${LABEL_LAYOUT_LIMITS.maxWidthMm} mm`
          }
          containerStyle={{ flex: 1 }}
        />
        <Input
          label="Altura (mm)"
          value={height}
          onChangeText={setHeight}
          onBlur={() => commitDraft(true)}
          keyboardType="decimal-pad"
          inputMode="decimal"
          error={
            heightValid
              ? undefined
              : `${LABEL_LAYOUT_LIMITS.minHeightMm} a ${LABEL_LAYOUT_LIMITS.maxHeightMm} mm`
          }
          containerStyle={{ flex: 1 }}
        />
      </View>
      <Input
        label="Etiquetas por folha A4"
        value={copies}
        onChangeText={(next) => {
          setCopies(next.replace(/\D/g, ""));
        }}
        onBlur={() => commitDraft(true)}
        keyboardType="number-pad"
        inputMode="numeric"
        error={copiesValid ? undefined : `Escolha de 1 a ${capacity}`}
      />
      <Typography variant="caption" color={theme.colors.textSecondary}>
        Nesse tamanho cabem até {capacity} etiquetas por folha, com espaçamento para
        corte.
      </Typography>
    </View>
  );

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Typography variant="caption" style={{ flex: 1 }}>
          {locked
            ? "Defina medidas e quantidade por folha no plano Profissional."
            : "As medidas são aplicadas exatamente no PDF para impressão."}
        </Typography>
        {locked ? (
          <AppIcon name="lock-closed" size={16} color={theme.colors.premium} />
        ) : null}
        <Badge label="Profissional" variant="premium" />
      </View>
      {locked ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Desbloquear formato personalizado de etiquetas"
          onPress={onLockedPress}
          style={{ opacity: 0.65 }}
        >
          {fields}
        </Pressable>
      ) : (
        fields
      )}
    </View>
  );
}
