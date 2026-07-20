import { Card, Typography, fonts, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

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
    <View style={{ width: "100%", minWidth: 0, gap: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.sm,
        }}
      >
        <Typography variant="h3">Escolha um modelo</Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Arraste
          </Typography>
          <AppIcon name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        directionalLockEnabled
        decelerationRate="fast"
        snapToInterval={128}
        style={{ width: "100%", maxWidth: "100%", flexGrow: 0 }}
        contentContainerStyle={{
          gap: spacing.md,
          paddingVertical: spacing.xs,
          paddingRight: spacing.xl,
        }}
      >
        {templates?.map((item) => {
          const colors = TEMPLATE_COLORS[item.id] ?? { bg: "#F3F4F6", accent: "#4B5563" };
          const isSelected = selected === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={item.name}
              style={{ width: 116, flexShrink: 0 }}
            >
              <Card
                padding="sm"
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
                    borderRadius: radii.md,
                    backgroundColor: colors.accent,
                    opacity: 0.16,
                  }}
                />
                <Typography
                  variant="caption"
                  color={colors.accent}
                  numberOfLines={1}
                  style={{ fontFamily: fonts.bold, maxWidth: 96, textAlign: "center" }}
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
                      borderRadius: radii.full,
                      backgroundColor: theme.colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppIcon
                      name="checkmark"
                      size={14}
                      color={theme.colors.textOnPrimary}
                    />
                  </View>
                ) : null}
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
