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
import {
  ACCOUNT_HELP_ITEMS,
  DAILY_ITEMS,
  FEATURED_MANAGEMENT_ITEMS,
  MORE_MANAGEMENT_ITEMS,
  type ToolItem,
} from "../../shared/layout/more-tools";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import { formatCurrency } from "../../shared/utils/format";
import todayOverviewIllustration from "../../assets/more-today-overview.png";

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
          <Typography variant="h3" color={palette.ink} style={styles.profileName}>
            {name}
          </Typography>
          <Typography variant="body" color={palette.wine}>
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
          inlineAction ? styles.editProfileButtonInline : styles.editProfileButtonBelow,
        ]}
      >
        <Typography variant="captionBold" color={palette.wine}>
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
  wide,
}: Readonly<{
  amount: number;
  compact: boolean;
  error: boolean;
  loading: boolean;
  onRetry: () => void;
  salesCount: number;
  wide: boolean;
}>) {
  const palette = useBrandScreenPalette();
  const salesLabel = salesCount === 1 ? "venda" : "vendas";

  return (
    <View
      style={[
        styles.todayCard,
        compact ? styles.todayCardCompact : undefined,
        { backgroundColor: palette.wineFill },
      ]}
    >
      <View style={[styles.todayCopy, wide ? styles.todayCopyWide : undefined]}>
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
          <View
            style={[
              styles.metricsRow,
              compact ? styles.metricsRowCompact : undefined,
              wide ? styles.metricsRowWide : undefined,
            ]}
          >
            <View style={[styles.metric, compact ? styles.metricCompact : undefined]}>
              <MetricIcon compact={compact} icon="bag-handle-outline" />
              <View style={styles.metricCopy}>
                {loading ? (
                  <ActivityIndicator color={palette.onWine} size="small" />
                ) : (
                  <Typography variant="h3" color={palette.onWine}>
                    {salesCount}
                  </Typography>
                )}
                <Typography variant="body" color="#F3DDE4">
                  {salesLabel}
                </Typography>
              </View>
            </View>
            {wide ? <View style={styles.metricDivider} /> : null}
            <View style={[styles.metric, compact ? styles.metricCompact : undefined]}>
              <MetricIcon compact={compact} icon="cash-outline" />
              <View style={styles.metricCopy}>
                {loading ? (
                  <ActivityIndicator color={palette.onWine} size="small" />
                ) : (
                  <Typography
                    adjustsFontSizeToFit
                    minimumFontScale={0.66}
                    numberOfLines={1}
                    variant="moneyLg"
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
      {compact ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.todayIllustrationSlot,
            wide ? styles.todayIllustrationSlotWide : undefined,
          ]}
        >
          <Image
            accessibilityIgnoresInvertColors
            accessible={false}
            resizeMode="contain"
            source={todayOverviewIllustration}
            style={[
              styles.todayIllustration,
              wide ? styles.todayIllustrationWide : undefined,
            ]}
          />
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
          variant={primary ? "h3" : "bodyBold"}
          color={palette.ink}
          numberOfLines={2}
          style={styles.toolTitle}
        >
          {item.title}
        </Typography>
        <Typography
          variant={dense ? "caption" : "body"}
          color={palette.muted}
          numberOfLines={2}
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
      {dense ? null : (
        <AppIcon name="chevron-forward" size={iconSizes.sm} color={palette.muted} />
      )}
    </InteractiveSurface>
  );
}

function ExtensionsBanner({ onPress }: Readonly<{ onPress: () => void }>) {
  const palette = useBrandScreenPalette();

  return (
    <InteractiveSurface
      accessibilityLabel="Conheça também. Outros aplicativos da família Lucro, em breve."
      onPress={onPress}
      style={[
        styles.extensionsBanner,
        { backgroundColor: palette.softRose, borderColor: palette.border },
      ]}
    >
      <View style={[styles.editorialCurve, { backgroundColor: palette.white }]} />
      <View style={[styles.extensionsIcon, { backgroundColor: palette.rose }]}>
        <AppIcon name="apps-outline" size={iconSizes.md} color={palette.onWine} />
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
  const iconBackgrounds = [palette.softRose, `${palette.lime}38`] as const;

  return (
    <View style={styles.accountList}>
      {ACCOUNT_HELP_ITEMS.map((row, index) => (
        <InteractiveSurface
          key={row.route}
          accessibilityLabel={`${row.title}. ${row.description}`}
          onPress={() => onNavigate(row.route)}
          style={[
            styles.accountRow,
            { backgroundColor: palette.white, borderColor: palette.border },
          ]}
        >
          <View style={[styles.accountIcon, { backgroundColor: iconBackgrounds[index] }]}>
            <AppIcon name={row.icon} size={iconSizes.md} color={palette.wine} />
          </View>
          <View style={styles.toolCopy}>
            <Typography variant="bodyBold" color={palette.ink} style={styles.toolTitle}>
              {row.title}
            </Typography>
            <Typography variant="body" color={palette.muted}>
              {row.description}
            </Typography>
          </View>
          <View style={[styles.accountChevron, { backgroundColor: palette.softRose }]}>
            <AppIcon name="chevron-forward" size={iconSizes.sm} color={palette.wine} />
          </View>
        </InteractiveSurface>
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
  const inlineProfileAction = width >= 600;

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
          pageGutter(isDesktop, spacing.xl),
          desktopStretch(isDesktop, desktopWidths.wide),
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Typography variant="screenTitle" color={palette.wine}>
            Mais opções
          </Typography>
          <Typography variant="body" color={palette.muted}>
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
          wide={width >= 600}
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
  accountChevron: {
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  accountIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  accountList: {
    gap: spacing.sm,
  },
  accountRow: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    flexShrink: 0,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 56,
    height: 56,
  },
  bannerAction: {
    width: 40,
    height: 40,
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
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  editProfileButton: {
    minHeight: 32,
    flexShrink: 0,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileButtonBelow: {
    alignSelf: "flex-end",
    marginLeft: "auto",
    marginTop: spacing.sm,
  },
  editProfileButtonInline: {
    marginTop: 2,
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
    minHeight: 88,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    overflow: "hidden",
  },
  extensionsIcon: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  gridItem: {
    width: "48%",
    flexGrow: 1,
    minWidth: 0,
    alignSelf: "stretch",
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
    flexShrink: 1,
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
    flexDirection: "column",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  metricsRowCompact: {
    gap: spacing.sm,
  },
  metricsRowWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: spacing.xl,
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
    minHeight: 76,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryToolIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
  },
  profileCard: {
    minHeight: 108,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
    justifyContent: "center",
  },
  profileIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  profileName: {
    lineHeight: 24,
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
    flex: 1,
    minHeight: 96,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  denseToolCopy: {
    flex: 1,
    minWidth: 0,
  },
  denseToolDescription: {
    width: "100%",
    fontSize: 12,
    lineHeight: 16,
  },
  denseToolIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
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
  todayCard: {
    minHeight: 148,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingLeft: spacing.lg,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
  },
  todayCardCompact: {
    paddingRight: spacing.xl,
  },
  todayCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingRight: spacing.sm,
    overflow: "hidden",
  },
  todayCopyWide: {
    paddingRight: spacing.xl,
  },
  todayError: {
    gap: spacing.sm,
  },
  todayIllustration: {
    width: 88,
    height: 108,
    marginBottom: -12,
  },
  todayIllustrationSlot: {
    width: 88,
    flexShrink: 0,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  todayIllustrationSlotWide: {
    width: 220,
    flexShrink: 0,
    alignSelf: "stretch",
  },
  todayIllustrationWide: {
    width: 220,
    height: 200,
    marginBottom: -28,
  },
  todayTitle: {
    marginBottom: spacing.md,
  },
  toolCard: {
    minHeight: 72,
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
  toolTitle: {
    flexShrink: 1,
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
    alignItems: "stretch",
    gap: spacing.md,
  },
});
