import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import type { AppIconName } from "./app-icon";
import React, { useState } from "react";
import { useFieldValidationError } from "@lucro-caseiro/ui";
import { Pressable, View } from "react-native";
import { AnimatedDisclosure, DisclosureChevron } from "./motion-feedback";
import { useDesktopLayout } from "../layout/use-desktop-layout";
import { fieldMetrics } from "./form-field";

interface FormSectionProps {
  readonly title: string;
  readonly subtitle?: string;
  /** Ignorado: as seções não levam mais ícone, o título já diz o assunto. */
  readonly icon?: AppIconName;
  readonly titleAccessory?: React.ReactNode;
  readonly collapsible?: boolean;
  readonly initiallyOpen?: boolean;
  readonly children: React.ReactNode;
}

/**
 * Grupo de campos com título. Duas formas, sempre com a mesma tipografia:
 * - fixa (`collapsible={false}`): título e campos direto no formulário;
 * - recolhível (padrão): caixa com borda, para detalhes opcionais; abre sozinha
 *   quando um campo dela tem erro.
 */
export function FormSection({
  title,
  subtitle,
  titleAccessory,
  initiallyOpen = false,
  collapsible = true,
  children,
}: FormSectionProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const [open, setOpen] = useState(initiallyOpen);
  const [hovered, setHovered] = useState(false);
  const validationError = useFieldValidationError();
  React.useEffect(() => {
    if (validationError) setOpen(true);
  }, [validationError]);
  const expanded = !collapsible || open;
  const toggleLabel = `${open ? "Recolher" : "Expandir"} seção ${title}`;

  const heading = (
    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <Typography
          variant={isDesktop ? "desktopCardTitle" : "h3"}
          accessibilityRole={collapsible ? undefined : "header"}
          style={{ flexShrink: 1, minWidth: 0 }}
        >
          {title}
        </Typography>
        {titleAccessory}
      </View>
      {subtitle ? (
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {subtitle}
        </Typography>
      ) : null}
    </View>
  );

  if (!collapsible) {
    return (
      <View style={{ gap: spacing.lg }}>
        {heading}
        <View style={{ gap: fieldMetrics.fieldGap }}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={{
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: hovered ? theme.colors.textSecondary : theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        accessibilityRole="button"
        accessibilityLabel={toggleLabel}
        accessibilityState={{ expanded }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          minHeight: 64,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        {heading}
        <DisclosureChevron open={expanded} color={theme.colors.textSecondary} />
      </Pressable>
      <AnimatedDisclosure
        open={expanded}
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xl,
          gap: fieldMetrics.fieldGap,
        }}
      >
        {children}
      </AnimatedDisclosure>
    </View>
  );
}
