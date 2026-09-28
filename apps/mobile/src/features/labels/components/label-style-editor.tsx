import type { LabelStyle } from "@lucro-caseiro/contracts";
import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

import { ColorPickerModal } from "../../../shared/components/color-picker-modal";
import {
  ChoiceField,
  FormField,
  fieldMetrics,
  type ChoiceOption,
} from "../../../shared/components/form-field";

// Cores de destaque sugeridas (mesma vibe dos templates + extras).
const ACCENT_PRESETS = ["#92400E", "#9D174D", "#5B21B6", "#1E40AF", "#166534", "#111827"];

type BorderKey = NonNullable<LabelStyle["borderStyle"]>;
type CornerKey = NonNullable<LabelStyle["corner"]>;

const BORDER_OPTIONS: readonly ChoiceOption<BorderKey>[] = [
  { value: "solid", label: "Linha" },
  { value: "dashed", label: "Tracejada" },
  { value: "double", label: "Dupla" },
  { value: "none", label: "Sem borda" },
];

const CORNER_OPTIONS: readonly ChoiceOption<CornerKey>[] = [
  { value: "rounded", label: "Arredondado" },
  { value: "square", label: "Reto" },
];

function LockedWrapper({
  locked,
  children,
}: Readonly<{ locked: boolean; children: React.ReactNode }>) {
  if (!locked) return <View style={{ gap: fieldMetrics.fieldGap }}>{children}</View>;
  return <View style={{ opacity: 0.65, gap: fieldMetrics.fieldGap }}>{children}</View>;
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
 * seletor livre), borda e cantos. `undefined`/campos vazios = visual do
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
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ flex: 1 }}
        >
          {locked
            ? "Veja como sua etiqueta pode ficar. Desbloqueie com o Profissional."
            : "Deixe a etiqueta com a sua cara ou mantenha o visual do modelo."}
        </Typography>
        {locked && <AppIcon name="lock-closed" size={16} color={theme.colors.premium} />}
      </View>

      <LockedWrapper locked={locked}>
        <FormField label="Cor de destaque">
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
                    borderRadius: radii.full,
                    backgroundColor: color,
                    borderWidth: selected ? 3 : 0,
                    borderColor: theme.colors.text,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selected && <AppIcon name="checkmark" size={20} color="#fff" />}
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
                borderRadius: radii.full,
                backgroundColor: isCustomAccent
                  ? style.accentColor
                  : theme.colors.surface,
                borderWidth: isCustomAccent ? 3 : 1.5,
                borderStyle: isCustomAccent ? "solid" : "dashed",
                borderColor: isCustomAccent ? theme.colors.text : theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon
                name={isCustomAccent ? "checkmark" : "add"}
                size={22}
                color={isCustomAccent ? "#fff" : theme.colors.primaryLight}
              />
            </Pressable>
          </View>
        </FormField>

        <FormField label="Borda">
          <ChoiceField
            accessibilityLabel="Borda da etiqueta"
            value={(style.borderStyle ?? "") as BorderKey}
            options={BORDER_OPTIONS}
            onChange={(next) => set("borderStyle", next)}
          />
        </FormField>

        <FormField label="Cantos">
          <ChoiceField
            accessibilityLabel="Cantos da etiqueta"
            value={(style.corner ?? "") as CornerKey}
            options={CORNER_OPTIONS}
            onChange={(next) => set("corner", next)}
          />
        </FormField>

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
