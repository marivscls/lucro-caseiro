import type { LabelStyle } from "@lucro-caseiro/contracts";
import { Badge, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

import { ColorPickerModal } from "../../../shared/components/color-picker-modal";

// Cores de destaque sugeridas (mesma vibe dos templates + extras).
const ACCENT_PRESETS = ["#92400E", "#9D174D", "#5B21B6", "#1E40AF", "#166534", "#111827"];

const FONT_OPTIONS: { key: NonNullable<LabelStyle["font"]>; label: string }[] = [
  { key: "serif", label: "Clássica" },
  { key: "sans", label: "Moderna" },
];

const BORDER_OPTIONS: {
  key: NonNullable<LabelStyle["borderStyle"]>;
  label: string;
}[] = [
  { key: "solid", label: "Linha" },
  { key: "dashed", label: "Tracejada" },
  { key: "double", label: "Dupla" },
  { key: "none", label: "Sem borda" },
];

const CORNER_OPTIONS: { key: NonNullable<LabelStyle["corner"]>; label: string }[] = [
  { key: "rounded", label: "Arredondado" },
  { key: "square", label: "Reto" },
];

function LockedWrapper({
  locked,
  children,
}: Readonly<{ locked: boolean; children: React.ReactNode }>) {
  if (!locked) return <>{children}</>;
  return <View style={{ opacity: 0.65, gap: spacing.md }}>{children}</View>;
}

interface PillProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
}

function Pill({ label, selected, onPress }: PillProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        minHeight: 44,
        paddingHorizontal: spacing.lg,
        borderRadius: 999,
        justifyContent: "center",
        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : "rgba(128, 99, 84, 0.25)",
      }}
    >
      <Typography
        variant="bodyBold"
        color={selected ? theme.colors.textOnPrimary : theme.colors.text}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

interface LabelStyleEditorProps {
  readonly value: LabelStyle | undefined;
  readonly onChange: (style: LabelStyle | undefined) => void;
  /** Chamado quando usuario free toca em qualquer opcao; retorna true se bloqueou. */
  readonly onLockedPress?: () => boolean;
  /** Free: opcoes visiveis (vislumbre) mas com cadeado e leve opacidade. */
  readonly locked?: boolean;
}

/**
 * Editor do estilo customizado do rotulo (Premium): cor de destaque (presets +
 * seletor livre), fonte, borda e cantos. `undefined`/campos vazios = visual do
 * template escolhido.
 */
export function LabelStyleEditor({
  value,
  onChange,
  onLockedPress,
  locked = false,
}: LabelStyleEditorProps) {
  const { theme } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const style = value ?? {};
  const isCustomAccent =
    !!style.accentColor && !ACCENT_PRESETS.includes(style.accentColor);

  function set<K extends keyof LabelStyle>(key: K, fieldValue: LabelStyle[K]) {
    if (onLockedPress?.()) return;
    const next = { ...style, [key]: fieldValue };
    // Toggle: tocar de novo na opcao ativa volta ao padrao do template.
    if (style[key] === fieldValue) delete next[key];
    onChange(Object.keys(next).length > 0 ? next : undefined);
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Typography variant="caption" style={{ flex: 1 }}>
          {locked
            ? "Veja como seu rótulo pode ficar. Desbloqueie com o Premium."
            : "Deixe o rótulo com a sua cara ou mantenha o visual do modelo."}
        </Typography>
        {locked && <Ionicons name="lock-closed" size={16} color={theme.colors.premium} />}
        <Badge label="Premium" variant="premium" />
      </View>

      <LockedWrapper locked={locked}>
        <Typography variant="caption">Cor de destaque</Typography>
        <View style={{ flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
          {ACCENT_PRESETS.map((color) => {
            const selected = style.accentColor === color;
            return (
              <Pressable
                key={color}
                onPress={() => set("accentColor", color)}
                accessibilityRole="button"
                accessibilityLabel={`Cor ${color}`}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: color,
                  borderWidth: selected ? 3 : 0,
                  borderColor: theme.colors.text,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selected && <Ionicons name="checkmark" size={20} color="#fff" />}
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              if (onLockedPress?.()) return;
              setPickerVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Escolher cor personalizada"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isCustomAccent ? style.accentColor : theme.colors.surface,
              borderWidth: isCustomAccent ? 3 : 1.5,
              borderStyle: isCustomAccent ? "solid" : "dashed",
              borderColor: isCustomAccent ? theme.colors.text : "rgba(128, 99, 84, 0.4)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={isCustomAccent ? "checkmark" : "add"}
              size={22}
              color={isCustomAccent ? "#fff" : theme.colors.primaryLight}
            />
          </Pressable>
        </View>

        <Typography variant="caption">Fonte</Typography>
        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
          {FONT_OPTIONS.map((option) => (
            <Pill
              key={option.key}
              label={option.label}
              selected={style.font === option.key}
              onPress={() => set("font", option.key)}
            />
          ))}
        </View>

        <Typography variant="caption">Borda</Typography>
        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
          {BORDER_OPTIONS.map((option) => (
            <Pill
              key={option.key}
              label={option.label}
              selected={style.borderStyle === option.key}
              onPress={() => set("borderStyle", option.key)}
            />
          ))}
        </View>

        <Typography variant="caption">Cantos</Typography>
        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
          {CORNER_OPTIONS.map((option) => (
            <Pill
              key={option.key}
              label={option.label}
              selected={style.corner === option.key}
              onPress={() => set("corner", option.key)}
            />
          ))}
        </View>

        {value && (
          <Pressable
            onPress={() => onChange(undefined)}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Typography variant="caption" color={theme.colors.alert}>
              Limpar estilo e voltar ao visual do modelo
            </Typography>
          </Pressable>
        )}
      </LockedWrapper>

      <ColorPickerModal
        visible={pickerVisible}
        initialColor={style.accentColor ?? "#92400E"}
        onConfirm={(hex) => {
          setPickerVisible(false);
          if (onLockedPress?.()) return;
          const next = { ...style, accentColor: hex };
          onChange(next);
        }}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
}
