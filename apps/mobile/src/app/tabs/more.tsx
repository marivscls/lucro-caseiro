import { Card, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfile } from "../../features/subscription/hooks";

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
  },
  {
    title: "Rótulos",
    description: "Rótulos para seus produtos",
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
  const { data: profile } = useProfile();

  const userName = profile?.name ?? "Minha conta";
  const businessName = profile?.businessName ?? "Ver perfil e assinatura";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <Typography variant="h1" style={{ marginBottom: spacing.sm }}>
          Mais opções
        </Typography>

        {/* Account header */}
        <Card onPress={() => router.push("/settings")}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radii.full,
                backgroundColor: theme.colors.primary,
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
                <Typography variant="h3" color={theme.colors.textOnPrimary}>
                  {userName.charAt(0).toUpperCase()}
                </Typography>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="h3">{userName}</Typography>
              <Typography
                variant="body"
                color={theme.colors.textSecondary}
                style={{ fontSize: 14 }}
              >
                {businessName}
              </Typography>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
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

        {dailyItems.map((item) => (
          <Card key={item.title} onPress={() => router.push(item.route)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                minHeight: 56,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "rgba(196, 112, 126, 0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={item.icon} size={28} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="h3" style={{ fontSize: 18 }}>
                  {item.title}
                </Typography>
                <Typography
                  variant="body"
                  color={theme.colors.textSecondary}
                  style={{ fontSize: 14 }}
                >
                  {item.description}
                </Typography>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={theme.colors.textSecondary}
              />
            </View>
          </Card>
        ))}

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

        {menuItems.map((item) => (
          <Card key={item.title} onPress={() => router.push(item.route)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: theme.colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="h3">{item.title}</Typography>
                <Typography
                  variant="body"
                  color={theme.colors.textSecondary}
                  style={{ fontSize: 14 }}
                >
                  {item.description}
                </Typography>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
