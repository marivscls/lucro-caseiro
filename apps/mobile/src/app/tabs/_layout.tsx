import { useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // On Android the system navigation bar overlaps the tab bar; reserve its
  // height so the "+" button and labels are not hidden behind it. iOS already
  // accounts for the home indicator via the fixed values below.
  const bottomInset = Platform.OS === "android" ? insets.bottom : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: (Platform.OS === "ios" ? 82 : 58) + bottomInset,
          paddingBottom: (Platform.OS === "ios" ? 22 : 4) + bottomInset,
          paddingTop: 6,
          backgroundColor: theme.colors.surfaceElevated,
          borderTopWidth: 1,
          borderTopColor:
            theme.mode === "dark"
              ? "rgba(245, 225, 219, 0.10)"
              : "rgba(74, 50, 40, 0.08)",
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 14,
          fontWeight: "500",
        },
        tabBarIconStyle: { marginTop: 1 },
        tabBarItemStyle: { paddingVertical: 1 },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarLabel: "Início",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Vendas",
          tabBarLabel: "Vendas",
          tabBarIcon: ({ color }) => (
            <Ionicons name="receipt-outline" size={21} color={color} />
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
                borderRadius: 25,
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
          title: "Agenda",
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={21} color={color} />
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
            <Ionicons name="ellipsis-horizontal" size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
