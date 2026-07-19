import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFieldPalette } from "../../../shared/components/form-field";
import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { MATERIAL_ICONS } from "../icons";
import { desktopModalSurface } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { ResponsiveOverlayModal } from "../../../shared/components/responsive-modal-surface";

interface MaterialIconFieldProps {
  readonly name: string;
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
}

/** Seletor do ícone (emoji) do insumo: preview + modal com grade de emojis. */
export function MaterialIconField({ name, value, onChange }: MaterialIconFieldProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const pal = useFieldPalette();
  const insets = useSafeAreaInsets();
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
        accessibilityLabel="Escolher ícone do insumo"
        style={{
          minHeight: 72,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.md,
        }}
      >
        <IngredientAvatar name={name || "Insumo"} emoji={value} size={48} />
        <View style={{ flex: 1 }}>
          <Typography variant="bodyBold" color={theme.colors.text}>
            {value ? "Ícone escolhido" : "Ícone automático"}
          </Typography>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {value ? "Toque para trocar" : "Definido pelo nome. Toque para escolher"}
          </Typography>
        </View>
        <AppIcon name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </Pressable>

      <ResponsiveOverlayModal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: isDesktop ? "center" : "flex-end",
            padding: isDesktop ? spacing.xl : 0,
          }}
        >
          <Pressable
            style={[
              {
                backgroundColor: pal.sheetBg,
                borderTopLeftRadius: radii["2xl"],
                borderTopRightRadius: radii["2xl"],
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.md,
                paddingBottom: isDesktop ? spacing.lg : spacing.lg + insets.bottom,
                gap: spacing.md,
                maxHeight: "75%",
              },
              desktopModalSurface(isDesktop, 640),
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 18 }}>
                Escolher ícone
              </Typography>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={10}
                accessibilityLabel="Fechar"
              >
                <AppIcon name="close" size={26} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Automático (pelo nome) */}
            <Pressable
              onPress={() => choose(null)}
              accessibilityRole="button"
              accessibilityState={{ selected: value == null }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                minHeight: 56,
                paddingHorizontal: spacing.md,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: value == null ? theme.colors.primary : pal.border,
                backgroundColor:
                  value == null ? `${theme.colors.primary}1f` : pal.fieldBg,
              }}
            >
              <IngredientAvatar name={name || "Insumo"} size={40} />
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold" color={theme.colors.text}>
                  Automático
                </Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Escolhe um ícone pelo nome do insumo
                </Typography>
              </View>
              {value == null ? (
                <AppIcon name="checkmark-circle" size={22} color={theme.colors.primary} />
              ) : null}
            </Pressable>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
                paddingBottom: spacing.sm,
              }}
            >
              {MATERIAL_ICONS.map((emoji) => {
                const active = value === emoji;
                return (
                  <Pressable
                    key={emoji}
                    onPress={() => choose(emoji)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Ícone ${emoji}`}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: radii.lg,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : pal.border,
                      backgroundColor: active ? `${theme.colors.primary}1f` : pal.fieldBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h2">{emoji}</Typography>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </ResponsiveOverlayModal>
    </>
  );
}
