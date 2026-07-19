import {
  Card,
  fontSizes,
  iconSizes,
  Typography,
  useBrand,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../shared/components/app-icon";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { avatarPastel } from "../../features/clients/components/avatar-colors";
import { useProfile } from "../../features/subscription/hooks";
import { useAdminAnalyticsAccess } from "../../features/analytics/hooks";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";

// Destaque no topo do "Mais" (ADR-0006): funções de uso diário que perderam
// atalho na tab bar (Clientes) ou que merecem acesso rápido (Financeiro,
// Fiado) ficam em evidência antes da lista comum.
const dailyItems = [
  {
    title: "Financeiro",
    description: "Entradas, saídas e lucro",
    icon: "wallet-outline" as const,
    route: "/finance" as const,
  },
  {
    title: "Fiado",
    description: "Quem te deve e cobrança",
    icon: "cash-outline" as const,
    route: "/fiado" as const,
  },
  {
    title: "Clientes",
    description: "Contatos e aniversários",
    icon: "people-outline" as const,
    route: "/tabs/clients" as const,
  },
];

const menuItems = [
  {
    title: "Operação da Papelaria",
    description: "PDV, caixa, listas, inventário e serviços",
    icon: "storefront-outline" as const,
    route: "/retail" as const,
    feature: "varejoPapelaria" as const,
  },
  {
    title: "Gastos fixos",
    description: "Custos mensais no automático",
    icon: "repeat-outline" as const,
    route: "/recurring-expenses" as const,
  },
  {
    title: "Orçamentos",
    description: "Monte, envie e aprove propostas",
    icon: "reader-outline" as const,
    route: "/quotes" as const,
  },
  {
    title: "Produtos",
    description: "Seus produtos e estoque",
    icon: "cube-outline" as const,
    route: "/products" as const,
  },
  {
    title: "Catálogo online",
    description: "Link para compartilhar com clientes",
    icon: "storefront-outline" as const,
    route: "/catalog" as const,
  },
  {
    title: "Insumos",
    description: "Matéria-prima e estoque",
    icon: "flask-outline" as const,
    route: "/materials" as const,
    feature: "materiais" as const,
  },
  {
    title: "Fornecedores",
    description: "De quem você compra",
    icon: "business-outline" as const,
    route: "/suppliers" as const,
  },
  {
    title: "Compras",
    description: "Contas a pagar e gastos",
    icon: "cart-outline" as const,
    route: "/purchases" as const,
  },
  {
    title: "Receitas",
    description: "Suas receitas e ingredientes",
    icon: "document-text-outline" as const,
    route: "/recipes" as const,
    feature: "fichaTecnica" as const,
  },
  {
    title: "Precificação",
    description: "Calcule o preço ideal",
    icon: "calculator-outline" as const,
    route: "/pricing" as const,
  },
  {
    title: "Embalagens",
    description: "Suas embalagens",
    icon: "gift-outline" as const,
    route: "/packaging" as const,
    feature: "embalagens" as const,
  },
  {
    title: "Etiquetas",
    description: "Etiquetas prontas para imprimir",
    icon: "pricetag-outline" as const,
    route: "/labels" as const,
  },
  {
    title: "Configurações",
    description: "Perfil e assinatura",
    icon: "settings-outline" as const,
    route: "/settings" as const,
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const brand = useBrand();
  const { width } = useWindowDimensions();
  const isDesktop = useDesktopLayout();
  const { data: profile } = useProfile();
  const { data: adminAccess } = useAdminAnalyticsAccess();

  const userName = profile?.name ?? "Minha conta";
  const businessName = profile?.businessName ?? "Ver perfil e assinatura";
  const avatarTint = avatarPastel(userName || "?", theme.mode);
  const usesGrid = width >= 700;
  const contentWidth = Math.min(width - spacing.xl * 2, 1280);
  const gridColumns = Math.max(
    1,
    Math.min(4, Math.floor((contentWidth + spacing.md) / (280 + spacing.md))),
  );
  const dailyColumns = Math.min(gridColumns, dailyItems.length);
  const dailyCardStyle = usesGrid
    ? { width: (contentWidth - spacing.md * (dailyColumns - 1)) / dailyColumns }
    : { width: "100%" as const };
  const menuCardStyle = usesGrid
    ? { width: (contentWidth - spacing.md * (gridColumns - 1)) / gridColumns }
    : { width: "100%" as const };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 1280, gap: spacing.md }}>
          {!isDesktop && (
            <Typography variant="h1" style={{ marginBottom: spacing.sm }}>
              Mais opções
            </Typography>
          )}

          {/* Account header */}
          <Card variant="elevated" onPress={() => router.push("/settings")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radii.full,
                  backgroundColor: avatarTint.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {profile?.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    style={{ width: 48, height: 48 }}
                  />
                ) : (
                  <Typography variant="h3" color={avatarTint.fg}>
                    {userName.charAt(0).toUpperCase()}
                  </Typography>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="h3">{userName}</Typography>
                <Typography
                  variant="body"
                  color={theme.colors.textSecondary}
                  style={{ fontSize: fontSizes.sm }}
                >
                  {businessName}
                </Typography>
              </View>
              <AppIcon
                name="chevron-forward"
                size={iconSizes.sm}
                color={theme.colors.textSecondary}
              />
            </View>
          </Card>

          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{
              marginTop: spacing.sm,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Do dia a dia
          </Typography>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.md,
            }}
          >
            {dailyItems.map((item) => (
              <Card
                key={item.title}
                variant="elevated"
                onPress={() => router.push(item.route)}
                style={dailyCardStyle}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    minHeight: 56,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radii.lg,
                      backgroundColor: theme.colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppIcon
                      name={item.icon}
                      size={iconSizes.md}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="h3" style={{ fontSize: fontSizes.lg }}>
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body"
                      color={theme.colors.textSecondary}
                      style={{ fontSize: fontSizes.sm }}
                    >
                      {item.description}
                    </Typography>
                  </View>
                  <AppIcon
                    name="chevron-forward"
                    size={iconSizes.md}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </Card>
            ))}
          </View>

          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{
              marginTop: spacing.sm,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Tudo
          </Typography>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.md,
            }}
          >
            {[
              ...menuItems
                .filter(
                  (item) =>
                    !("feature" in item) || !item.feature || brand.features[item.feature],
                )
                .map((item) =>
                  item.route === "/labels"
                    ? { ...item, title: brand.copy.labelsLabel }
                    : item,
                ),
              ...(adminAccess?.allowed
                ? [
                    {
                      title: "Métricas do produto",
                      description: "Instalação, ativação e retenção",
                      icon: "analytics-outline" as const,
                      route: "/admin-metrics" as const,
                    },
                  ]
                : []),
            ].map((item) => (
              <Card
                key={item.title}
                variant="elevated"
                onPress={() => router.push(item.route)}
                style={menuCardStyle}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radii.md,
                      backgroundColor: theme.colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppIcon
                      name={item.icon}
                      size={iconSizes.md}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="h3">{item.title}</Typography>
                    <Typography
                      variant="body"
                      color={theme.colors.textSecondary}
                      style={{ fontSize: fontSizes.sm }}
                    >
                      {item.description}
                    </Typography>
                  </View>
                  <AppIcon
                    name="chevron-forward"
                    size={iconSizes.sm}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
