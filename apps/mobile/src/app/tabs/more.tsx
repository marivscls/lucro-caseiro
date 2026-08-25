import type { BrandFeatures } from "@lucro-caseiro/brands";
import {
  iconSizes,
  radii,
  spacing,
  Typography,
  useBrand,
  useReducedMotion,
  useTheme,
} from "@lucro-caseiro/ui";
import { type Href, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAdminAnalyticsAccess } from "../../features/analytics/hooks";
import { useCatalogSettings } from "../../features/catalog/hooks";
import { avatarPastel } from "../../features/clients/components/avatar-colors";
import { useTodaySummary } from "../../features/sales/hooks";
import { businessCopyFor } from "../../features/subscription/business-copy";
import { useProfile } from "../../features/subscription/hooks";
import { useBrandScreenPalette } from "../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../shared/components/app-icon";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../shared/layout/desktop-density";
import { floatingTabBarContentPadding } from "../../shared/layout/floating-tab-bar";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import { formatCurrency } from "../../shared/utils/format";
import todayOverviewIllustration from "../../assets/more-today-overview.png";

type ToolItem = Readonly<{
  title: string;
  description: string;
  icon: AppIconName;
  route: Href;
  feature?: keyof BrandFeatures;
  badge?: string;
}>;

const DAILY_ITEMS = [
  {
    title: "Financeiro",
    description: "Entradas, saídas e lucro",
    icon: "wallet-outline",
    route: "/finance",
  },
  {
    title: "Fiado",
    description: "Cobranças",
    icon: "cash-outline",
    route: "/fiado",
  },
  {
    title: "Clientes",
    description: "Contatos e aniversários",
    icon: "people-outline",
    route: "/tabs/clients",
  },
] as const satisfies ReadonlyArray<ToolItem>;

const FEATURED_MANAGEMENT_ITEMS = [
  {
    title: "Relatórios",
    description: "Gráficos e desempenho",
    icon: "bar-chart-outline",
    route: "/insights",
  },
  {
    title: "Gastos fixos",
    description: "Custos mensais",
    icon: "repeat-outline",
    route: "/recurring-expenses",
  },
  {
    title: "Orçamentos",
    description: "Propostas",
    icon: "document-text-outline",
    route: "/quotes",
  },
  {
    title: "Produtos",
    description: "Seu catálogo",
    icon: "cube-outline",
    route: "/products",
  },
  {
    title: "Embalagens",
    description: "Custos e estoque",
    icon: "bag-handle-outline",
    route: "/packaging",
    feature: "embalagens",
    badge: "Organize",
  },
] as const satisfies ReadonlyArray<ToolItem>;

const MORE_MANAGEMENT_ITEMS = [
  {
    title: "Operação",
    description: "Fluxo principal do seu negócio",
    icon: "clipboard-outline",
    route: "/operations",
    feature: "operacaoVertical",
  },
  {
    title: "Operação da Papelaria",
    description: "PDV, caixa, listas, inventário e serviços",
    icon: "storefront-outline",
    route: "/retail",
    feature: "varejoPapelaria",
  },
  {
    title: "Serviços",
    description: "Preços, duração e atendimentos",
    icon: "briefcase-outline",
    route: "/services",
  },
  {
    title: "Catálogo online",
    description: "Link para compartilhar com clientes",
    icon: "storefront-outline",
    route: "/catalog",
  },
  {
    title: "Insumos",
    description: "Custos, fornecedores e estoque",
    icon: "flask-outline",
    route: "/tabs/materials",
    feature: "materiais",
  },
  {
    title: "Fornecedores",
    description: "De quem você compra",
    icon: "business-outline",
    route: "/suppliers",
  },
  {
    title: "Compras",
    description: "Contas a pagar e gastos",
    icon: "cart-outline",
    route: "/purchases",
  },
  {
    title: "Receitas",
    description: "Suas receitas e ingredientes",
    icon: "document-text-outline",
    route: "/recipes",
    feature: "fichaTecnica",
  },
  {
    title: "Precificação",
    description: "Calcule o preço ideal",
    icon: "calculator-outline",
    route: "/pricing",
  },
  {
    title: "Etiquetas",
    description: "Etiquetas prontas para imprimir",
    icon: "pricetag-outline",
    route: "/labels",
  },
] as const satisfies ReadonlyArray<ToolItem>;

