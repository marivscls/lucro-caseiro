import { Typography, fonts, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatCurrency } from "../../../shared/utils/format";
import { useFieldPalette } from "../../../shared/components/form-field";
import { YIELD_UNIT_PRESETS } from "../yield-units";
import { desktopModalSurface } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { ResponsiveOverlayModal } from "../../../shared/components/responsive-modal-surface";

const CATEGORY_PRESETS = ["Doces", "Salgados", "Bolos", "Bebidas", "Outros"];

const YIELD_UNIT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  unidades: "cube-outline",
  fatias: "pizza-outline",
  porções: "restaurant-outline",
  kg: "barbell-outline",
  g: "flask-outline",
};

/** Ícone do campo num círculo tingido (à esquerda do campo). */
export function IconBadge({ icon }: Readonly<{ icon: keyof typeof Ionicons.glyphMap }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: radii.full,
        backgroundColor: `${theme.colors.primary}1f`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
    </View>
  );
}

/** Linha de campo: ícone em círculo + (label acima + conteúdo). */
export function FieldRow({
  icon,
  label,
  optional,
  align = "center",
  children,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  optional?: boolean;
  align?: "center" | "top";
  children: React.ReactNode;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.md,
        alignItems: align === "top" ? "flex-start" : "center",
      }}
    >
      <View style={{ paddingTop: align === "top" ? 26 : 0 }}>
        <IconBadge icon={icon} />
      </View>
      <View style={{ flex: 1, gap: spacing.sm }}>
        <Typography variant="bodyBold" color={theme.colors.text}>
          {label}
          {optional ? (
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {" "}
              (opcional)
            </Typography>
          ) : null}
        </Typography>
        {children}
      </View>
    </View>
  );
}

export function TextBox({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoFocus,
  maxLength,
}: Readonly<{
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad";
  autoFocus?: boolean;
  maxLength?: number;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      style={{
        minHeight: maxLength ? 64 : 56,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        paddingHorizontal: spacing.md,
        paddingVertical: maxLength ? spacing.sm : 0,
        justifyContent: "center",
      }}
    >
      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(maxLength ? t.slice(0, maxLength) : t)}
        placeholder={placeholder}
        placeholderTextColor={pal.placeholder}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        maxLength={maxLength}
        style={{
          color: theme.colors.text,
          fontSize: 16,
          paddingVertical: maxLength ? 0 : spacing.md,
        }}
      />
      {maxLength ? (
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ alignSelf: "flex-end" }}
        >
          {value.length}/{maxLength}
        </Typography>
      ) : null}
    </View>
  );
}

export function CategoryField({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const pal = useFieldPalette();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function confirm(cat: string) {
    onChange(cat.trim());
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={() => {
          setDraft(value);
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Escolher categoria"
        style={{
          minHeight: 56,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          gap: spacing.md,
        }}
      >
        <Typography
          variant="body"
          color={value ? theme.colors.text : pal.placeholder}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {value || "Ex: Doces, Salgados, Bolos..."}
        </Typography>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
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
            backgroundColor: "rgba(0,0,0,0.55)",
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
              },
              desktopModalSurface(isDesktop, 640),
            ]}
          >
            <Typography variant="h3" color={theme.colors.text}>
              Categoria
            </Typography>
            <View
              style={{
                minHeight: 56,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: pal.border,
                backgroundColor: pal.fieldBg,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: spacing.md,
                gap: spacing.md,
              }}
            >
              <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Digite uma categoria nova"
                placeholderTextColor={pal.placeholder}
                autoFocus
                style={{
                  flex: 1,
                  color: theme.colors.text,
                  fontSize: 16,
                  paddingVertical: spacing.md,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {CATEGORY_PRESETS.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => confirm(cat)}
                  accessibilityRole="button"
                  style={{
                    minHeight: 40,
                    paddingHorizontal: spacing.md,
                    justifyContent: "center",
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: pal.border,
                    backgroundColor: pal.fieldBg,
                  }}
                >
                  <Typography variant="body" color={theme.colors.text}>
                    {cat}
                  </Typography>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => confirm(draft)}
              disabled={!draft.trim()}
              accessibilityRole="button"
              style={({ pressed }) => {
                let opacity = 1;
                if (!draft.trim()) opacity = 0.5;
                else if (pressed) opacity = 0.85;
                return {
                  minHeight: 52,
                  borderRadius: radii.lg,
                  backgroundColor: theme.colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity,
                };
              }}
            >
              <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
                Usar categoria
              </Typography>
            </Pressable>
          </Pressable>
        </Pressable>
      </ResponsiveOverlayModal>
    </>
  );
}

export function InstructionsField({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const MAX = 1000;
  return (
    <View
      style={{
        minHeight: 140,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        padding: spacing.md,
      }}
    >
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.slice(0, MAX))}
        placeholder="Descreva o passo a passo da receita..."
        placeholderTextColor={pal.placeholder}
        multiline
        maxLength={MAX}
        style={{
          flex: 1,
          color: theme.colors.text,
          fontSize: 16,
          textAlignVertical: "top",
          padding: 0,
          minHeight: 96,
        }}
      />
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ alignSelf: "flex-end" }}
      >
        {value.length}/{MAX}
      </Typography>
    </View>
  );
}

