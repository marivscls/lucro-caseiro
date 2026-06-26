import {
  Button,
  Card,
  Typography,
  useTheme,
  spacing,
  radii,
  type Theme,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showAlert } from "../../../shared/components/alert-store";

interface PaywallProps {
  readonly title?: string;
  readonly message?: string;
  readonly currentUsage?: string;
  readonly onSubscribe?: (period: "monthly" | "annual") => void;
  readonly onRestore?: () => void;
  readonly loading?: boolean;
  readonly onClose?: () => void;
}

// Coluna esquerda + direita do checklist (ordem da imagem de referência).
const BENEFITS_LEFT = [
  "Vendas ilimitadas",
  "Produtos ilimitados",
  "Clientes ilimitados",
  "Receitas ilimitadas",
  "Embalagens e rótulos ilimitados",
];
const BENEFITS_RIGHT = [
  "Catálogo completo",
  "Relatórios completos com gráficos",
  "Exportar PDF e Excel",
  "Sem anúncios",
];

const MINI_FEATURES: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}> = [
  {
    icon: "stats-chart-outline",
    title: "Mais organização",
    subtitle: "para o seu negócio",
  },
  { icon: "people-outline", title: "Mais clientes", subtitle: "sem limitações" },
  { icon: "diamond-outline", title: "Mais crescimento", subtitle: "todos os dias" },
];

function cardBorder(theme: Theme): string {
  return theme.mode === "dark" ? "rgba(245, 225, 219, 0.11)" : "rgba(74, 50, 40, 0.1)";
}

function MiniFeature({
  icon,
  title,
  subtitle,
  theme,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  theme: Theme;
}>) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: spacing.xs }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.full,
          backgroundColor: theme.colors.premiumBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color={theme.colors.premium} />
      </View>
      <Typography
        variant="caption"
        color={theme.colors.text}
        style={{ fontWeight: "800", textAlign: "center", fontSize: 12 }}
      >
        {title}
      </Typography>
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ textAlign: "center", fontSize: 11, lineHeight: 14 }}
      >
        {subtitle}
      </Typography>
    </View>
  );
}

function BenefitItem({ text, theme }: Readonly<{ text: string; theme: Theme }>) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
      <Typography
        variant="body"
        color={theme.colors.text}
        numberOfLines={2}
        style={{ flex: 1, fontSize: 14 }}
      >
        {text}
      </Typography>
    </View>
  );
}

function PlanCard({
  selected,
  onPress,
  badge,
  badgeTone,
  label,
  price,
  period,
  note,
  theme,
}: Readonly<{
  selected: boolean;
  onPress: () => void;
  badge: string;
  badgeTone: "primary" | "success";
  label: string;
  price: string;
  period: string;
  note: string;
  theme: Theme;
}>) {
  const badgeBg = badgeTone === "success" ? theme.colors.success : theme.colors.surface;
  const badgeFg =
    badgeTone === "success" ? theme.colors.textOnPrimary : theme.colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        flex: 1,
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 2,
        borderColor: selected ? theme.colors.primary : cardBorder(theme),
        backgroundColor: selected
          ? `${theme.colors.primary}14`
          : theme.colors.surfaceElevated,
        alignItems: "center",
        gap: spacing.xs,
      }}
    >
      <View
        style={{
          backgroundColor: badgeBg,
          borderWidth: badgeTone === "primary" ? 1 : 0,
          borderColor: cardBorder(theme),
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radii.full,
          marginBottom: spacing.xs,
        }}
      >
        <Typography
          variant="caption"
          color={badgeFg}
          style={{ fontSize: 10, fontWeight: "800" }}
        >
          {badge}
        </Typography>
      </View>
      <Typography variant="bodyBold" color={theme.colors.textSecondary}>
        {label}
      </Typography>
      <Typography
        variant="moneyLg"
        color={theme.colors.text}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {price}
      </Typography>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        {period}
      </Typography>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginTop: spacing.xs,
        }}
      >
        <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ fontSize: 11 }}
        >
          {note}
        </Typography>
      </View>
    </Pressable>
  );
}

