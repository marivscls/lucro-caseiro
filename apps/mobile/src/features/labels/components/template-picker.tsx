import { Card, Typography } from "@lucro-caseiro/ui";
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
  const { data: templates } = useTemplates();

  return (
    <View style={{ gap: 8 }}>
      <Typography variant="h3">Escolha um modelo</Typography>
      <FlatList
        data={templates}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => {
          const colors = TEMPLATE_COLORS[item.id] ?? { bg: "#F3F4F6", accent: "#4B5563" };
          const isSelected = selected === item.id;
          return (
            <Pressable onPress={() => onSelect(item.id)}>
              <Card
                style={{
                  width: 120,
                  height: 140,
                  backgroundColor: colors.bg,
                  borderWidth: isSelected ? 3 : 1,
                  borderColor: isSelected ? "#22C55E" : "#E5E7EB",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    backgroundColor: colors.accent,
                    opacity: 0.15,
                  }}
                />
                <Typography
                  variant="caption"
                  color={isSelected ? "#22C55E" : colors.accent}
                  style={{ fontWeight: isSelected ? "700" : "500" }}
                >
                  {item.name}
                </Typography>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