/** Campo de foto da receita: preview da imagem ou caixa tracejada "Adicionar foto". */
export function RecipePhotoField({
  imageUri,
  onPick,
}: Readonly<{ imageUri: string | null; onPick: () => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <Pressable
      onPress={onPick}
      accessibilityRole="button"
      accessibilityLabel="Adicionar foto da receita"
      style={{
        borderRadius: radii.lg,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        overflow: "hidden",
        justifyContent: "center",
      }}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: "100%", height: 150 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            gap: spacing.sm,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.md,
              backgroundColor: `${theme.colors.primary}22`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="camera-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography
              variant="caption"
              color={theme.colors.text}
              style={{ fontFamily: fonts.bold }}
            >
              Adicionar foto
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              PNG, JPG até 5MB
            </Typography>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** Chips de atalho para a unidade de rendimento (com ícone). */
export function YieldUnitChips({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {YIELD_UNIT_PRESETS.map((preset) => {
        const active = value.trim() === preset;
        return (
          <Pressable
            key={preset}
            onPress={() => onChange(preset)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              minHeight: 44,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: active ? theme.colors.primary : pal.border,
              backgroundColor: active ? theme.colors.primary : pal.fieldBg,
            }}
          >
            <Ionicons
              name={YIELD_UNIT_ICONS[preset] ?? "ellipse-outline"}
              size={18}
              color={active ? theme.colors.textOnPrimary : theme.colors.primary}
            />
            <Typography
              variant="caption"
              color={active ? theme.colors.textOnPrimary : theme.colors.text}
              style={{ fontFamily: fonts.bold }}
            >
              {preset}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Card de custo (total + por unidade) — usado na edição. */
export function RecipeCostCard({
  totalCost,
  costPerUnit,
}: Readonly<{ totalCost: number; costPerUnit: number }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}66`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="cash-outline" size={22} color={theme.colors.primary} />
      </View>
      <View
        style={{ flex: 1, alignItems: "center", gap: 2, paddingHorizontal: spacing.xs }}
      >
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          numberOfLines={1}
        >
          Custo total
        </Typography>
        <Typography
          variant="money"
          color={theme.colors.primary}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(totalCost)}
        </Typography>
      </View>
      <View style={{ width: 1, alignSelf: "stretch", backgroundColor: pal.border }} />
      <View
        style={{ flex: 1, alignItems: "center", gap: 2, paddingHorizontal: spacing.xs }}
      >
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          numberOfLines={1}
        >
          Custo/unidade
        </Typography>
        <Typography
          variant="money"
          color={theme.colors.success}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(costPerUnit)}
        </Typography>
      </View>
    </View>
  );
}
