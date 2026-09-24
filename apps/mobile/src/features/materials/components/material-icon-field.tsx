import { Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

import {
  fieldMetrics,
  useFieldFrame,
  useFieldPalette,
} from "../../../shared/components/form-field";
import { StandardModal } from "../../../shared/components/standard-modal";
import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { MATERIAL_ICONS } from "../icons";
import { useBusinessCopy } from "../../subscription/business-copy";

interface MaterialIconFieldProps {
  readonly name: string;
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
}

/** Seletor do ícone (emoji) do insumo: campo com prévia + janela com grade de emojis. */
export function MaterialIconField({ name, value, onChange }: MaterialIconFieldProps) {
  const { theme } = useTheme();
  const experienceCopy = useBusinessCopy();
  const pal = useFieldPalette();
  const frame = useFieldFrame(false);
  const [open, setOpen] = useState(false);

  function choose(emoji: string | null) {
    onChange(emoji);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Escolher ícone de ${experienceCopy.materialNoun}`}
        style={({ pressed }) => [
          frame,
          {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            paddingHorizontal: spacing.md,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <IngredientAvatar
          name={name || experienceCopy.materialNoun}
          emoji={value}
          size={32}
        />
        <Typography
          variant="body"
          color={theme.colors.text}
          numberOfLines={1}
          style={{ flex: 1, minWidth: 0 }}
        >
          {value ? "Ícone escolhido" : "Automático, pelo nome"}
        </Typography>
        <AppIcon name="chevron-down" size={fieldMetrics.iconSize} color={pal.icon} />
      </Pressable>

      <StandardModal visible={open} title="Escolher ícone" onClose={() => setOpen(false)}>
        {/* Automático (pelo nome) */}
        <Pressable
          onPress={() => choose(null)}
          accessibilityRole="button"
          accessibilityState={{ selected: value == null }}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            minHeight: fieldMetrics.height,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: fieldMetrics.radius,
            borderWidth: value == null ? 2 : 1,
            borderColor: value == null ? theme.colors.primaryStrong : pal.border,
            backgroundColor: value == null ? theme.colors.primaryBg : pal.fieldBgFocus,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <IngredientAvatar name={name || experienceCopy.materialNoun} size={32} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="bodyBold" color={theme.colors.text}>
              Automático
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Escolhe um ícone pelo nome de {experienceCopy.materialNoun}
            </Typography>
          </View>
          {value == null ? (
            <AppIcon
              name="checkmark-circle"
              size={fieldMetrics.iconSize}
              color={theme.colors.primaryStrong}
            />
          ) : null}
        </Pressable>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {MATERIAL_ICONS.map((emoji) => {
            const active = value === emoji;
            return (
              <Pressable
                key={emoji}
                onPress={() => choose(emoji)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Ícone ${emoji}`}
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  borderRadius: fieldMetrics.radius,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? theme.colors.primaryStrong : pal.border,
                  backgroundColor: active ? theme.colors.primaryBg : pal.fieldBgFocus,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Typography variant="h3">{emoji}</Typography>
              </Pressable>
            );
          })}
        </View>
      </StandardModal>
    </>
  );
}
