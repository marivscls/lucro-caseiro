import type { CatalogSettings } from "@lucro-caseiro/contracts";
import { Button, Card, Input, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Share, Switch, View } from "react-native";
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
      message: `Confira meu catálogo de produtos: ${url}`,
    });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Typography variant="h1" serif>
        Catálogo online
      </Typography>
      <Typography variant="body" color={theme.colors.textSecondary}>
        Uma página com seus produtos para compartilhar com clientes. Os pedidos chegam
        direto no seu WhatsApp.
      </Typography>

      <Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Typography variant="h3">Catálogo ativo</Typography>
            <Typography variant="caption">
              {settings.enabled
                ? "Qualquer pessoa com o link pode ver seus produtos."
                : "Ative para compartilhar o link com seus clientes."}
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

      <Card>
        <View style={{ gap: spacing.md }}>
          <Input
            label="Endereço do catálogo"
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="doces-da-maria"
          />
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Só letras minúsculas, números e hífens. Seu link: {url}
          </Typography>
          <Input
            label="WhatsApp para pedidos"
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
            placeholder="11 99999-8888"
          />
          <Button
            title={update.isPending ? "Salvando..." : "Salvar"}
            onPress={() => void handleSave()}
            disabled={update.isPending}
          />
        </View>
      </Card>

      {settings.enabled && (
        <Button
          title="Compartilhar link do catálogo"
          variant="secondary"
          onPress={() => void handleShare()}
        />
      )}

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
