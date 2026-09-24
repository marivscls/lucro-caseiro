/**
 * Peças de Etiquetas no desktop (web >= 1024px). Estado e regras continuam em
 * `app/labels.tsx`; aqui só a apresentação: galeria de etiquetas com prévia
 * grande e ações visíveis, e estado vazio em cartão.
 */
import type { Label } from "@lucro-caseiro/contracts";
import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { showAlert } from "../../../shared/components/alert-store";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import { desktopCardStyle } from "../../../shared/layout/desktop-page";
import { displayLabelName, formatLabelEditedAt } from "../domain";
import { LabelThumbnail } from "./label-thumbnail";

function CardAction({
  icon,
  label,
  accessibilityLabel,
  onPress,
}: Readonly<{
  icon: AppIconName;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        flex: 1,
        minHeight: 48,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: hovered ? theme.colors.textSecondary : theme.colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <AppIcon name={icon} size={18} color={theme.colors.primaryStrong} />
      <Typography
        variant="desktopBodyStrong"
        color={theme.colors.primaryStrong}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

/** Cartão da galeria: prévia ampliada, nome, modelo e ações diretas. */
export function LabelDesktopCard({
  label,
  category,
  mostUsed,
  onPress,
  onEdit,
  onPrint,
  onDelete,
}: Readonly<{
  label: Label;
  category: string;
  mostUsed: boolean;
  onPress: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const name = displayLabelName(label.name);
  const categoryLabel = category.trim();

  function openMenu() {
    showAlert({
      title: name,
      message: "O que você quer fazer?",
      buttons: [
        { text: "Editar", onPress: onEdit },
        { text: "Baixar / Compartilhar", onPress: onPrint },
        { text: "Excluir", style: "destructive", onPress: onDelete },
        { text: "Cancelar", style: "cancel" },
      ],
    });
  }

  return (
    <View
      style={[desktopCardStyle(theme, { padding: 0 }), { flex: 1, overflow: "hidden" }]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${name}`}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
          flex: 1,
          opacity: pressed || hovered ? 0.9 : 1,
        })}
      >
        <View
          style={{
            height: 152,
            backgroundColor: palette.softRose,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ transform: [{ scale: 1.7 }] }}>
            <LabelThumbnail label={label} />
          </View>
        </View>
        <View style={{ padding: spacing.xl, gap: spacing.xs }}>
          <Typography variant="desktopCardTitle" color={palette.ink} numberOfLines={2}>
            {name}
          </Typography>
          {categoryLabel || mostUsed ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {categoryLabel ? (
                <Typography variant="desktopMeta" color={palette.wine}>
                  Modelo {categoryLabel}
                </Typography>
              ) : null}
              {mostUsed ? (
                <View
                  accessibilityLabel="Mais usada"
                  style={{
                    backgroundColor: palette.lime,
                    borderRadius: radii.full,
                    paddingHorizontal: spacing.sm,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <AppIcon name="star" size={14} color={palette.onLime} />
                  <Typography variant="desktopMeta" color={palette.onLime}>
                    Mais usada
                  </Typography>
                </View>
              ) : null}
            </View>
          ) : null}
          <Typography variant="desktopMeta">
            {formatLabelEditedAt(label.createdAt)}
          </Typography>
        </View>
      </Pressable>
      <View
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xl,
        }}
      >
        <CardAction
          icon="download-outline"
          label="Imprimir"
          accessibilityLabel={`Baixar ou imprimir ${name}`}
          onPress={onPrint}
        />
        <CardAction
          icon="pencil-outline"
          label="Editar"
          accessibilityLabel={`Editar ${name}`}
          onPress={onEdit}
        />
        <Pressable
          onPress={openMenu}
          accessibilityRole="button"
          accessibilityLabel={`Ações de ${name}`}
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
            width: 48,
            height: 48,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: hovered ? theme.colors.textSecondary : theme.colors.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <AppIcon name="ellipsis-horizontal" size={20} color={palette.muted} />
        </Pressable>
      </View>
    </View>
  );
}
