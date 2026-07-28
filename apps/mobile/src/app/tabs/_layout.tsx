import { Typography, fontSizes, fonts, useFeature, useTheme } from "@lucro-caseiro/ui";
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

function TabLabel({ children, color }: Readonly<{ children: string; color: string }>) {
  return (
    <Typography
      variant="captionBold"
      color={color}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.78}
      style={styles.tabLabel}
    >
      {children}
    </Typography>
  );
}

function NewSaleIcon({ color }: Readonly<{ color: string }>) {
  const { theme } = useTheme();

  return (
    <View>
      <ShoppingBag size={23} color={color} strokeWidth={1.9} />
      <View
        style={[styles.plusBadge, { backgroundColor: theme.colors.primaryInteractive }]}
      >
        <Plus size={12} color={theme.colors.textOnPrimary} strokeWidth={2.2} />
      </View>
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
              borderRadius: 24,
              borderTopWidth: 1,
              borderWidth: 1,
              elevation: 8,
              shadowColor: theme.shadows.md.shadowColor,
              shadowOffset: theme.shadows.md.shadowOffset,
              shadowOpacity: theme.shadows.md.shadowOpacity,
              shadowRadius: theme.shadows.md.shadowRadius,
            },
        tabBarLabelStyle: {
          // Piso de 13px (publico com idosos): nunca abaixo de fontSizes.xs.
          fontSize: fontSizes.xs,
          lineHeight: 17,
          fontFamily: fonts.semiBold,
          marginBottom: 3,
        },
        tabBarIconStyle: { marginTop: 3 },
        tabBarItemStyle: {
          borderRadius: 20,
          flex: 1,
          marginHorizontal: 2,
          minWidth: 0,
          overflow: "hidden",
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
        tabBarActiveBackgroundColor: theme.colors.primaryBg,
        tabBarActiveTintColor: theme.colors.primaryStrong,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarLabel: ({ color }) => <TabLabel color={color}>Início</TabLabel>,
          tabBarIcon: ({ color }) => <House size={23} color={color} strokeWidth={1.9} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Vendas",
          tabBarLabel: ({ color }) => <TabLabel color={color}>Vendas</TabLabel>,
          tabBarIcon: ({ color }) => (
            <ShoppingBag size={23} color={color} strokeWidth={1.9} />
          ),
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
        name="new-sale"
        options={{
          title: "Nova venda",
          tabBarLabel: ({ color }) => <TabLabel color={color}>Nova venda</TabLabel>,
          tabBarIcon: ({ color }) => <NewSaleIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          href: hasScheduling ? undefined : null,
          title: "Agenda",
          tabBarLabel: ({ color }) => <TabLabel color={color}>Agenda</TabLabel>,
          tabBarIcon: ({ color }) => (
            <CalendarDays size={23} color={color} strokeWidth={1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: hasScheduling ? null : undefined,
          title: "Clientes",
          tabBarLabel: ({ color }) => <TabLabel color={color}>Clientes</TabLabel>,
          tabBarIcon: ({ color }) => <Users size={23} color={color} strokeWidth={1.9} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Mais",
          tabBarLabel: ({ color }) => <TabLabel color={color}>Mais</TabLabel>,
          tabBarIcon: ({ color }) => (
            <View style={[styles.moreIcon, { backgroundColor: theme.colors.surface }]}>
              <Ellipsis size={25} color={color} strokeWidth={2.2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  moreIcon: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    height: 36,
    marginBottom: 4,
    width: 36,
  },
  plusBadge: {
    alignItems: "center",
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    position: "absolute",
    right: -8,
    top: -6,
    width: 18,
  },
  tabLabel: {
    fontSize: fontSizes.xs,
    lineHeight: 17,
    marginBottom: 3,
    maxWidth: "100%",
    textAlign: "center",
  },
});
