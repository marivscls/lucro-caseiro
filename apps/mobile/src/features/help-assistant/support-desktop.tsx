/**
 * Suporte no desktop (web >= 1024px): contato numa lateral fixa e perguntas
 * frequentes em grade abaixo do assistente. Só apresentação; abrir WhatsApp e
 * e-mail fica em `shared/utils/support-contact.ts`.
 */
import { Button, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { AppIcon } from "../../shared/components/app-icon";
import {
  DesktopGrid,
  DesktopSection,
  desktopCardStyle,
} from "../../shared/layout/desktop-page";

export function SupportContactDesktop({
  email,
  whatsapp,
  responseTime,
  onWhatsApp,
  onEmail,
}: Readonly<{
  email: string;
  whatsapp: string;
  responseTime: string;
  onWhatsApp: () => void;
  onEmail: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <View style={[desktopCardStyle(theme), { gap: spacing.lg }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <AppIcon
          name="chatbubble-ellipses-outline"
          size={22}
          color={theme.colors.textSecondary}
        />
        <Typography variant="desktopCardTitle" accessibilityRole="header">
          Fale com a gente
        </Typography>
      </View>
      <Typography variant="desktopBody" color={theme.colors.textSecondary}>
        O suporte está disponível para todos, em qualquer plano. Conte em qual etapa teve
        dificuldade para a gente ajudar. {responseTime}
      </Typography>
      <Button
        title="Chamar no WhatsApp"
        size="lg"
        icon={
          <AppIcon name="logo-whatsapp" size={20} color={theme.colors.textOnPrimary} />
        }
        onPress={onWhatsApp}
        style={{ width: "100%", minHeight: 48 }}
      />
      <Button
        title="Enviar e-mail"
        variant="outline"
        icon={<AppIcon name="mail-outline" size={20} color={theme.colors.primary} />}
        onPress={onEmail}
        style={{ width: "100%", minHeight: 48 }}
      />
      <View style={{ gap: 2 }}>
        <Typography variant="desktopMeta" selectable>
          WhatsApp: {whatsapp}
        </Typography>
        <Typography variant="desktopMeta" selectable>
          E-mail: {email}
        </Typography>
      </View>
    </View>
  );
}

export function SupportFaqDesktop({
  items,
}: Readonly<{ items: readonly { question: string; answer: string }[] }>) {
  const { theme } = useTheme();
  return (
    <DesktopSection title="Perguntas frequentes">
      <DesktopGrid minColumnWidth={320} maxColumns={2}>
        {items.map((item) => (
          <View
            key={item.question}
            style={[desktopCardStyle(theme), { gap: spacing.sm, height: "100%" }]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}
            >
              <AppIcon
                name="help-circle-outline"
                size={20}
                color={theme.colors.primaryLight}
                style={{ marginTop: 2 }}
              />
              <Typography variant="desktopBodyStrong" style={{ flex: 1 }}>
                {item.question}
              </Typography>
            </View>
            <Typography variant="desktopBody" color={theme.colors.textSecondary}>
              {item.answer}
            </Typography>
          </View>
        ))}
      </DesktopGrid>
    </DesktopSection>
  );
}
