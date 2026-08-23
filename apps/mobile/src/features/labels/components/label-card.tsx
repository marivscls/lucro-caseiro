import type { Label } from "@lucro-caseiro/contracts";
import {
  Typography,
  fonts,
  fontSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { displayLabelName, formatLabelEditedAt } from "../domain";
import { LabelThumbnail } from "./label-thumbnail";

interface LabelCardProps {
  readonly label: Label;
  readonly category: string;
  readonly mostUsed: boolean;
  readonly onPress: () => void;
  readonly onEdit: () => void;
  readonly onPrint: () => void;
  readonly onDelete: () => void;
}

export function LabelCard({
  label,
  category,
  mostUsed,
  onPress,
  onEdit,
  onPrint,
  onDelete,
}: LabelCardProps) {
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
      style={{
        minHeight: 88,
        borderRadius: 18,
        backgroundColor: palette.white,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.sm,
        paddingLeft: spacing.sm,
        paddingRight: spacing.sm,
        gap: spacing.sm,
        ...theme.shadows.sm,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${name}`}
        style={({ pressed }) => ({
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <LabelThumbnail label={label} />

        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Typography
              variant="bodyBold"
              color={palette.ink}
              numberOfLines={1}
              style={{
                fontFamily: fonts.bold,
                fontSize: fontSizes.md,
                flexGrow: 1,
                flexShrink: 1,
                minWidth: 72,
              }}
            >
              {name}
            </Typography>
            {mostUsed ? (
              <View
                accessibilityLabel="Mais usada"
                style={{
                  flexShrink: 0,
                  backgroundColor: palette.lime,
                  borderRadius: radii.full,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 3,
                }}
              >
                <Typography
                  color={palette.onLime}
                  style={{ fontFamily: fonts.bold, fontSize: 11, lineHeight: 14 }}
                >
                  ★ mais usada
                </Typography>
              </View>
            ) : null}
          </View>
          {categoryLabel ? (
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: palette.softRose,
                borderRadius: radii.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
              }}
            >
              <Typography
                color={palette.wine}
                numberOfLines={1}
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 12,
                  lineHeight: 16,
                  textTransform: "lowercase",
                }}
              >
                {categoryLabel}
              </Typography>
            </View>
          ) : null}
          <Typography
            variant="caption"
            color={palette.muted}
            numberOfLines={1}
            style={{ fontFamily: fonts.medium }}
          >
            {formatLabelEditedAt(label.createdAt)}
          </Typography>
        </View>
      </Pressable>

      <Pressable
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel={`Ações de ${name}`}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <AppIcon name="ellipsis-vertical" size={20} color={palette.muted} />
      </Pressable>
    </View>
  );
}
