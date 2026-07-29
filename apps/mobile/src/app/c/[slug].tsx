import { Typography, useTheme } from "@lucro-caseiro/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Linking, Platform, View } from "react-native";

import { publicCatalogUrl } from "../../features/catalog/api";

/**
 * A vitrine pública é HTML servida pela API no domínio do catálogo. Quem cai em
 * /c/:slug dentro do PWA (link antigo ou digitado no domínio do app) é levado
 * pra lá, preservando o deep link de produto (?produto=<id>#produto-<id>).
 */
export default function PublicCatalogRedirect() {
  const { theme } = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug?: string }>();

  useEffect(() => {
    if (typeof slug !== "string" || slug.length === 0) return;
    const target = publicCatalogUrl(slug);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.replace(
        `${target}${window.location.search}${window.location.hash}`,
      );
      return;
    }
    void Linking.openURL(target);
    router.replace("/");
  }, [slug, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator color={theme.colors.primary} />
      <Typography variant="caption" color={theme.colors.textSecondary}>
        Abrindo a vitrine…
      </Typography>
    </View>
  );
}
