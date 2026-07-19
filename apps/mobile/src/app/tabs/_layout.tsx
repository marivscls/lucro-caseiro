import { fontSizes, fonts, radii, useFeature, useTheme } from "@lucro-caseiro/ui";
import { AppIcon } from "../../shared/components/app-icon";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDesktop = useDesktopLayout();
  const hasScheduling = useFeature("agendamento");

  // On Android the system navigation bar overlaps the tab bar; reserve its
  // height so the "+" button and labels are not hidden behind it. iOS already
  // accounts for the home indicator via the fixed values below.
  const bottomInset = Platform.OS === "android" ? insets.bottom : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isDesktop
          ? { display: "none" }
          : {
              // Icone+label centralizados como um bloco: paddings simetricos e o
              // inset do Android fica FORA do conteudo (senao o label cola na
              // barra de gestos do sistema).
              height: (Platform.OS === "ios" ? 82 : 66) + bottomInset,
              paddingBottom: (Platform.OS === "ios" ? 18 : 5) + bottomInset,
              paddingTop: 7,
              backgroundColor: theme.colors.surfaceElevated,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              elevation: 0,
              shadowOpacity: 0,
            },
        tabBarLabelStyle: {
          // Piso de 13px (publico com idosos): nunca abaixo de fontSizes.xs.
          fontSize: fontSizes.xs,
          lineHeight: 17,
          fontFamily: fonts.semiBold,
        },
        tabBarIconStyle: { marginTop: 0 },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
        tabBarActiveTintColor: theme.colors.primaryStrong,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarLabel: "Início",
          tabBarIcon: ({ color }) => (
            <AppIcon name="home-outline" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Vendas",
          tabBarLabel: "Vendas",
          tabBarIcon: ({ color }) => (
            <AppIcon name="receipt-outline" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-sale"
        options={{
          title: "Nova venda",
          tabBarLabel: () => null,
          tabBarAccessibilityLabel: "Nova venda",
          tabBarIcon: () => (
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: radii.full,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: Platform.OS === "ios" ? 20 : 28,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.16,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 2.5,
                  backgroundColor: theme.colors.textOnPrimary,
                  borderRadius: 2,
                  position: "absolute",
                }}
              />
              <View
                style={{
                  width: 2.5,
                  height: 22,
                  backgroundColor: theme.colors.textOnPrimary,
                  borderRadius: 2,
                  position: "absolute",
                }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          href: hasScheduling ? undefined : null,
          title: "Agenda",
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color }) => (
            <AppIcon name="calendar-outline" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          // Clientes sai da tab bar (ADR-0006): acessível via "Mais" e atalhos
          // da home, mas a rota /tabs/clients continua funcionando.
          href: null,
          title: "Clientes",
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Mais",
          tabBarLabel: "Mais",
          tabBarIcon: ({ color }) => (
            <AppIcon name="ellipsis-horizontal" size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
