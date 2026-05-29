import { Card, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfile } from "../../features/subscription/hooks";

const menuItems = [
  {
    title: "Agenda",
    description: "Encomendas e entregas",
    icon: "calendar-outline" as const,
    route: "/agenda" as const,
  },
  {
    title: "Financeiro",
    description: "Entradas, saídas e lucro",
    icon: "wallet-outline" as const,
    route: "/finance" as const,
  },
  {
    title: "Produtos",
    description: "Seu catálogo",
    icon: "cube-outline" as const,
    route: "/products" as const,
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
              }}
            >
              <Typography variant="h3" color={theme.colors.textOnPrimary}>
                {userName.charAt(0).toUpperCase()}
              </Typography>
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="h3">{userName}</Typography>
              <Typography variant="caption">{businessName}</Typography>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textSecondary}
            />
          </View>
        </Card>

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
                <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="h3">{item.title}</Typography>
                <Typography variant="caption">{item.description}</Typography>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
