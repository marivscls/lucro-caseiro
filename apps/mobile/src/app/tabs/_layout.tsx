import { Typography, useFeature, useTheme } from "@lucro-caseiro/ui";
import { Tabs } from "expo-router";
import {
  CalendarDays,
  Ellipsis,
  House,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FLOATING_TAB_BAR_HEIGHT,
  floatingTabBarBottomOffset,
} from "../../shared/layout/floating-tab-bar";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";

function TabLabel({
  active,
  children,
  color,
}: Readonly<{ active: boolean; children: string; color: string }>) {
  return (
    <Typography
      variant={active ? "homeNavigationActive" : "homeNavigation"}
      color={color}
      numberOfLines={1}
      style={styles.tabLabel}
    >
      {children}
    </Typography>
  );
}

function TabIcon({
  active,
  children,
}: Readonly<{ active: boolean; children: React.ReactNode }>) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.tabIcon,
        active ? { backgroundColor: theme.colors.primaryBg } : undefined,
      ]}
    >
      {children}
    </View>
  );
}

function NewSaleIcon() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.newSaleButton,
        {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.surfaceElevated,
          shadowColor: theme.shadows.md.shadowColor,
          shadowOffset: theme.shadows.md.shadowOffset,
          shadowOpacity: theme.shadows.md.shadowOpacity,
          shadowRadius: theme.shadows.md.shadowRadius,
        },
      ]}
    >
      <Plus size={26} color="#FFFFFF" strokeWidth={2.1} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isDesktop = useDesktopLayout();
  const hasScheduling = useFeature("agendamento");
  const { theme } = useTheme();

  const bottomInset = Platform.OS === "android" ? insets.bottom : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isDesktop
          ? { display: "none" }
          : {
              // O inset afasta a superficie da navegacao do Android sem aumentar
              // a altura visual da tab bar nem desenha-la por tras do sistema.
              bottom: floatingTabBarBottomOffset(bottomInset),
              height: FLOATING_TAB_BAR_HEIGHT,
              left: 12,
              paddingBottom: Platform.OS === "ios" ? 14 : 5,
              paddingHorizontal: 6,
              paddingTop: 5,
              position: "absolute",
              right: 12,
              width: "auto",
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              borderRadius: 28,
              borderTopWidth: 1,
              borderWidth: 1,
              elevation: 8,
              shadowColor: theme.shadows.md.shadowColor,
              shadowOffset: theme.shadows.md.shadowOffset,
              shadowOpacity: theme.shadows.md.shadowOpacity,
              shadowRadius: theme.shadows.md.shadowRadius,
            },
        tabBarIconStyle: { marginTop: 2 },
        tabBarItemStyle: styles.tabItem,
        tabBarActiveBackgroundColor: "transparent",
        tabBarActiveTintColor: theme.colors.primaryStrong,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarLabel: ({ color, focused }) => (
            <TabLabel active={focused} color={color}>
              Início
            </TabLabel>
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused}>
              <House size={23} color={color} strokeWidth={1.9} />
            </TabIcon>
          ),
          tabBarItemStyle: [styles.tabItem, styles.homeItem],
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Vendas",
          tabBarLabel: ({ color, focused }) => (
            <TabLabel active={focused} color={color}>
              Vendas
            </TabLabel>
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused}>
              <ShoppingBag size={23} color={color} strokeWidth={1.9} />
            </TabIcon>
          ),
          tabBarItemStyle: [styles.tabItem, styles.salesItem],
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          href: null,
          title: "Financeiro",
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          href: null,
          title: "Insumos",
        }}
      />
      <Tabs.Screen
        name="new-sale"
        options={{
          title: "Nova venda",
          tabBarLabel: ({ color, focused }) => (
            <TabLabel active={focused} color={color}>
              Nova venda
            </TabLabel>
          ),
          tabBarIcon: () => <NewSaleIcon />,
          tabBarItemStyle: [styles.tabItem, styles.newSaleItem],
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          href: hasScheduling ? undefined : null,
          title: "Agenda",
          tabBarLabel: ({ color, focused }) => (
            <TabLabel active={focused} color={color}>
              Agenda
            </TabLabel>
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused}>
              <CalendarDays size={23} color={color} strokeWidth={1.9} />
            </TabIcon>
          ),
          tabBarItemStyle: [styles.tabItem, styles.agendaItem],
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: hasScheduling ? null : undefined,
          title: "Clientes",
          tabBarLabel: ({ color, focused }) => (
            <TabLabel active={focused} color={color}>
              Clientes
            </TabLabel>
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused}>
              <Users size={23} color={color} strokeWidth={1.9} />
            </TabIcon>
          ),
          tabBarItemStyle: [styles.tabItem, styles.agendaItem],
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Mais",
          tabBarLabel: ({ color, focused }) => (
            <TabLabel active={focused} color={color}>
              Mais
            </TabLabel>
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused}>
              <Ellipsis size={25} color={color} strokeWidth={2.2} />
            </TabIcon>
          ),
          tabBarItemStyle: styles.tabItem,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  agendaItem: {
    flex: 1.1,
  },
  homeItem: {
    flex: 0.9,
  },
  newSaleItem: {
    flex: 1.4,
  },
  salesItem: {
    flex: 1,
  },
  tabItem: {
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 2,
    minWidth: 0,
    overflow: "visible",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  tabIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 34,
    justifyContent: "center",
    width: 44,
  },
  newSaleButton: {
    alignItems: "center",
    borderRadius: 26,
    borderWidth: 3,
    elevation: 4,
    height: 52,
    justifyContent: "center",
    marginTop: -12,
    width: 52,
  },
  tabLabel: {
    marginBottom: 3,
    maxWidth: "100%",
    textAlign: "center",
  },
});
