import type { BrandFeatures } from "@lucro-caseiro/brands";
import { fonts, radii, spacing, Typography, useBrand, useTheme } from "@lucro-caseiro/ui";
import { AppIcon } from "./app-icon";
import type { AppIconName } from "./app-icon";
import { type Href, usePathname, useRouter } from "expo-router";
import React, { type ReactNode } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

import { useProfile } from "../../features/subscription/hooks";
import { brandLogoById } from "../brand-logo";
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
  {
    label: "Insumos",
    href: "/materials",
    icon: "leaf-outline",
    feature: "materiais",
  },
  { label: "Precificação", href: "/pricing", icon: "calculator-outline" },
  { label: "Financeiro", href: "/finance", icon: "wallet-outline" },
  { label: "Mais opções", href: "/tabs/more", icon: "grid-outline" },
];

const ROUTE_TITLES: ReadonlyArray<readonly [string, string]> = [
  ["/tabs/new-sale", "Nova venda"],
  ["/tabs/sales", "Vendas"],
  ["/tabs/agenda", "Agenda"],
  ["/tabs/clients", "Clientes"],
  ["/tabs/more", "Mais opções"],
  ["/admin-metrics", "Métricas do produto"],
  ["/recurring-expenses", "Gastos fixos"],
  ["/suppliers", "Fornecedores"],
  ["/purchases", "Compras"],
  ["/retail", "Operação da Papelaria"],
  ["/support", "Suporte"],
  ["/materials", "Insumos"],
  ["/finance", "Financeiro"],
  ["/quotes", "Orçamentos"],
  ["/catalog", "Catálogo online"],
  ["/fiado", "Fiado"],
  ["/insights", "Insights"],
  ["/products", "Produtos"],
  ["/recipes", "Receitas"],
  ["/pricing", "Precificação"],
  ["/plans", "Planos"],
  ["/labels", "Etiquetas"],
  ["/packaging", "Embalagens"],
  ["/settings", "Configurações"],
  ["/tabs", "Visão geral"],
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
  const pathname = usePathname();
  const { data: profile } = useProfile();

  if (!enabled) return <>{children}</>;

  const userName = profile?.name ?? "Minha conta";
  const businessName = profile?.businessName ?? brandName;
  const pageTitle =
    ROUTE_TITLES.find(([path]) => isActiveRoute(pathname, path))?.[1] ?? brandName;

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
            source={brandLogoById[brand.id] ?? brandLogoById["lucro-caseiro"]}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
            accessibilityLabel={brandName}
          />
          <View>
            <Typography variant="h3" serif color={theme.colors.text}>
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
          <SidebarSection title="Gestão" items={MANAGEMENT_NAV} />
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

      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            height: 76,
            paddingHorizontal: spacing["3xl"],
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.xl,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h2" serif color={theme.colors.text}>
              {pageTitle}
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {businessName}
            </Typography>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir configurações"
            onPress={() => router.push("/settings")}
            style={({ pressed }) => ({
              minHeight: 42,
              paddingHorizontal: spacing.lg,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.background,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              opacity: pressed ? 0.72 : 1,
            })}
          >
            <AppIcon name="person-outline" size={18} color={theme.colors.primary} />
            <Typography variant="bodyBold" color={theme.colors.text}>
              {userName}
            </Typography>
          </Pressable>
        </View>

        <View
          style={{
            flex: 1,
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
              minWidth: 0,
            }}
          >
            {children}
          </View>
        </View>
      </View>
    </View>
  );
}
