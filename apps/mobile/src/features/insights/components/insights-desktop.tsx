/**
 * Resultados no desktop (web >= 1024px): peças de apresentação. Dados e
 * regras continuam em `app/insights.tsx` e `domain.ts`.
 */
import { Button, Typography, fonts, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import {
  desktopActionButton,
  desktopCardStyle,
} from "../../../shared/layout/desktop-page";
import type { ActionableInsight, InsightQuestionId } from "../domain";
import { DesktopEmptyCard } from "../../../shared/layout/desktop-kit";

/** Cartão com título de 18px, ícone e conteúdo. */
export function InsightsCardDesktop({
  title,
  icon,
  description,
  children,
}: Readonly<{
  title: string;
  icon?: AppIconName;
  description?: string;
  children: ReactNode;
}>) {
  const { theme } = useTheme();
  return (
    <View style={[desktopCardStyle(theme), { gap: spacing.lg }]}>
      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {icon ? (
            <AppIcon name={icon} size={20} color={theme.colors.textSecondary} />
          ) : null}
          <Typography variant="desktopCardTitle" accessibilityRole="header">
            {title}
          </Typography>
        </View>
        {description ? (
          <Typography variant="desktopMeta">{description}</Typography>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** "O que fazer agora": recomendações clicáveis em 16px. */
export function InsightsActionsDesktop({
  actions,
  onOpen,
}: Readonly<{
  actions: readonly ActionableInsight[];
  onOpen: (action: ActionableInsight) => void;
}>) {
  const { theme } = useTheme();
  return (
    <InsightsCardDesktop title="O que fazer agora" icon="bulb-outline">
      <View style={{ gap: spacing.sm }}>
        {actions.map((action) => {
          const attention = action.tone === "attention";
          const fg = attention ? theme.colors.alert : theme.colors.primaryStrong;
          return (
            <Pressable
              key={action.id}
              onPress={() => onOpen(action)}
              accessibilityRole="button"
              accessibilityLabel={`${attention ? "Atenção" : "Oportunidade"}: ${action.title}`}
              style={({ hovered, pressed }: { pressed: boolean; hovered?: boolean }) => ({
                flexDirection: "row",
                alignItems: "flex-start",
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: hovered ? theme.colors.textSecondary : theme.colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radii.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: attention
                    ? theme.colors.alertBg
                    : theme.colors.primaryBg,
                }}
              >
                <AppIcon
                  name={attention ? "warning-outline" : "bulb-outline"}
                  size={18}
                  color={fg}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Typography
                  variant="desktopMeta"
                  color={fg}
                  style={{ fontFamily: fonts.bold }}
                >
                  {attention ? "Atenção" : "Oportunidade"}
                </Typography>
                <Typography variant="desktopBodyStrong">{action.title}</Typography>
                <Typography variant="desktopMeta">{action.description}</Typography>
              </View>
              <AppIcon
                name="chevron-forward"
                size={18}
                color={theme.colors.textSecondary}
                style={{ marginTop: 9 }}
              />
            </Pressable>
          );
        })}
      </View>
    </InsightsCardDesktop>
  );
}

/** Perguntas rápidas em botões de 48px e resposta abaixo. */
export function InsightsQuestionsDesktop({
  questions,
  selected,
  answer,
  onSelect,
}: Readonly<{
  questions: ReadonlyArray<{ id: InsightQuestionId; label: string }>;
  selected: InsightQuestionId | null;
  answer: string | null;
  onSelect: (id: InsightQuestionId) => void;
}>) {
  const { theme } = useTheme();
  return (
    <InsightsCardDesktop
      title="Perguntas rápidas"
      icon="help-circle-outline"
      description="Respostas calculadas somente com estoque, custos e vendas cadastrados."
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {questions.map((question) => {
          const active = selected === question.id;
          return (
            <Pressable
              key={question.id}
              onPress={() => onSelect(question.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ hovered }: { pressed: boolean; hovered?: boolean }) => ({
                minHeight: 48,
                justifyContent: "center",
                paddingHorizontal: spacing.lg,
                borderRadius: radii.full,
                borderWidth: 1,
                borderColor:
                  active || hovered ? theme.colors.primary : theme.colors.border,
                backgroundColor: active
                  ? theme.colors.primaryBg
                  : theme.colors.surfaceElevated,
              })}
            >
              <Typography variant="desktopBodyStrong">{question.label}</Typography>
            </Pressable>
          );
        })}
      </View>
      {answer ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            borderRadius: radii.md,
            backgroundColor: theme.colors.surface,
            padding: spacing.lg,
          }}
        >
          <Typography variant="desktopBody" color={theme.colors.text}>
            {answer}
          </Typography>
        </View>
      ) : null}
    </InsightsCardDesktop>
  );
}

const TEASER_ITEMS: ReadonlyArray<{ icon: AppIconName; label: string }> = [
  { icon: "bar-chart-outline", label: "Faturamento mês a mês" },
  { icon: "flame-outline", label: "Produtos mais vendidos" },
  { icon: "trophy-outline", label: "Seus melhores clientes" },
];

/** Convite para os resultados completos: texto e botão à esquerda, o que libera à direita. */
export function InsightsTeaserDesktop({
  onUpgrade,
}: Readonly<{ onUpgrade: () => void }>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        desktopCardStyle(theme, { padding: 28 }),
        { flexDirection: "row", flexWrap: "wrap", gap: spacing["3xl"] },
      ]}
    >
      <View style={{ flex: 1, flexBasis: 300, minWidth: 0, gap: spacing.md }}>
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: radii.full,
            backgroundColor: theme.colors.premiumBg,
          }}
        >
          <AppIcon name="diamond-outline" size={16} color={theme.colors.premium} />
          <Typography
            variant="desktopMeta"
            color={theme.colors.premium}
            style={{ fontFamily: fonts.bold }}
          >
            Recurso Profissional
          </Typography>
        </View>
        <Typography variant="desktopSection" accessibilityRole="header">
          Resultados completos
        </Typography>
        <Typography variant="desktopBody" style={{ maxWidth: 460 }}>
          Veja seu faturamento mês a mês, os produtos mais vendidos e seus melhores
          clientes.
        </Typography>
        <Button
          title="Desbloquear no Profissional"
          onPress={onUpgrade}
          icon={
            <AppIcon
              name="lock-open-outline"
              size={20}
              color={theme.colors.textOnPrimary}
            />
          }
          style={{
            ...desktopActionButton,
            alignSelf: "flex-start",
            marginTop: spacing.sm,
          }}
        />
      </View>
      <View style={{ flex: 1, flexBasis: 280, minWidth: 0, gap: spacing.md }}>
        {TEASER_ITEMS.map((item) => (
          <View
            key={item.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              padding: spacing.lg,
              borderRadius: radii.md,
              backgroundColor: theme.colors.surface,
            }}
          >
            <AppIcon name={item.icon} size={22} color={theme.colors.premium} />
            <Typography variant="desktopBodyStrong" style={{ flex: 1 }}>
              {item.label}
            </Typography>
            <AppIcon
              name="lock-closed-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Estado vazio em cartão tracejado. */
export function InsightsEmptyDesktop({ onAdd }: Readonly<{ onAdd: () => void }>) {
  return (
    <DesktopEmptyCard
      layout="center"
      title="Ainda sem dados pra mostrar"
      description="Registre algumas vendas e volte aqui para ver seus gráficos e os campeões de venda."
      action={{ label: "Adicionar venda", onPress: onAdd, icon: "add-circle-outline" }}
    />
  );
}