function InteractiveSurface({
  accessibilityLabel,
  children,
  onPress,
  style,
}: Readonly<{
  accessibilityLabel: string;
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}>) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        style,
        pressed ? styles.pressed : undefined,
        focused ? { borderColor: theme.colors.primaryStrong, borderWidth: 2 } : undefined,
      ]}
    >
      {children}
    </Pressable>
  );
}

function SectionHeader({
  actionLabel,
  onAction,
  title,
}: Readonly<{
  actionLabel?: string;
  onAction?: () => void;
  title: string;
}>) {
  const palette = useBrandScreenPalette();

  return (
    <View style={styles.sectionHeader}>
      <Typography variant="bodyBold" color={palette.wine} style={styles.sectionTitle}>
        {title}
      </Typography>
      {actionLabel && onAction ? (
        <InteractiveSurface
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.sectionAction}
        >
          <Typography variant="bodyBold" color={palette.wine}>
            {actionLabel}
          </Typography>
          <AppIcon
            name={actionLabel === "Ver menos" ? "chevron-up" : "chevron-forward"}
            size={iconSizes.inline}
            color={palette.wine}
          />
        </InteractiveSurface>
      ) : null}
    </View>
  );
}

function ProfileCard({
  avatarUrl,
  businessName,
  catalogError,
  catalogLoading,
  catalogActive,
  inlineAction,
  name,
  onPress,
}: Readonly<{
  avatarUrl?: string | null;
  businessName: string;
  catalogError: boolean;
  catalogLoading: boolean;
  catalogActive: boolean;
  inlineAction: boolean;
  name: string;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  const palette = useBrandScreenPalette();
  const avatarTint = avatarPastel(name || "?", theme.mode);
  let statusLabel = catalogActive ? "Vitrine ativa" : "Vitrine inativa";
  let statusBackground = catalogActive ? palette.lime : palette.white;
  if (catalogLoading) {
    statusLabel = "Carregando vitrine";
    statusBackground = palette.neutral;
  } else if (catalogError) {
    statusLabel = "Status indisponível";
    statusBackground = palette.white;
  }

  return (
    <InteractiveSurface
      accessibilityLabel={`Editar perfil de ${name}. ${statusLabel}.`}
      onPress={onPress}
      style={[
        styles.profileCard,
        { backgroundColor: palette.softRose, borderColor: palette.border },
      ]}
    >
      <View style={styles.profileIdentity}>
        <View style={[styles.avatar, { backgroundColor: avatarTint.bg }]}>
          {avatarUrl ? (
            <Image
              accessibilityLabel={`Foto de ${name}`}
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Typography variant="h1" color={avatarTint.fg}>
              {name.trim().charAt(0).toUpperCase() || "?"}
            </Typography>
          )}
        </View>
        <View style={styles.profileCopy}>
          <Typography variant="h3" color={palette.ink}>
            {name}
          </Typography>
          <Typography variant="body" color={palette.muted}>
            {businessName}
          </Typography>
          <View
            accessibilityLabel={statusLabel}
            style={[
              styles.statusChip,
              { backgroundColor: statusBackground, borderColor: palette.border },
            ]}
          >
            {catalogLoading ? (
              <ActivityIndicator color={palette.wine} size="small" />
            ) : (
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      catalogActive && !catalogError ? palette.limeText : palette.muted,
                  },
                ]}
              />
            )}
            <Typography variant="captionBold" color={palette.wine}>
              {statusLabel}
            </Typography>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.editProfileButton,
          { borderColor: palette.wine },
          inlineAction ? undefined : styles.editProfileButtonBelow,
        ]}
      >
        <Typography variant="bodyBold" color={palette.wine}>
          Editar perfil
        </Typography>
      </View>
    </InteractiveSurface>
  );
}

function MetricIcon({
  compact,
  icon,
}: Readonly<{ compact: boolean; icon: AppIconName }>) {
  const palette = useBrandScreenPalette();
  return (
    <View
      style={[
        styles.metricIcon,
        compact ? styles.metricIconCompact : undefined,
        { backgroundColor: palette.white },
      ]}
    >
      <AppIcon name={icon} size={iconSizes.sm} color={palette.wine} />
    </View>
  );
}

