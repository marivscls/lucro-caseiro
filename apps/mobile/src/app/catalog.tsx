import type { CatalogSettings } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  Input,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { publicCatalogUrl } from "../features/catalog/api";
import { useCatalogSettings, useUpdateCatalogSettings } from "../features/catalog/hooks";
import { ApiError } from "../shared/utils/api-client";

function CatalogForm({ settings }: Readonly<{ settings: CatalogSettings }>) {
  const { theme } = useTheme();
  const update = useUpdateCatalogSettings();
  const [slug, setSlug] = useState(settings.slug);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp ?? "");

  useEffect(() => {
    setSlug(settings.slug);
    setWhatsapp(settings.whatsapp ?? "");
  }, [settings.slug, settings.whatsapp]);

  const url = publicCatalogUrl(settings.slug);

  async function save(data: Parameters<typeof update.mutateAsync>[0]) {
    try {
      await update.mutateAsync(data);
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 400
          ? err.message
          : "Não foi possível salvar. Tente novamente.";
      Alert.alert("Erro", message);
      return false;
    }
  }

  async function handleToggle(enabled: boolean) {
    await save({ enabled });
  }

  async function handleSave() {
    const ok = await save({
      slug: slug.trim().toLowerCase(),
      whatsapp: whatsapp.trim() || null,
    });
    if (ok) {
      Alert.alert("Pronto!", "As configurações do catálogo foram salvas.");
    }
  }

  async function handleShare() {
    await Share.share({
      message: `Oi! 😊 Dá uma olhada no meu catálogo de produtos — é só escolher e me chamar no WhatsApp:\n\n${url}`,
    });
  }

  const isDark = theme.mode === "dark";
  const heroBg = isDark ? "rgba(44, 36, 32, 0.85)" : theme.colors.surfaceElevated;

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing["4xl"],
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View
        style={{
          alignItems: "center",
          gap: spacing.sm,
          paddingVertical: spacing.lg,
        }}
      >
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.35,
            shadowRadius: 18,
            elevation: 6,
          }}
        >
          <Ionicons name="storefront" size={40} color={theme.colors.textOnPrimary} />
        </View>
        <Typography variant="h1" serif style={{ marginTop: spacing.sm }}>
          Sua vitrine online
        </Typography>
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          style={{ textAlign: "center", paddingHorizontal: spacing.lg }}
        >
          Uma página linda com seus produtos. Compartilhe o link e receba pedidos direto
          no WhatsApp.
        </Typography>
        <Badge
          label={settings.enabled ? "✓ Catálogo no ar" : "Catálogo desativado"}
          variant={settings.enabled ? "success" : "neutral"}
        />
      </View>

      {/* Link compartilhável */}
      {settings.enabled && (
        <Card padding="lg" style={{ backgroundColor: heroBg }}>
          <View style={{ gap: spacing.md }}>
            <Typography variant="label">SEU LINK</Typography>
            <Pressable
              onPress={() => void handleShare()}
              accessibilityRole="button"
              accessibilityLabel="Compartilhar link do catálogo"
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(245, 225, 219, 0.14)"
                    : "rgba(74, 50, 40, 0.1)",
                  borderRadius: radii.xl,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="link-outline" size={20} color={theme.colors.primaryLight} />
              <Typography
                variant="caption"
                style={{ flex: 1 }}
                numberOfLines={1}
                color={theme.colors.text}
              >
                {url.replace(/^https?:\/\//, "")}
              </Typography>
              <Ionicons
                name="share-social-outline"
                size={20}
                color={theme.colors.primaryLight}
              />
            </Pressable>
            <Button
              title="Compartilhar com clientes"
              onPress={() => void handleShare()}
            />
          </View>
        </Card>
      )}

      {/* Ativação */}
      <Card padding="lg">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.lg,
              backgroundColor: settings.enabled
                ? theme.colors.successBg
                : theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={settings.enabled ? "globe-outline" : "eye-off-outline"}
              size={22}
              color={settings.enabled ? theme.colors.success : theme.colors.textSecondary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="h3">Catálogo ativo</Typography>
            <Typography variant="caption">
              {settings.enabled
                ? "Qualquer pessoa com o link pode ver seus produtos."
                : "Ative para compartilhar com seus clientes."}
            </Typography>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(value) => void handleToggle(value)}
            trackColor={{ true: theme.colors.primary }}
            accessibilityLabel="Ativar catálogo"
          />
        </View>
      </Card>

      {/* Configurações */}
      <Card padding="lg">
        <View style={{ gap: spacing.md }}>
          <Typography variant="label">PERSONALIZAR</Typography>
          <Input
            label="Endereço do catálogo"
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="doces-da-maria"
          />
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Só letras minúsculas, números e hífens.
          </Typography>
          <Input
            label="WhatsApp para pedidos"
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
            placeholder="11 99999-8888"
          />
          <Button
            title={update.isPending ? "Salvando..." : "Salvar alterações"}
            onPress={() => void handleSave()}
            disabled={update.isPending}
          />
        </View>
      </Card>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.sm,
        }}
      >
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={theme.colors.textSecondary}
        />
        <Typography variant="caption" style={{ flex: 1 }}>
          Aparecem no catálogo todos os seus produtos ativos, com foto, descrição e preço.
        </Typography>
      </View>
    </ScrollView>
  );
}

export default function CatalogScreen() {
  const { theme } = useTheme();
  const { data: settings, isLoading, refetch } = useCatalogSettings();

  let content: React.ReactNode;
  if (settings) {
    content = <CatalogForm settings={settings} />;
  } else if (isLoading) {
    content = (
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={{ marginTop: spacing["3xl"] }}
      />
    );
  } else {
    content = (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <Ionicons name="cloud-offline-outline" size={44} color={theme.colors.alert} />
        <Typography variant="body" style={{ textAlign: "center" }}>
          Não foi possível carregar o catálogo. Verifique sua conexão e tente de novo.
        </Typography>
        <Button title="Tentar de novo" onPress={() => void refetch()} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {content}
    </SafeAreaView>
  );
}
