import type {
  CatalogAccentColorValue,
  CatalogPatternKey,
  CatalogSettings,
} from "@lucro-caseiro/contracts";
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
  Image,
  Pressable,
  ScrollView,
  Share,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { publicCatalogUrl } from "../features/catalog/api";
import { ColorPickerModal } from "../shared/components/color-picker-modal";
import { HeroPreview } from "../features/catalog/components/hero-preview";
import { useCatalogSettings, useUpdateCatalogSettings } from "../features/catalog/hooks";
import { useProfile } from "../features/subscription/hooks";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import { usePaywall } from "../shared/hooks/use-paywall";
import { ApiError } from "../shared/utils/api-client";
import { showToast } from "../shared/components/toast";
import { uploadCatalogCover, uploadCatalogLogo } from "../shared/utils/upload-image";

// Mesmas chaves/cores dos presets do backend (CATALOG_ACCENT_PRESETS).
const ACCENT_SWATCHES: { key: CatalogAccentColorValue; color: string; label: string }[] =
  [
    { key: "brown", color: "#8c5a45", label: "Marrom" },
    { key: "rose", color: "#c2557b", label: "Rosa" },
    { key: "green", color: "#447a55", label: "Verde" },
    { key: "lavender", color: "#7a64b0", label: "Lilás" },
    { key: "blue", color: "#3f74a0", label: "Azul" },
    { key: "amber", color: "#b3852f", label: "Dourado" },
  ];

// Patterns decorativos do hero (mesmas chaves do backend, HERO_PATTERNS).
const PATTERN_OPTIONS: {
  key: CatalogPatternKey | null;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}[] = [
  { key: null, icon: "ban-outline", label: "Nenhum" },
  { key: "dots", icon: "ellipsis-horizontal", label: "Pontinhos" },
  { key: "bubbles", icon: "ellipse-outline", label: "Bolinhas" },
  { key: "grid", icon: "grid-outline", label: "Quadriculado" },
  { key: "stripes", icon: "reorder-three-outline", label: "Listras" },
];