function TodayOverviewCard({
  amount,
  compact,
  error,
  loading,
  onRetry,
  salesCount,
}: Readonly<{
  amount: number;
  compact: boolean;
  error: boolean;
  loading: boolean;
  onRetry: () => void;
  salesCount: number;
}>) {
  const palette = useBrandScreenPalette();
  const salesLabel = salesCount === 1 ? "venda" : "vendas";

  return (
    <View style={[styles.todayCard, { backgroundColor: palette.wineFill }]}>
      <Image
        accessibilityIgnoresInvertColors
        accessible={false}
        resizeMode="contain"
        source={todayOverviewIllustration}
        style={[
          styles.todayIllustration,
          compact ? styles.todayIllustrationCompact : undefined,
        ]}
      />
      <Typography variant="h3" color={palette.onWine} style={styles.todayTitle}>
        Visão de hoje
      </Typography>

      {error ? (
        <View style={styles.todayError}>
          <Typography variant="bodyBold" color={palette.onWine}>
            Resumo indisponível
          </Typography>
          <InteractiveSurface
            accessibilityLabel="Tentar carregar a visão de hoje novamente"
            onPress={onRetry}
            style={styles.retryButton}
          >
            <AppIcon name="refresh" size={iconSizes.inline} color={palette.onWine} />
            <Typography variant="captionBold" color={palette.onWine}>
              Tentar novamente
            </Typography>
          </InteractiveSurface>
        </View>
      ) : (
        <View style={[styles.metricsRow, compact ? styles.metricsRowCompact : undefined]}>
          <View style={[styles.metric, compact ? styles.metricCompact : undefined]}>
            <MetricIcon compact={compact} icon="bag-handle-outline" />
            <View style={styles.metricCopy}>
              {loading ? (
                <ActivityIndicator color={palette.onWine} size="small" />
              ) : (
                <Typography variant="h2" color={palette.onWine}>
                  {salesCount}
                </Typography>
              )}
              <Typography variant="body" color="#F3DDE4">
                {salesLabel}
              </Typography>
            </View>
          </View>
          <View style={styles.metricDivider} />
          <View
            style={[
              styles.metric,
              styles.revenueMetric,
              compact ? styles.metricCompact : undefined,
            ]}
          >
            <MetricIcon compact={compact} icon="cash-outline" />
            <View style={styles.metricCopy}>
              {loading ? (
                <ActivityIndicator color={palette.onWine} size="small" />
              ) : (
                <Typography
                  adjustsFontSizeToFit
                  minimumFontScale={0.66}
                  numberOfLines={1}
                  variant="h2"
                  color={palette.onWine}
                >
                  {formatCurrency(amount)}
                </Typography>
              )}
              <Typography variant="body" color="#F3DDE4">
                faturamento
              </Typography>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const TOOL_ICON_BACKGROUNDS = ["softRose", "neutral", "lime"] as const;

function ToolIcon({
  dense,
  icon,
  index,
  primary,
}: Readonly<{
  dense?: boolean;
  icon: AppIconName;
  index: number;
  primary?: boolean;
}>) {
  const palette = useBrandScreenPalette();
  const backgroundKey = TOOL_ICON_BACKGROUNDS[index % TOOL_ICON_BACKGROUNDS.length];
  let backgroundColor = palette.neutral;
  if (primary) backgroundColor = palette.wineFill;
  else if (backgroundKey === "softRose") backgroundColor = palette.softRose;
  else if (backgroundKey === "lime") backgroundColor = `${palette.lime}38`;
  let iconSize: number = iconSizes.md;
  if (dense) iconSize = iconSizes.list;
  if (primary) iconSize = iconSizes.md;

  return (
    <View
      style={[
        styles.toolIcon,
        dense ? styles.denseToolIcon : undefined,
        primary ? styles.primaryToolIcon : undefined,
        { backgroundColor },
      ]}
    >
      <AppIcon
        name={icon}
        size={iconSize}
        color={primary ? palette.onWine : palette.wine}
      />
    </View>
  );
}

function ToolCard({
  dense,
  index,
  item,
  onPress,
  primary,
}: Readonly<{
  dense?: boolean;
  index: number;
  item: ToolItem;
  onPress: () => void;
  primary?: boolean;
}>) {
  const palette = useBrandScreenPalette();

  return (
    <InteractiveSurface
      accessibilityLabel={`${item.title}. ${item.description}`}
      onPress={onPress}
      style={[
        styles.toolCard,
        primary ? styles.primaryToolCard : undefined,
        dense ? styles.denseToolCard : undefined,
        item.badge ? styles.badgedToolCard : undefined,
        { backgroundColor: palette.white, borderColor: palette.border },
      ]}
    >
      <ToolIcon dense={dense} icon={item.icon} index={index} primary={primary} />
      <View style={[styles.toolCopy, dense ? styles.denseToolCopy : undefined]}>
        <Typography
          adjustsFontSizeToFit={!primary}
          minimumFontScale={0.82}
          numberOfLines={1}
          variant={primary ? "h3" : "bodyBold"}
          color={palette.ink}
        >
          {item.title}
        </Typography>
        <Typography
          variant={dense ? "caption" : "body"}
          color={palette.muted}
          style={dense ? styles.denseToolDescription : undefined}
        >
          {item.description}
        </Typography>
        {item.badge ? (
          <View style={[styles.organizeChip, { backgroundColor: palette.lime }]}>
            <AppIcon name="sparkles" size={iconSizes.xs} color={palette.wine} />
            <Typography
              variant="captionBold"
              color={palette.wine}
              style={styles.organizeChipText}
            >
              {item.badge}
            </Typography>
          </View>
        ) : null}
      </View>
      {primary ? (
        <View style={[styles.microHighlight, { backgroundColor: palette.lime }]}>
          <AppIcon name="trending-up" size={iconSizes.xs} color={palette.wine} />
        </View>
      ) : null}
      <AppIcon
        name="chevron-forward"
        size={dense ? iconSizes.xs : iconSizes.sm}
        color={palette.muted}
        style={dense ? styles.denseToolChevron : undefined}
      />
    </InteractiveSurface>
  );
}

function ExtensionsBanner({ onPress }: Readonly<{ onPress: () => void }>) {
  const palette = useBrandScreenPalette();

  return (
    <InteractiveSurface
      accessibilityLabel="Conheça também. Abra suas extensões com a mesma conta."
      onPress={onPress}
      style={[
        styles.extensionsBanner,
        { backgroundColor: palette.softRose, borderColor: palette.border },
      ]}
    >
      <View style={[styles.editorialCurve, { backgroundColor: palette.white }]} />
      <View style={[styles.extensionsIcon, { backgroundColor: palette.rose }]}>
        <AppIcon name="apps-outline" size={iconSizes.lg} color={palette.onWine} />
      </View>
      <View style={styles.bannerCopy}>
        <Typography variant="h3" color={palette.wine}>
          Conheça também
        </Typography>
        <Typography variant="body" color={palette.muted}>
          Abra suas extensões com a mesma conta
        </Typography>
      </View>
      <View style={[styles.bannerAction, { backgroundColor: palette.rose }]}>
        <AppIcon name="chevron-forward" size={iconSizes.md} color={palette.onWine} />
      </View>
    </InteractiveSurface>
  );
}

function AccountHelpCard({
  onNavigate,
}: Readonly<{ onNavigate: (route: Href) => void }>) {
  const palette = useBrandScreenPalette();
  const rows = [
    {
      title: "Central de ajuda",
      description: "Dúvidas e suporte",
      icon: "help-buoy-outline" as const,
      route: "/support" as const,
    },
    {
      title: "Configurações",
      description: "Conta e preferências",
      icon: "settings-outline" as const,
      route: "/settings" as const,
    },
  ];

  return (
    <View
      style={[
        styles.accountCard,
        { backgroundColor: palette.white, borderColor: palette.border },
      ]}
    >
      {rows.map((row, index) => (
        <React.Fragment key={row.route}>
          {index > 0 ? (
            <View style={[styles.accountDivider, { backgroundColor: palette.border }]} />
          ) : null}
          <InteractiveSurface
            accessibilityLabel={`${row.title}. ${row.description}`}
            onPress={() => onNavigate(row.route)}
            style={styles.accountRow}
          >
            <View style={[styles.accountIcon, { backgroundColor: palette.softRose }]}>
              <AppIcon name={row.icon} size={iconSizes.md} color={palette.wine} />
            </View>
            <View style={styles.toolCopy}>
              <Typography variant="h3" color={palette.ink}>
                {row.title}
              </Typography>
              <Typography variant="body" color={palette.muted}>
                {row.description}
              </Typography>
            </View>
            <AppIcon name="chevron-forward" size={iconSizes.sm} color={palette.muted} />
          </InteractiveSurface>
        </React.Fragment>
      ))}
    </View>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const palette = useBrandScreenPalette();
  const brand = useBrand();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const [showAllTools, setShowAllTools] = useState(false);
  const { data: profile } = useProfile();
  const todaySummary = useTodaySummary();
  const catalogSettings = useCatalogSettings();
  const { data: adminAccess } = useAdminAnalyticsAccess();
  const experienceCopy = businessCopyFor(profile?.businessType, brand.copy);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const manager = UIManager as unknown as {
      setLayoutAnimationEnabledExperimental?: (enabled: boolean) => void;
    };
    manager.setLayoutAnimationEnabledExperimental?.(true);
  }, []);

  const userName = profile?.name?.trim() || "Minha conta";
  const businessName = profile?.businessName?.trim() || "Meu negócio";
  const compactGrid = width < 360;
  const denseMobileGrid = width < 600 && !compactGrid;
  const inlineProfileAction =
    width >= 380 && userName.length <= 24 && businessName.length <= 28;

  const isFeatureAvailable = (item: ToolItem) =>
    !item.feature || brand.features[item.feature];

  const featuredItems = FEATURED_MANAGEMENT_ITEMS.filter(isFeatureAvailable).map(
    (item) => {
      if (item.route === "/products") {
        return {
          ...item,
          title: brand.copy.productNounPlural.replace(/^./, (letter) =>
            letter.toUpperCase(),
          ),
        };
      }
      return item;
    },
  );
  const additionalItems: ToolItem[] = MORE_MANAGEMENT_ITEMS.filter(
    isFeatureAvailable,
  ).map((item) => {
    if (item.route === "/operations") {
      return {
        ...item,
        title: brand.vertical.operationLabel,
        description: brand.vertical.operationDescription,
      };
    }
    if (item.route === "/recipes") {
      return {
        ...item,
        description: `Custos e ${experienceCopy.materialNounPlural}`,
      };
    }
    if (item.route === "/labels") {
      return { ...item, title: brand.copy.labelsLabel };
    }
    return item;
  });

  if (adminAccess?.allowed) {
    additionalItems.push({
      title: "Métricas do produto",
      description: "Instalação, ativação e retenção",
      icon: "analytics-outline",
      route: "/admin-metrics",
    });
  }
  const visibleManagementItemCount =
    featuredItems.length + (showAllTools ? additionalItems.length : 0);

  function toggleAllTools() {
    if (!reducedMotion)
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllTools((current) => !current);
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: isDesktop
              ? spacing["3xl"]
              : floatingTabBarContentPadding(insets.bottom),
          },
          pageGutter(isDesktop, spacing["2xl"]),
          desktopStretch(isDesktop, desktopWidths.wide),
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Typography variant="display" color={palette.wine}>
            Mais opções
          </Typography>
          <Typography variant="body" color={palette.muted} style={styles.subtitle}>
            Tudo para cuidar do seu negócio.
          </Typography>
        </View>

        <ProfileCard
          avatarUrl={profile?.avatarUrl}
          businessName={businessName}
          catalogActive={catalogSettings.data?.enabled === true}
          catalogError={catalogSettings.isError}
          catalogLoading={catalogSettings.isLoading}
          inlineAction={inlineProfileAction}
          name={userName}
          onPress={() => router.push("/settings")}
        />

        <TodayOverviewCard
          amount={todaySummary.data?.totalAmount ?? 0}
          compact={width < 380}
          error={todaySummary.isError}
          loading={todaySummary.isLoading}
          onRetry={() => void todaySummary.refetch()}
          salesCount={todaySummary.data?.totalSales ?? 0}
        />

        <View style={styles.section}>
          <SectionHeader title="DO DIA A DIA" />
          <ToolCard
            index={0}
            item={DAILY_ITEMS[0]}
            onPress={() => router.push(DAILY_ITEMS[0].route)}
            primary
          />
          <View
            style={[styles.twoColumnGrid, compactGrid ? styles.singleColumnGrid : null]}
          >
            {DAILY_ITEMS.slice(1).map((item, index) => (
              <View
                key={item.route}
                style={[styles.gridItem, compactGrid ? styles.gridItemSingle : undefined]}
              >
                <ToolCard
                  dense={denseMobileGrid}
                  index={index + 1}
                  item={item}
                  onPress={() => router.push(item.route)}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            actionLabel={showAllTools ? "Ver menos" : "Ver tudo"}
            onAction={toggleAllTools}
            title="GESTÃO DO NEGÓCIO"
          />
          <View
            style={[styles.twoColumnGrid, compactGrid ? styles.singleColumnGrid : null]}
          >
            {featuredItems.map((item, index) => (
              <View
                key={item.route}
                style={[styles.gridItem, compactGrid ? styles.gridItemSingle : undefined]}
              >
                <ToolCard
                  dense={denseMobileGrid}
                  index={index}
                  item={item}
                  onPress={() => router.push(item.route)}
                />
              </View>
            ))}
            {showAllTools
              ? additionalItems.map((item, index) => (
                  <View
                    key={item.title}
                    style={[
                      styles.gridItem,
                      compactGrid ? styles.gridItemSingle : undefined,
                    ]}
                  >
                    <ToolCard
                      dense={denseMobileGrid}
                      index={index + featuredItems.length}
                      item={item}
                      onPress={() => router.push(item.route)}
                    />
                  </View>
                ))
              : null}
            {!compactGrid && visibleManagementItemCount % 2 === 1 ? (
              <View accessible={false} style={styles.gridItem} />
            ) : null}
          </View>
        </View>

        {brand.features.familiaLucro ? (
          <ExtensionsBanner onPress={() => router.push("/lucro-apps")} />
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="CONTA E AJUDA" />
          <AccountHelpCard onNavigate={(route) => router.push(route)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  accountDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 84,
  },
  accountIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  accountRow: {
    minHeight: 82,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    flexShrink: 0,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  bannerAction: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  badgedToolCard: {
    paddingVertical: spacing.xs,
  },
  content: {
    width: "100%",
    paddingTop: spacing.xl,
    gap: spacing["2xl"],
  },
  editProfileButton: {
    minHeight: 44,
    flexShrink: 0,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileButtonBelow: {
    alignSelf: "flex-end",
    marginLeft: "auto",
    marginTop: spacing.md,
  },
  editorialCurve: {
    position: "absolute",
    width: 220,
    height: 140,
    right: 74,
    bottom: -88,
    borderRadius: radii.full,
    opacity: 0.32,
  },
  extensionsBanner: {
    minHeight: 116,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    overflow: "hidden",
  },
  extensionsIcon: {
    width: 60,
    height: 60,
    flexShrink: 0,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  gridItem: {
    width: "48%",
    flexGrow: 1,
    minWidth: 0,
  },
  gridItemSingle: {
    width: "100%",
  },
  heading: {
    gap: spacing.xs,
  },
  metric: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  metricCompact: {
    gap: spacing.sm,
  },
  metricCopy: {
    minWidth: 0,
  },
  metricDivider: {
    width: 1,
    height: 48,
    flexShrink: 0,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  metricIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  metricIconCompact: {
    width: 36,
    height: 36,
  },
  metricsRow: {
    maxWidth: "72%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  metricsRowCompact: {
    maxWidth: "100%",
    gap: spacing.sm,
  },
  microHighlight: {
    width: 30,
    height: 30,
    flexShrink: 0,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  organizeChip: {
    alignSelf: "flex-start",
    minHeight: 22,
    marginTop: spacing.xs,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  organizeChipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.76,
  },
  primaryToolCard: {
    minHeight: 88,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryToolIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
  },
  profileCard: {
    minHeight: 136,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  profileIdentity: {
    flex: 1,
    minWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  revenueMetric: {
    flex: 1,
  },
  retryButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  sectionAction: {
    minHeight: 44,
    paddingLeft: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sectionHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    letterSpacing: 0.3,
  },
  singleColumnGrid: {
    flexDirection: "column",
  },
  denseToolCard: {
    minHeight: 80,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  denseToolChevron: {
    position: "absolute",
    right: spacing.xs,
    top: "50%",
    transform: [{ translateY: -8 }],
  },
  denseToolCopy: {
    paddingRight: spacing.md,
  },
  denseToolDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  denseToolIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
  },
  statusChip: {
    minHeight: 30,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
  },
  todayCard: {
    minHeight: 184,
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
  },
  todayError: {
    maxWidth: "58%",
    gap: spacing.sm,
  },
  todayIllustration: {
    position: "absolute",
    width: 190,
    height: 154,
    right: -16,
    bottom: -8,
  },
  todayIllustrationCompact: {
    width: 96,
    height: 86,
    right: -8,
    bottom: 0,
  },
  todayTitle: {
    marginBottom: spacing.xl,
  },
  toolCard: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  toolCopy: {
    flex: 1,
    minWidth: 0,
  },
  toolIcon: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  twoColumnGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
});
