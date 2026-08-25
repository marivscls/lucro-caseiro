import { useFeature, useTheme } from "@lucro-caseiro/ui";
import { Tabs } from "expo-router";
import React from "react";

/**
 * A navbar flutuante vive no root (`MobileFloatingTabBar`) para aparecer
 * também nas telas empilhadas. Aqui só restam as rotas das tabs.
 */
export default function TabLayout() {
  const hasScheduling = useFeature("agendamento");
  const { theme } = useTheme();

  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none", height: 0 },
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="sales" options={{ title: "Vendas" }} />
      <Tabs.Screen name="finance" options={{ href: null, title: "Financeiro" }} />
      <Tabs.Screen name="materials" options={{ href: null, title: "Insumos" }} />
      <Tabs.Screen name="new-sale" options={{ title: "Nova venda" }} />
      <Tabs.Screen
        name="agenda"
        options={{
          href: hasScheduling ? undefined : null,
          title: "Agenda",
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: hasScheduling ? null : undefined,
          title: "Clientes",
        }}
      />
      <Tabs.Screen name="more" options={{ title: "Mais" }} />
    </Tabs>
  );
}