export function Paywall({
  title = "Limite atingido",
  message,
  currentUsage,
  onSubscribe,
  onRestore,
  loading = false,
  onClose,
}: PaywallProps) {
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");

  function handleSubscribe() {
    if (onSubscribe) onSubscribe(selectedPlan);
    else
      showAlert({
        title: "Em breve",
        message: "Assinatura será disponibilizada em breve.",
      });
  }

  function handleRestore() {
    if (onRestore) onRestore();
    else
      showAlert({
        title: "Em breve",
        message: "Restauração será disponibilizada em breve.",
      });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radii.full,
              backgroundColor: theme.colors.premiumBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="diamond" size={18} color={theme.colors.premium} />
          </View>
          <Typography variant="bodyBold" color={theme.colors.text}>
            Lucro Caseiro
          </Typography>
        </View>

        {/* Hero */}
        <Card
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderWidth: 1,
            borderColor: cardBorder(theme),
            alignItems: "center",
            gap: spacing.md,
            paddingVertical: spacing.xl,
          }}
        >
          <View
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: cardBorder(theme),
            }}
          >
            <Typography
              variant="caption"
              color={theme.colors.premium}
              style={{ fontWeight: "800", letterSpacing: 1, fontSize: 11 }}
            >
              DESBLOQUEIE SEU POTENCIAL
            </Typography>
          </View>

          <Typography
            variant="display"
            color={theme.colors.text}
            style={{ textAlign: "center" }}
          >
            {title}
          </Typography>

          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center", maxWidth: 320 }}
          >
            {message ??
              "Continue crescendo sem limites e leve seu negócio ainda mais longe."}
          </Typography>

          {currentUsage ? (
            <Typography
              variant="caption"
              color={theme.colors.premium}
              style={{ textAlign: "center" }}
            >
              {currentUsage}
            </Typography>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              marginTop: spacing.sm,
              alignSelf: "stretch",
            }}
          >
            {MINI_FEATURES.map((f) => (
              <MiniFeature
                key={f.title}
                icon={f.icon}
                title={f.title}
                subtitle={f.subtitle}
                theme={theme}
              />
            ))}
          </View>
        </Card>

        {/* Benefits */}
        <Card
          style={{
            borderWidth: 1,
            borderColor: cardBorder(theme),
            gap: spacing.lg,
          }}
        >
          <Typography
            variant="h3"
            color={theme.colors.text}
            style={{ textAlign: "center" }}
          >
            Tudo que o Premium oferece para você
          </Typography>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1, gap: spacing.md }}>
              {BENEFITS_LEFT.map((b) => (
                <BenefitItem key={b} text={b} theme={theme} />
              ))}
            </View>
            <View style={{ flex: 1, gap: spacing.md }}>
              {BENEFITS_RIGHT.map((b) => (
                <BenefitItem key={b} text={b} theme={theme} />
              ))}
            </View>
          </View>
        </Card>

        {/* Plans */}
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <PlanCard
            selected={selectedPlan === "monthly"}
            onPress={() => setSelectedPlan("monthly")}
            badge="MAIS ESCOLHIDO"
            badgeTone="primary"
            label="Mensal"
            price="R$ 19,90"
            period="/mês"
            note="Cancele quando quiser"
            theme={theme}
          />
          <PlanCard
            selected={selectedPlan === "annual"}
            onPress={() => setSelectedPlan("annual")}
            badge="-16%"
            badgeTone="success"
            label="Anual"
            price="R$ 199,90"
            period="/ano"
            note="Melhor custo-benefício"
            theme={theme}
          />
        </View>

        {/* Trial */}
        <Card
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            borderWidth: 1,
            borderColor: cardBorder(theme),
          }}
        >
          <Ionicons name="gift-outline" size={24} color={theme.colors.premium} />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold" color={theme.colors.text}>
              7 dias grátis para experimentar.
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Cancele quando quiser, sem compromisso.
            </Typography>
          </View>
        </Card>

        {/* Actions */}
        <View style={{ gap: spacing.sm, paddingBottom: spacing.md }}>
          <Button
            title="Desbloquear Premium"
            variant="premium"
            size="lg"
            loading={loading}
            onPress={handleSubscribe}
            icon={<Ionicons name="star" size={18} color="#FFFFFF" />}
          />

          <Pressable
            onPress={handleRestore}
            accessibilityRole="button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.xs,
              paddingVertical: spacing.sm,
            }}
          >
            <Ionicons name="refresh" size={16} color={theme.colors.primary} />
            <Typography variant="caption" color={theme.colors.primary}>
              Restaurar compra anterior
            </Typography>
          </Pressable>

          {onClose ? (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={{ alignItems: "center", paddingVertical: spacing.sm }}
            >
              <Typography variant="body" color={theme.colors.textSecondary}>
                Agora não
              </Typography>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
