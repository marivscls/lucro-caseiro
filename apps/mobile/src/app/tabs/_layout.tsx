import { useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarLabel: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Vendas",
          tabBarLabel: "Vendas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-sale"
        options={{
          title: "",
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: Platform.OS === "ios" ? 20 : 24,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 3,
                  backgroundColor: theme.colors.textOnPrimary,
                  borderRadius: 2,
                  position: "absolute",
                }}
              />
              <View
                style={{
                  width: 3,
                  height: 24,
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
        name="clients"
        options={{
          title: "Clientes",
          tabBarLabel: "Clientes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Mais",
          tabBarLabel: "Mais",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
