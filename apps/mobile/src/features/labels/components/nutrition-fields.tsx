import type { NutritionFacts } from "@lucro-caseiro/contracts";
import { Input, Typography, spacing } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@lucro-caseiro/ui";

import { NUTRITION_FIELDS, hasNutrition } from "../nutrition";

interface NutritionFieldsProps {
  value?: NutritionFacts;
  onChange: (next: NutritionFacts) => void;
}

/** Seção colapsável com os campos da informação nutricional (opcional). */
export function NutritionFields({ value, onChange }: Readonly<NutritionFieldsProps>) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(() => hasNutrition(value));

  function setField(key: keyof NutritionFacts, text: string) {
    onChange({ ...value, [key]: text });
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        accessibilityRole="button"
      >
        <Ionicons
          name={open ? "chevron-down" : "chevron-forward"}
          size={20}
          color={theme.colors.textSecondary}
        />
        <Typography variant="bodyBold">Informação nutricional (opcional)</Typography>
      </Pressable>

      {open && (
        <View style={{ gap: spacing.sm }}>
          {NUTRITION_FIELDS.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={value?.[field.key] ?? ""}
              onChangeText={(text) => setField(field.key, text)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
