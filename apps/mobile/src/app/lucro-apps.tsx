import { brands, type BrandConfig } from "@lucro-caseiro/brands";
import {
  Badge,
  Card,
  Typography,
  fontSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React from "react";
import {
  Image,
  ScrollView,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { brandLogoByMode } from "../shared/brand-logo";
import { ScreenHeader } from "../shared/components/screen-header";
import { showToast } from "../shared/components/toast";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

const FAMILY_APPS = [
  brands["lucro-revenda"],
  brands["lucro-oficina"],
  brands["lucro-obra"],
] as const;

function ExtensionCard({
  app,
  style,
}: Readonly<{
  app: BrandConfig;
  style: ViewStyle;
}>) {
  const { theme } = useTheme();

  return (
    <Card
      variant="elevated"
      padding="lg"
      onPress={() => showToast("Este aplicativo chega em breve.")}
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
          <Badge label="Em breve" variant="warning" style={{ marginTop: spacing.xs }} />
        </View>
      </View>
    </Card>
  );
}

export default function LucroAppsScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const { width } = useWindowDimensions();
  const usesGrid = width >= 700;
  const contentWidth = Math.min(width - spacing.xl * 2, desktopWidths.data);
  const columns = usesGrid
    ? Math.max(
        1,
        Math.min(
          FAMILY_APPS.length,
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
            Aplicativos em breve
          </Typography>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            {FAMILY_APPS.map((app) => (
              <ExtensionCard key={app.id} app={app} style={cardStyle} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