function CatalogForm({ settings }: Readonly<{ settings: CatalogSettings }>) {
  const { theme } = useTheme();
  const update = useUpdateCatalogSettings();
  const [slug, setSlug] = useState(settings.slug);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp ?? "");
  const [tagline, setTagline] = useState(settings.tagline ?? "");
  const isCustomColor = !!settings.accentColor && settings.accentColor.startsWith("#");
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // Previa local imediata apos escolher a imagem (enquanto o upload/salvar roda).
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((s) => s.show);
  const { pickFromGallery } = useImagePicker();
  const isPremium = profile?.plan === "premium";
  const dashedBorder =
    theme.mode === "dark" ? "rgba(245, 225, 219, 0.35)" : "rgba(74, 50, 40, 0.3)";
  const customCircleBorderColor = isCustomColor ? theme.colors.text : dashedBorder;
  const resolvedBaseColor = isCustomColor
    ? settings.accentColor!
    : (ACCENT_SWATCHES.find((sw) => sw.key === (settings.accentColor ?? "brown"))
        ?.color ?? "#8c5a45");

  useEffect(() => {
    setSlug(settings.slug);
    setWhatsapp(settings.whatsapp ?? "");
    setTagline(settings.tagline ?? "");
  }, [settings.slug, settings.whatsapp, settings.tagline]);

  const url = publicCatalogUrl(settings.slug);

  async function save(data: Parameters<typeof update.mutateAsync>[0]) {
    try {
      await update.mutateAsync(data);
      return true;
    } catch (err) {
      // Personalizacao e Premium: o backend devolve LIMIT_EXCEEDED — abre o paywall.
      if (err instanceof ApiError && err.code === "LIMIT_EXCEEDED") {
        showPaywall("catalog");
        return false;
      }
      const message =
        err instanceof ApiError && err.status === 400
          ? err.message
          : "Não foi possível salvar. Tente novamente.";
      Alert.alert("Erro", message);
      return false;
    }
  }

  function requirePremium(): boolean {
    if (isPremium) return false;
    showPaywall("catalog");
    return true;
  }

  async function handlePickCover() {
    if (requirePremium()) return;
    const uri = await pickFromGallery();
    if (!uri) return;
    setCoverPreview(uri);
    setUploadingCover(true);
    try {
      const coverUrl = await uploadCatalogCover(uri);
      await save({ coverUrl });
    } catch {
      Alert.alert("Erro", "Não foi possível enviar a capa. Tente novamente.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleRemoveCover() {
    setCoverPreview(null);
    await save({ coverUrl: null });
  }

  async function handlePickLogo() {
    if (requirePremium()) return;
    const uri = await pickFromGallery();
    if (!uri) return;
    setLogoPreview(uri);
    setUploadingLogo(true);
    try {
      const logoUrl = await uploadCatalogLogo(uri);
      await save({ logoUrl });
    } catch {
      Alert.alert("Erro", "Não foi possível enviar a foto de perfil. Tente novamente.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    setLogoPreview(null);
    await save({ logoUrl: null });
  }

  async function handlePickColor(color: CatalogAccentColorValue) {
    if (requirePremium()) return;
    await save({ accentColor: color });
  }

  function handleOpenColorModal() {
    if (requirePremium()) return;
    setColorModalVisible(true);
  }

  async function handleConfirmCustomColor(hex: string) {
    setColorModalVisible(false);
    await save({ accentColor: hex });
  }

  async function handlePickPattern(pattern: CatalogPatternKey | null) {
    if (requirePremium()) return;
    await save({ pattern });
  }

  async function handleToggle(enabled: boolean) {
    await save({ enabled });
  }

  async function handleSave() {
    const ok = await save({
      slug: slug.trim().toLowerCase(),
      whatsapp: whatsapp.trim() || null,
      // Tagline so entra no payload para premium (o backend bloqueia no free).
      ...(isPremium ? { tagline: tagline.trim() || null } : {}),
    });
    if (ok) {
      showToast("Configurações salvas!");
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

      {/* Gatilho de upgrade: free mostra ate 5 produtos no catalogo */}
      {!isPremium && (
        <Card
          padding="lg"
          onPress={() => showPaywall("catalog")}
          style={{
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.premium,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Ionicons name="diamond-outline" size={24} color={theme.colors.premium} />
            <View style={{ flex: 1 }}>
              <Typography variant="bodyBold">
                Seu catálogo mostra até 5 produtos
              </Typography>
              <Typography variant="caption">
                Mostre seu catálogo completo e personalize as cores com o Premium.
              </Typography>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textSecondary}
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
        </View>
      </Card>

      {/* Aparência (Premium) */}
      <Card padding="lg">
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Typography variant="label" style={{ flex: 1 }}>
              APARÊNCIA
            </Typography>
            <Badge label="Premium" variant="premium" />
          </View>

          {/* Capa */}
          <Pressable
            onPress={() => void handlePickCover()}
            accessibilityRole="button"
            accessibilityLabel="Foto de capa do catálogo"
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            {(settings.coverUrl ?? coverPreview) ? (
              <Image
                source={{ uri: settings.coverUrl ?? coverPreview! }}
                style={{
                  width: "100%",
                  height: 120,
                  borderRadius: radii.xl,
                  backgroundColor: theme.colors.surface,
                }}
              />
            ) : (
              <View
                style={{
                  height: 120,
                  borderRadius: radii.xl,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor:
                    theme.mode === "dark"
                      ? "rgba(245, 225, 219, 0.25)"
                      : "rgba(74, 50, 40, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.xs,
                }}
              >
                {uploadingCover ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="image-outline"
                      size={28}
                      color={theme.colors.primaryLight}
                    />
                    <Typography variant="caption">
                      Adicionar foto de fundo do topo
                    </Typography>
                  </>
                )}
              </View>
            )}
          </Pressable>
          {settings.coverUrl && (
            <Pressable
              onPress={() => void handleRemoveCover()}
              accessibilityRole="button"
            >
              <Typography variant="caption" color={theme.colors.alert}>
                Remover capa
              </Typography>
            </Pressable>
          )}

          {/* Foto de perfil / logo */}
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Foto de perfil (aparece no topo do catálogo)
          </Typography>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Pressable
              onPress={() => void handlePickLogo()}
              accessibilityRole="button"
              accessibilityLabel="Foto de perfil do catálogo"
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              {(settings.logoUrl ?? logoPreview) ? (
                <Image
                  source={{ uri: settings.logoUrl ?? logoPreview! }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: theme.colors.surface,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    borderColor:
                      theme.mode === "dark"
                        ? "rgba(245, 225, 219, 0.25)"
                        : "rgba(74, 50, 40, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {uploadingLogo ? (
                    <ActivityIndicator color={theme.colors.primary} />
                  ) : (
                    <Ionicons
                      name="person-circle-outline"
                      size={32}
                      color={theme.colors.primaryLight}
                    />
                  )}
                </View>
              )}
            </Pressable>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Typography variant="caption">
                {settings.logoUrl
                  ? "Toque na foto para trocar."
                  : "Toque para adicionar sua logo ou uma foto sua."}
              </Typography>
              {settings.logoUrl && (
                <Pressable
                  onPress={() => void handleRemoveLogo()}
                  accessibilityRole="button"
                >
                  <Typography variant="caption" color={theme.colors.alert}>
                    Remover foto de perfil
                  </Typography>
                </Pressable>
              )}
            </View>
          </View>

          {/* Cor do tema */}
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Cor do catálogo
          </Typography>
          <View style={{ flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
            {ACCENT_SWATCHES.map((swatch) => {
              const selected = (settings.accentColor ?? "brown") === swatch.key;
              return (
                <Pressable
                  key={swatch.key}
                  onPress={() => void handlePickColor(swatch.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Cor ${swatch.label}`}
                  style={{ alignItems: "center", gap: spacing.xs }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: swatch.color,
                      borderWidth: selected ? 3 : 0,
                      borderColor: theme.colors.text,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected && <Ionicons name="checkmark" size={20} color="#fff" />}
                  </View>
                  <Typography variant="caption">{swatch.label}</Typography>
                </Pressable>
              );
            })}

            {/* Cor personalizada: bolinha "+" abre o seletor de cores */}
            <Pressable
              onPress={handleOpenColorModal}
              accessibilityRole="button"
              accessibilityLabel="Escolher cor personalizada"
              style={{ alignItems: "center", gap: spacing.xs }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isCustomColor
                    ? settings.accentColor!
                    : theme.colors.surface,
                  borderWidth: isCustomColor ? 3 : 1.5,
                  borderStyle: isCustomColor ? "solid" : "dashed",
                  borderColor: customCircleBorderColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={isCustomColor ? "checkmark" : "add"}
                  size={22}
                  color={isCustomColor ? "#fff" : theme.colors.primaryLight}
                />
              </View>
              <Typography variant="caption">
                {isCustomColor ? "Sua cor" : "Outra"}
              </Typography>
            </Pressable>
          </View>

          {/* Pattern decorativo */}
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Estampa do topo
          </Typography>
          <View style={{ flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
            {PATTERN_OPTIONS.map((option) => {
              const selected = (settings.pattern ?? null) === option.key;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => void handlePickPattern(option.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Estampa ${option.label}`}
                  style={{ alignItems: "center", gap: spacing.xs }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: theme.colors.primary,
                      borderWidth: selected ? 3 : 0,
                      borderColor: theme.colors.text,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={option.icon} size={20} color="#fff" />
                  </View>
                  <Typography variant="caption">{option.label}</Typography>
                </Pressable>
              );
            })}
          </View>

          {/* Previa do topo (cor + estampa) */}
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Prévia do topo do catálogo
          </Typography>
          <HeroPreview
            baseColor={resolvedBaseColor}
            pattern={settings.pattern ?? null}
            businessName={profile?.businessName ?? profile?.name ?? "Seu negócio"}
            tagline={tagline}
          />

          <ColorPickerModal
            visible={colorModalVisible}
            initialColor={isCustomColor ? settings.accentColor! : "#8c5a45"}
            onConfirm={(hex) => void handleConfirmCustomColor(hex)}
            onCancel={() => setColorModalVisible(false)}
          />

          {/* Frase de apresentação */}
          <Input
            label="Frase de apresentação"
            value={tagline}
            onChangeText={setTagline}
            placeholder="Bolos artesanais feitos com amor 🧁"
            maxLength={120}
          />
        </View>
      </Card>

      {/* Salvar geral (endereco, whatsapp e frase) */}
      <Button
        title={update.isPending ? "Salvando..." : "Salvar"}
        onPress={() => void handleSave()}
        disabled={update.isPending}
      />

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
