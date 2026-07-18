import { fonts, radii, spacing, Typography, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { type Href, usePathname, useRouter } from "expo-router";
import React, { type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { useProfile } from "../../features/subscription/hooks";

type IconName = keyof typeof Ionicons.glyphMap;
type NavigationItem = { label: string; href: string; icon: IconName };

const PRIMARY_NAV: ReadonlyArray<NavigationItem> = [
  { label: "Início", href: "/tabs", icon: "home-outline" },
  { label: "Vendas", href: "/tabs/sales", icon: "receipt-outline" },
  { label: "Nova venda", href: "/tabs/new-sale", icon: "add-circle-outline" },
  { label: "Agenda", href: "/tabs/agenda", icon: "calendar-outline" },
  { label: "Clientes", href: "/tabs/clients", icon: "people-outline" },
];

const MANAGEMENT_NAV: ReadonlyArray<NavigationItem> = [
  { label: "Produtos", href: "/products", icon: "cube-outline" },
  { label: "Insumos", href: "/materials", icon: "leaf-outline" },
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
  ["/labels", "Rótulos"],
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
      <Ionicons
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
  return (
    <View style={{ gap: spacing.xs }}>
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ paddingHorizontal: spacing.md, letterSpacing: 1.2 }}
      >
        {title.toUpperCase()}
      </Typography>
      {items.map((item) => (
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
  const router = useRouter();
  const pathname = usePathname();
  const { data: profile } = useProfile();

  if (!enabled) return <>{children}</>;

  const userName = profile?.name ?? "Minha conta";
  const businessName = profile?.businessName ?? "Lucro Caseiro";
  const pageTitle =
    ROUTE_TITLES.find(([path]) => isActiveRoute(pathname, path))?.[1] ?? "Lucro Caseiro";

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
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.md,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="home" size={22} color={theme.colors.textOnPrimary} />
          </View>
          <View>
            <Typography variant="h3" serif color={theme.colors.text}>
              Lucro Caseiro
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
            <Typography variant="bodyBold" color={theme.colors.primary}>
              {userName.charAt(0).toUpperCase()}
            </Typography>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="bodyBold" numberOfLines={1}>
              {userName}
            </Typography>
            <Typography variant="caption" numberOfLines={1}>
              {businessName}
            </Typography>
          </View>
          <Ionicons
            name="settings-outline"
            size={20}
            color={theme.colors.textSecondary}
          />
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
            <Ionicons name="person-outline" size={18} color={theme.colors.primary} />
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
