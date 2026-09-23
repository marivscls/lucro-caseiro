import {
  controlSizes,
  iconSizes,
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
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBrandScreenPalette } from "../brand-palette";
import { useAuth } from "../hooks/use-auth";
import {
  floatingTabBarHeight,
  floatingTabBarBottomOffset,
  mobileTabBarSafeInset,
} from "../layout/floating-tab-bar";
import {
  mobileTabItems,
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

const TAB_ICONS = {
  index: House,
  sales: ShoppingBag,
  "new-sale": Plus,
  agenda: CalendarDays,
  clients: Users,
  more: Ellipsis,
} as const;

/** Shared mobile navigation for tab routes and stacked screens. */
export function MobileFloatingTabBar() {
  const { fontScale } = useWindowDimensions();
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
  const tabs = mobileTabItems(hasScheduling);
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
        },
      ]}
    >
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Navegação principal"
        style={[
          styles.bar,
          {
            minHeight: floatingTabBarHeight(fontScale),
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
            primary={tab.primary}
            label={tab.label}
            accessibilityLabel={tab.accessibilityLabel}
            icon={TAB_ICONS[tab.key]}
            onPress={() => {
              // navigate (não replace/push): a barra vive no root e aparece em
              // telas empilhadas. replace disparava REPLACE { name: "sales" }
              // num navigator que não tem essa rota.
              if (active !== tab.key) router.navigate(TAB_HREFS[tab.key]);
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
  accessibilityLabel,
  icon: Icon,
  onPress,
}: Readonly<{
  active: boolean;
  primary: boolean;
  label: string;
  accessibilityLabel: string;
  icon: typeof House;
  onPress: () => void;
}>) {
  const pal = useBrandScreenPalette();
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [focused, setFocused] = useState(false);
  const selected = active && !primary;
  let iconColor = pal.muted;
  if (primary) iconColor = pal.onWine;
  else if (selected) iconColor = pal.wine;
  const labelColor = primary || selected ? pal.wine : pal.muted;
  const borderColor = focused ? pal.wine : "transparent";

  const animateIcon = (to: number) => {
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => {
        if (!reducedMotion) animateIcon(0.96);
      }}
      onPressOut={() => {
        if (!reducedMotion) animateIcon(1);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.tabItem, { borderColor }]}
    >
      <Animated.View
        style={[
          primary
            ? [styles.primaryWell, { backgroundColor: pal.wineFill }]
            : styles.iconSlot,
          { transform: [{ scale }] },
        ]}
      >
        <Icon
          size={iconSizes.list}
          color={iconColor}
          strokeWidth={selected || primary ? 2 : 1.5}
        />
      </Animated.View>
      <Typography
        variant={active || primary ? "homeNavigationActive" : "homeNavigation"}
        color={labelColor}
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
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.xs / 2,
    borderRadius: radii.xl,
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
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: controlSizes.large,
    minWidth: controlSizes.large,
  },
  iconSlot: {
    alignItems: "center",
    height: controlSizes.compact,
    justifyContent: "center",
    width: controlSizes.compact,
  },
  primaryWell: {
    alignItems: "center",
    borderRadius: radii.full,
    height: controlSizes.compact,
    justifyContent: "center",
    width: controlSizes.compact,
  },
  tabLabel: { maxWidth: "100%", textAlign: "center" },
});
