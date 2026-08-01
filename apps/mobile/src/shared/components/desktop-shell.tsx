import type { BrandFeatures } from "@lucro-caseiro/brands";
import { fonts, radii, spacing, Typography, useBrand, useTheme } from "@lucro-caseiro/ui";
import { AppIcon } from "./app-icon";
import type { AppIconName } from "./app-icon";
import { type Href, usePathname, useRouter } from "expo-router";
import React, { type ReactNode } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

import { useProfile } from "../../features/subscription/hooks";
import { businessCopyFor } from "../../features/subscription/business-copy";
import { brandLogoByMode } from "../brand-logo";
import { getBrandDisplayName } from "../brand-name";

type IconName = AppIconName;
type NavigationItem = {
  label: string;
  href: string;
  icon: IconName;
  feature?: keyof BrandFeatures;
};

const PRIMARY_NAV: ReadonlyArray<NavigationItem> = [
  { label: "Início", href: "/tabs", icon: "home-outline" },
  { label: "Vendas", href: "/tabs/sales", icon: "receipt-outline" },
  { label: "Nova venda", href: "/tabs/new-sale", icon: "add-circle-outline" },
  {
    label: "Agenda",
    href: "/tabs/agenda",
    icon: "calendar-outline",
    feature: "agendamento",
  },
  { label: "Clientes", href: "/tabs/clients", icon: "people-outline" },
];

const MANAGEMENT_NAV: ReadonlyArray<NavigationItem> = [
  {
    label: "Operação",
    href: "/retail",
    icon: "storefront-outline",
    feature: "varejoPapelaria",
  },
  { label: "Produtos", href: "/products", icon: "cube-outline" },
  { label: "Serviços", href: "/services", icon: "briefcase-outline" },
  {
    label: "Insumos",
    href: "/materials",
    icon: "leaf-outline",
    feature: "materiais",
  },
  { label: "Precificação", href: "/pricing", icon: "calculator-outline" },
  { label: "Financeiro", href: "/tabs/finance", icon: "wallet-outline" },
  { label: "Mais opções", href: "/tabs/more", icon: "grid-outline" },
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/tabs") return pathname === "/tabs" || pathname === "/tabs/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarItem({ label, href, icon }: Readonly<NavigationItem>) {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const active = isActiveRoute(pathname, href);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      onPress={() => router.push(href as Href)}
      style={({ pressed }) => ({
        minHeight: 46,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        backgroundColor: active ? theme.colors.primaryBg : "transparent",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <AppIcon
        name={icon}
        size={21}
        color={active ? theme.colors.primary : theme.colors.textSecondary}
      />
      <Typography
        variant="body"
        color={active ? theme.colors.primary : theme.colors.text}
        style={{ fontFamily: active ? fonts.bold : fonts.semiBold }}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function SidebarSection({
  title,
  items,
}: Readonly<{
  title: string;
  items: ReadonlyArray<NavigationItem>;
}>) {
  const { theme } = useTheme();
  const brand = useBrand();
  const visibleItems = items.filter(
    (item) => !item.feature || brand.features[item.feature],
  );
  return (
    <View style={{ gap: spacing.xs }}>
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ paddingHorizontal: spacing.md, letterSpacing: 1.2 }}
      >
        {title.toUpperCase()}
      </Typography>
      {visibleItems.map((item) => (
        <SidebarItem key={item.href} {...item} />
      ))}
    </View>
  );
}

export function DesktopShell({
  enabled,
  children,
}: Readonly<{ enabled: boolean; children: ReactNode }>) {
  const { theme } = useTheme();
  const brand = useBrand();
  const brandName = getBrandDisplayName(brand);
  const router = useRouter();
  const { data: profile } = useProfile();
  const experienceCopy = businessCopyFor(profile?.businessType, brand.copy);

  if (!enabled) return <>{children}</>;

  const userName = profile?.name ?? "Minha conta";
  const businessName = profile?.businessName ?? brandName;
  const managementNav = MANAGEMENT_NAV.map((item) => {
    if (item.href === "/materials") {
      return {
        ...item,
        label: experienceCopy.materialNounPlural.replace(/^./, (letter) =>
          letter.toUpperCase(),
        ),
      };
    }
    return item;
  });

  return (
    <View
      style={{ flex: 1, flexDirection: "row", backgroundColor: theme.colors.background }}
    >
      <View
        style={{
          width: 264,
          flexShrink: 0,
          borderRightWidth: 1,
          borderRightColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 76,
            paddingHorizontal: spacing.xl,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <Image
            source={
              brandLogoByMode[theme.mode][brand.id] ??
              brandLogoByMode[theme.mode]["lucro-caseiro"]
            }
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
            accessibilityLabel={brandName}
          />
          <View>
            <Typography variant="h3" color={theme.colors.text}>
              {brandName}
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Gestão do seu negócio
            </Typography>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.xl }}
        >
          <SidebarSection title="Principal" items={PRIMARY_NAV} />
          <SidebarSection title="Gestão" items={managementNav} />
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir configurações da conta"
          onPress={() => router.push("/settings")}
          style={({ pressed }) => ({
            minHeight: 76,
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.full,
              backgroundColor: theme.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{ width: 40, height: 40, borderRadius: radii.full }}
                resizeMode="cover"
              />
            ) : (
              <Typography variant="bodyBold" color={theme.colors.primary}>
                {userName.charAt(0).toUpperCase()}
              </Typography>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="bodyBold" numberOfLines={1}>
              {userName}
            </Typography>
            <Typography variant="caption" numberOfLines={1}>
              {businessName}
            </Typography>
          </View>
          <AppIcon name="settings-outline" size={20} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <View
        style={{
          flex: 1,
          minWidth: 0,
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 1440,
            paddingHorizontal: spacing["3xl"],
            paddingTop: spacing["3xl"],
            minWidth: 0,
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}
