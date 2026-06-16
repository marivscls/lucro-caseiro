import { Card, Typography, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, Pressable, View } from "react-native";

import { useTemplates } from "../hooks";

interface TemplatePickerProps {
  selected?: string;
  onSelect: (templateId: string) => void;
}

const TEMPLATE_COLORS: Record<string, { bg: string; accent: string }> = {
  classico: { bg: "#FFFBEB", accent: "#92400E" },
  moderno: { bg: "#EFF6FF", accent: "#1E40AF" },
  minimalista: { bg: "#F9FAFB", accent: "#374151" },
  artesanal: { bg: "#FDF2F8", accent: "#9D174D" },
  gourmet: { bg: "#F5F3FF", accent: "#5B21B6" },
};

export function TemplatePicker({ selected, onSelect }: Readonly<TemplatePickerProps>) {
  const { theme } = useTheme();
  const { data: templates } = useTemplates();

  return (
    <View style={{ gap: 8 }}>
      <Typography variant="h3">Escolha um modelo</Typography>
      <FlatList
        data={templates}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
        renderItem={({ item }) => {
          const colors = TEMPLATE_COLORS[item.id] ?? { bg: "#F3F4F6", accent: "#4B5563" };
          const isSelected = selected === item.id;
          return (
            <Pressable
              onPress={() => onSelect(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={item.name}
            >
              <Card
                style={{
                  width: 116,
                  height: 132,
                  backgroundColor: colors.bg,
                  borderWidth: isSelected ? 3 : 1,
                  borderColor: isSelected ? theme.colors.primary : "#E5E7EB",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    opacity: 0.16,
                  }}
                />
                <Typography
                  variant="caption"
                  color={colors.accent}
                  numberOfLines={1}
                  style={{ fontWeight: "700", maxWidth: 96, textAlign: "center" }}
                >
                  {item.name}
                </Typography>
                {isSelected ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: theme.colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={theme.colors.textOnPrimary}
                    />
                  </View>
                ) : null}
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
