import { radii, Typography, useFeature, useTheme } from "@lucro-caseiro/ui";
import { type Href, usePathname, useRouter, useSegments } from "expo-router";
import {
  CalendarDays,
  Ellipsis,
  House,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../hooks/use-auth";
import {
  FLOATING_TAB_BAR_HEIGHT,
  floatingTabBarBottomOffset,
  mobileTabBarSafeInset,
} from "../layout/floating-tab-bar";
import {
  resolveActiveMobileTab,
  shouldShowMobileTabBar,
  type MobileTabKey,
} from "../layout/mobile-tab-bar";
import { useDesktopLayout } from "../layout/use-desktop-layout";

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

const TAB_HREFS: Record<MobileTabKey, Href> = {
  index: "/tabs",
  sales: "/tabs/sales",
  "new-sale": "/tabs/new-sale",
  agenda: "/tabs/agenda",
  clients: "/tabs/clients",
  more: "/tabs/more",
};

/**
 * Navbar flutuante do modo celular. Fica no root para aparecer também nas
 * telas empilhadas (Produtos, Catálogo, Conheça também…), não só nas tabs.
 */
export function MobileFloatingTabBar() {
  const insets = useSafeAreaInsets();
  const isDesktop = useDesktopLayout();
  const hasScheduling = useFeature("agendamento");
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const rootSegment = String(segments[0] ?? "");
  const visible = shouldShowMobileTabBar({
    isDesktop,
    isAuthenticated,
    rootSegment,
  });

  if (!visible) return null;

  const active = resolveActiveMobileTab(pathname, hasScheduling);
  const bottomInset = mobileTabBarSafeInset(insets.bottom);
  const secondaryKey: MobileTabKey = hasScheduling ? "agenda" : "clients";
  const secondaryLabel = hasScheduling ? "Agenda" : "Clientes";

  function goTo(key: MobileTabKey) {
    if (active === key) return;
    router.replace(TAB_HREFS[key]);
  }

  const hostPosition: ViewStyle =
    Platform.OS === "web"
      ? ({ position: "fixed" } as unknown as ViewStyle)
      : { position: "absolute" };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        hostPosition,
        {
          bottom: floatingTabBarBottomOffset(bottomInset),
          height: FLOATING_TAB_BAR_HEIGHT,
        },
      ]}
    >
      <View
        accessibilityRole="tablist"
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            shadowColor: theme.shadows.md.shadowColor,
            shadowOffset: theme.shadows.md.shadowOffset,
            shadowOpacity: theme.shadows.md.shadowOpacity,
            shadowRadius: theme.shadows.md.shadowRadius,
          },
        ]}
      >
        <TabItem
          active={active === "index"}
          color={
            active === "index" ? theme.colors.primaryStrong : theme.colors.textSecondary
          }
          label="Início"
          itemStyle={styles.homeItem}
          onPress={() => goTo("index")}
          icon={
            <TabIcon active={active === "index"}>
              <House
                size={23}
                color={
                  active === "index"
                    ? theme.colors.primaryStrong
                    : theme.colors.textSecondary
                }
                strokeWidth={1.9}
              />
            </TabIcon>
          }
        />
        <TabItem
          active={active === "sales"}
          color={
            active === "sales" ? theme.colors.primaryStrong : theme.colors.textSecondary
          }
          label="Vendas"
          itemStyle={styles.salesItem}
          onPress={() => goTo("sales")}
          icon={
            <TabIcon active={active === "sales"}>
              <ShoppingBag
                size={23}
                color={
                  active === "sales"
                    ? theme.colors.primaryStrong
                    : theme.colors.textSecondary
                }
                strokeWidth={1.9}
              />
            </TabIcon>
          }
        />
        <TabItem
          active={active === "new-sale"}
          color={
            active === "new-sale"
              ? theme.colors.primaryStrong
              : theme.colors.textSecondary
          }
          label="Nova venda"
          itemStyle={styles.newSaleItem}
          onPress={() => goTo("new-sale")}
          icon={<NewSaleIcon />}
        />
        <TabItem
          active={active === secondaryKey}
          color={
            active === secondaryKey
              ? theme.colors.primaryStrong
              : theme.colors.textSecondary
          }
          label={secondaryLabel}
          itemStyle={styles.agendaItem}
          onPress={() => goTo(secondaryKey)}
          icon={
            <TabIcon active={active === secondaryKey}>
              {hasScheduling ? (
                <CalendarDays
                  size={23}
                  color={
                    active === secondaryKey
                      ? theme.colors.primaryStrong
                      : theme.colors.textSecondary
                  }
                  strokeWidth={1.9}
                />
              ) : (
                <Users
                  size={23}
                  color={
                    active === secondaryKey
                      ? theme.colors.primaryStrong
                      : theme.colors.textSecondary
                  }
                  strokeWidth={1.9}
                />
              )}
            </TabIcon>
          }
        />
        <TabItem
          active={active === "more"}
          color={
            active === "more" ? theme.colors.primaryStrong : theme.colors.textSecondary
          }
          label="Mais"
          onPress={() => goTo("more")}
          icon={
            <TabIcon active={active === "more"}>
              <Ellipsis
                size={25}
                color={
                  active === "more"
                    ? theme.colors.primaryStrong
                    : theme.colors.textSecondary
                }
                strokeWidth={2.2}
              />
            </TabIcon>
          }
        />
      </View>
    </View>
  );
}

function TabItem({
  active,
  color,
  label,
  icon,
  onPress,
  itemStyle,
}: Readonly<{
  active: boolean;
  color: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  itemStyle?: object;
}>) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabItem,
        itemStyle,
        { opacity: pressed ? 0.72 : 1 },
      ]}
    >
      {icon}
      <TabLabel active={active} color={color}>
        {label}
      </TabLabel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  host: {
    left: 12,
    right: 12,
    overflow: "visible",
    zIndex: 40,
    elevation: 20,
  },
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "visible",
    borderRadius: 28,
    borderWidth: 1,
    elevation: 8,
    paddingBottom: Platform.OS === "ios" ? 14 : 5,
    paddingHorizontal: 6,
    paddingTop: 5,
  },
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
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 2,
    minWidth: 0,
    overflow: "visible",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  tabIcon: {
    alignItems: "center",
    borderRadius: radii.full,
    height: 36,
    justifyContent: "center",
    overflow: "hidden",
    width: 36,
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
