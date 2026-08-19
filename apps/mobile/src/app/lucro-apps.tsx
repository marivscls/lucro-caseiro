import { brands, type BrandConfig } from "@lucro-caseiro/brands";
import {
  Badge,
  Card,
  Typography,
  fontSizes,
  iconSizes,
  radii,
  spacing,
  useBrand,
  useTheme,
  type BadgeVariant,
} from "@lucro-caseiro/ui";
import * as Linking from "expo-linking";
import React from "react";
import {
  Image,
  ScrollView,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFamilyMemberships } from "../features/verticals/hooks";
import { brandLogoByMode } from "../shared/brand-logo";
import { AppIcon } from "../shared/components/app-icon";
import { ScreenHeader } from "../shared/components/screen-header";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { alertError } from "../shared/utils/alerts";

const PUBLISHED_EXTENSIONS = [
  brands["lucro-revenda"],
  brands["lucro-oficina"],
  brands["lucro-obra"],
] as const;

function ExtensionCard({
  app,
  active,
  current,
  style,
}: Readonly<{
  app: BrandConfig;
  active: boolean;
  current: boolean;
  style: ViewStyle;
}>) {
  const { theme } = useTheme();
  let badgeLabel = "Disponível";
  let badgeVariant: BadgeVariant = "neutral";
  if (active) {
    badgeLabel = "Conta conectada";
    badgeVariant = "success";
  }
  if (current) {
    badgeLabel = "Este app";
    badgeVariant = "primary";
  }

  function openApp() {
    void Linking.openURL(`${app.scheme}://`).catch(() =>
      alertError(
        `${app.appName} ainda não está instalado neste aparelho. Instale-o pela loja para abrir com sua Conta Lucro.`,
      ),
    );
  }

  return (
    <Card
      variant="elevated"
      padding="lg"
      onPress={current ? undefined : openApp}
      style={style}
    >
      <View
        style={{
          minHeight: 72,
          flexDirection: "row",
          gap: spacing.md,
          alignItems: "center",
        }}
      >
        <Image
          source={brandLogoByMode[theme.mode][app.id]}
          resizeMode="contain"
          accessibilityLabel={`Ícone do ${app.appName}`}
          style={{ width: 56, height: 56, borderRadius: radii.lg }}
        />
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <Typography variant="h3" numberOfLines={1}>
            {app.appName}
          </Typography>
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ fontSize: fontSizes.sm }}
            numberOfLines={2}
          >
            {app.vertical.operationDescription}
          </Typography>
          <Badge
            label={badgeLabel}
            variant={badgeVariant}
            style={{ marginTop: spacing.xs }}
          />
        </View>
        {!current ? (
          <AppIcon
            name="open-outline"
            size={iconSizes.sm}
            color={theme.colors.textSecondary}
          />
        ) : null}
      </View>
    </Card>
  );
}

export default function LucroAppsScreen() {
  const { theme } = useTheme();
  const currentBrand = useBrand();
  const memberships = useFamilyMemberships();
  const isDesktop = useDesktopLayout();
  const { width } = useWindowDimensions();
  const activeBrands = new Set(
    memberships.data
      ?.filter((item) => item.status === "active")
      .map((item) => item.brandId),
  );
  const usesGrid = width >= 700;
  const contentWidth = Math.min(width - spacing.xl * 2, desktopWidths.data);
  const columns = usesGrid
    ? Math.max(
        1,
        Math.min(
          PUBLISHED_EXTENSIONS.length,
          Math.floor((contentWidth + spacing.md) / (320 + spacing.md)),
        ),
      )
    : 1;
  const cardStyle: ViewStyle = usesGrid
    ? { width: (contentWidth - spacing.md * (columns - 1)) / columns }
    : { width: "100%" };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScreenHeader
        title="Conheça também"
        subtitle="Outras soluções da família Lucro"
        hideBack={isDesktop}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: spacing.md,
          paddingBottom: spacing["3xl"],
          gap: spacing.xl,
          ...pageGutter(isDesktop),
          ...desktopStretch(isDesktop, desktopWidths.data),
        }}
      >
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          style={{ maxWidth: desktopWidths.standard }}
        >
          Use a mesma Conta Lucro em aplicativos feitos para diferentes tipos de negócio.
          Seus dados e históricos continuam organizados no app certo.
        </Typography>

        <View style={{ gap: spacing.md }}>
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{ textTransform: "uppercase", letterSpacing: 0.4 }}
          >
            Aplicativos disponíveis
          </Typography>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            {PUBLISHED_EXTENSIONS.map((app) => (
              <ExtensionCard
                key={app.id}
                app={app}
                active={activeBrands.has(app.id)}
                current={currentBrand.id === app.id}
                style={cardStyle}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
