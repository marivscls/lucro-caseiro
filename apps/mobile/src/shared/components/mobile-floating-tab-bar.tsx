import {
  radii,
  spacing,
  Typography,
  useFeature,
  useReducedMotion,
} from "@lucro-caseiro/ui";
import { type Href, usePathname, useRouter, useSegments } from "expo-router";
import {
  CalendarDays,
  Ellipsis,
  House,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react-native";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBrandScreenPalette } from "../brand-palette";
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

const TAB_HREFS: Record<MobileTabKey, Href> = {
  index: "/tabs",
  sales: "/tabs/sales",
  "new-sale": "/tabs/new-sale",
  agenda: "/tabs/agenda",
  clients: "/tabs/clients",
  more: "/tabs/more",
};

/** Shared mobile navigation for tab routes and stacked screens. */
export function MobileFloatingTabBar() {
  const insets = useSafeAreaInsets();
  const isDesktop = useDesktopLayout();
  const hasScheduling = useFeature("agendamento");
  const pal = useBrandScreenPalette();
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const rootSegment = String(segments[0] ?? "");
  const visible = shouldShowMobileTabBar({ isDesktop, isAuthenticated, rootSegment });

  if (!visible) return null;

  const active = resolveActiveMobileTab(pathname, hasScheduling);
  const bottomInset = mobileTabBarSafeInset(insets.bottom);
  const tabs: { key: MobileTabKey; label: string; icon: typeof House }[] = [
    { key: "index", label: "Início", icon: House },
    { key: "sales", label: "Vendas", icon: ShoppingBag },
    { key: "new-sale", label: "Nova venda", icon: Plus },
    hasScheduling
      ? { key: "agenda", label: "Agenda", icon: CalendarDays }
      : { key: "clients", label: "Clientes", icon: Users },
    { key: "more", label: "Mais", icon: Ellipsis },
  ];
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
        accessibilityLabel="Navegação principal"
        style={[
          styles.bar,
          {
            backgroundColor: pal.white,
            borderColor: pal.border,
            shadowColor: pal.wineFill,
          },
        ]}
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            active={active === tab.key}
            primary={tab.key === "new-sale"}
            label={tab.label}
            icon={tab.icon}
            onPress={() => {
              if (active !== tab.key) router.replace(TAB_HREFS[tab.key]);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function TabItem({
  active,
  primary,
  label,
  icon: Icon,
  onPress,
}: Readonly<{
  active: boolean;
  primary: boolean;
  label: string;
  icon: typeof House;
  onPress: () => void;
}>) {
  const pal = useBrandScreenPalette();
  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  let color = active ? pal.wine : pal.muted;
  if (primary) color = pal.onWine;
  const borderColor = focused || (primary && active) ? pal.rose : "transparent";

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => {
        let backgroundColor = active || pressed || hovered ? pal.softRose : "transparent";
        if (primary) backgroundColor = pal.wineFill;
        return [
          styles.tabItem,
          primary && styles.primaryItem,
          {
            backgroundColor,
            borderColor,
            opacity: primary && (pressed || hovered) ? 0.88 : 1,
            transform: [{ scale: pressed && !reducedMotion ? 0.96 : 1 }],
          },
        ];
      }}
    >
      <Icon size={22} color={color} strokeWidth={active || primary ? 2.2 : 1.8} />
      <Typography
        variant={active || primary ? "homeNavigationActive" : "homeNavigation"}
        color={color}
        numberOfLines={1}
        style={styles.tabLabel}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  host: {
    left: spacing.md,
    right: spacing.md,
    zIndex: 40,
    elevation: 20,
  },
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.xs / 2,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    elevation: 8,
    padding: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? spacing["2xl"] : spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabItem: {
    alignItems: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 0,
  },
  primaryItem: { flex: 1.4, minWidth: 80 },
  tabLabel: { maxWidth: "100%", textAlign: "center" },
});
