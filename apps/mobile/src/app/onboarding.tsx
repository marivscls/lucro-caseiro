import {
  Button,
  Card,
  Input,
  Typography,
  useBrand,
  useTheme,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../shared/components/app-icon";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import nicheArtesanato from "../assets/onboarding-niche-artesanato.png";
import nicheBeleza from "../assets/onboarding-niche-beleza.png";
import nicheFotografia from "../assets/onboarding-niche-fotografia.png";
import nichePapelaria from "../assets/onboarding-niche-papelaria.png";
import nicheSalgados from "../assets/onboarding-niche-salgados.png";
import {
  BUSINESS_PROFILE_OPTIONS,
  businessCopyFor,
  type BusinessProfile,
} from "../features/subscription/business-copy";
import { useUpdateProfile } from "../features/subscription/hooks";
import { KeyboardAwareScrollView } from "../shared/components/keyboard-aware-scroll-view";
import { useAuth } from "../shared/hooks/use-auth";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { desktopContained } from "../shared/layout/desktop-density";
import { useOnboarding } from "../shared/hooks/use-onboarding";
import { brandLogoByMode } from "../shared/brand-logo";
import { useBrandIllustration } from "../shared/brand-illustrations";
import { getBrandDisplayName } from "../shared/brand-name";
import { alertError } from "../shared/utils/alerts";

const PROFILE_IMAGES: Record<BusinessProfile, ImageSourcePropType> = {
  crafts: nicheArtesanato,
  other: nichePapelaria,
  services: nicheFotografia,
  beauty: nicheBeleza,
  food: nicheSalgados,
};

const LEGACY_NICHE_PROFILE: Record<string, BusinessProfile> = {
  confeitaria: "food",
  salgados: "food",
  papelaria: "crafts",
  beleza: "beauty",
  artesanato: "crafts",
  presentes: "crafts",
  limpeza: "other",
  plantas: "other",
  fotografia: "services",
  outro: "other",
};

function normalizeBusinessProfile(value: string | null): BusinessProfile | null {
  if (!value) return null;
  const direct = BUSINESS_PROFILE_OPTIONS.find(
    (profile) => profile.value === value,
  )?.value;
  return direct ?? LEGACY_NICHE_PROFILE[value] ?? null;
}

type WelcomeSlideImage = "sales" | "pricing" | null;

interface WelcomeSlide {
  readonly image: WelcomeSlideImage;
  readonly title: string;
  readonly description: string;
}

const WELCOME_SLIDES: ReadonlyArray<WelcomeSlide> = [
  {
    image: null,
    title: "Preço certo,\nvendas organizadas.",
    description: "Cadastre o que você vende e acompanhe quanto realmente sobra.",
  },
  {
    image: "sales",
    title: "Sua rotina,\nnum só lugar.",
    description: "Organize vendas, clientes, pedidos e recebimentos sem retrabalho.",
  },
  {
    image: "pricing",
    title: "Custo claro,\nlucro sob controle.",
    description: "Calcule custos, margem e preço antes de vender.",
  },
];

const RETAIL_WELCOME_SLIDES: ReadonlyArray<WelcomeSlide> = [
  {
    image: null,
    title: "Sua papelaria,\ntoda organizada.",
    description: "Produtos, estoque, compras e vendas no mesmo lugar.",
  },
  {
    image: "sales",
    title: "Venda rápido,\nsem perder estoque.",
    description: "Use código de barras, escolha a variação e dê baixa automaticamente.",
  },
  {
    image: "pricing",
    title: "Custo e margem\nsempre claros.",
    description: "Saiba quanto cada item custa e quanto sobra em cada venda.",
  },
];

function ProgressDots({ current, total }: Readonly<{ current: number; total: number }>) {
  const { theme } = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? theme.colors.primary : theme.colors.surface,
          }}
        />
      ))}
    </View>
  );
}

function StepHeader({ onBack }: Readonly<{ onBack: () => void }>) {
  const { theme } = useTheme();
  const brand = useBrand();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg }}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={{
          width: 48,
          height: 48,
          borderRadius: radii.md,
          backgroundColor: "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name="chevron-back" size={24} color={theme.colors.text} />
      </Pressable>
      <View style={{ flex: 1, alignItems: "center" }}>
        <Typography
          variant="caption"
          color={theme.colors.primaryLight}
          style={{ letterSpacing: 3, textTransform: "uppercase" }}
        >
          {getBrandDisplayName(brand)}
        </Typography>
      </View>
      <View style={{ width: 48 }} />
    </View>
  );
}

function WelcomeStep({
  onNext,
  onLogin,
  switchingAccount,
}: Readonly<{ onNext: () => void; onLogin: () => void; switchingAccount: boolean }>) {
  const { theme } = useTheme();
  const brand = useBrand();
  const brandLogo = brandLogoByMode[theme.mode][brand.id];
  const salesIllustration = useBrandIllustration("salesEmpty");
  const pricingIllustration = useBrandIllustration("pricingEmpty");
  const slideImages: Readonly<
    Record<Exclude<WelcomeSlideImage, null>, ImageSourcePropType>
  > = {
    sales: salesIllustration,
    pricing: pricingIllustration,
  };
  const slides = brand.features.comprasComEstoque
    ? RETAIL_WELCOME_SLIDES
    : WELCOME_SLIDES;
  const { width } = useWindowDimensions();
  const isDesktop = useDesktopLayout();
  const [slide, setSlide] = useState(0);
  const slideWidth = Math.max(
    280,
    Math.min(width - spacing["2xl"] * 2, isDesktop ? 656 : Number.POSITIVE_INFINITY),
  );

  return (
    <View style={{ flex: 1, justifyContent: "space-between", padding: spacing["2xl"] }}>
      <View style={{ alignItems: "center", paddingTop: spacing.lg }}>
        <Typography
          variant="caption"
          color={theme.colors.primaryLight}
          style={{ letterSpacing: 3, textTransform: "uppercase" }}
        >
          {getBrandDisplayName(brand)}
        </Typography>
      </View>

      <View style={{ alignItems: "center", gap: spacing.lg }}>
        <ScrollView
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          style={{ width: slideWidth }}
          onMomentumScrollEnd={(event) => {
            setSlide(Math.round(event.nativeEvent.contentOffset.x / slideWidth));
          }}
        >
          {slides.map((item) => (
            <View
              key={item.title}
              style={{
                width: slideWidth,
                alignItems: "center",
                gap: spacing.lg,
              }}
            >
              <Image
                source={item.image ? slideImages[item.image] : brandLogo}
                resizeMode="contain"
                style={{ width: 168, height: 168 }}
              />
              <Typography variant="screenTitle" style={{ textAlign: "center" }}>
                {item.title}
              </Typography>
              <Typography
                variant="body"
                color={theme.colors.textSecondary}
                style={{ textAlign: "center", maxWidth: 320 }}
              >
                {item.description}
              </Typography>
            </View>
          ))}
        </ScrollView>

        <ProgressDots current={slide} total={slides.length} />
      </View>

      <View style={{ gap: spacing.md, paddingBottom: spacing.lg }}>
        <Button
          title="Começar minha jornada"
          size="lg"
          icon={
            <AppIcon name="arrow-forward" size={20} color={theme.colors.textOnPrimary} />
          }
          onPress={onNext}
          disabled={switchingAccount}
          style={{ width: "100%" }}
        />
        <Pressable
          onPress={onLogin}
          disabled={switchingAccount}
          style={{ alignItems: "center", minHeight: 44, justifyContent: "center" }}
        >
          <Typography variant="body" color={theme.colors.textSecondary}>
            {switchingAccount ? "Saindo..." : "Já tenho uma conta"}
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}

function NicheStep({
  selected,
  onSelect,
  onNext,
  onBack,
}: Readonly<{
  selected: string | null;
  onSelect: (type: string) => void;
  onNext: () => void;
  onBack: () => void;
}>) {
  const { theme } = useTheme();
  const brand = useBrand();
  const brandLogo = brandLogoByMode[theme.mode][brand.id];
  const pagePadding = spacing.lg;
  const cardGap = spacing.md;
  const background = theme.colors.background;
  const cardBackground = theme.colors.surfaceElevated;
  const selectedBg = `${theme.colors.primary}1f`;
  const mutedText = theme.colors.textSecondary;
  const selectedProfile = normalizeBusinessProfile(selected);

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <StepHeader onBack={onBack} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: pagePadding,
          paddingTop: 0,
          paddingBottom: 172,
        }}
      >
        <View style={{ alignItems: "center", gap: 0, marginBottom: spacing.md }}>
          <Image
            source={brandLogo}
            resizeMode="contain"
            style={{ width: 168, height: 96 }}
          />
          <Typography
            variant="screenTitle"
            style={{
              textAlign: "center",
              color: theme.colors.text,
            }}
          >
            Como seu negócio funciona?
          </Typography>
          <Typography
            variant="body"
            color={mutedText}
            style={{ textAlign: "center", maxWidth: 340, lineHeight: 24 }}
          >
            Escolha a opção mais próxima da sua rotina. Você poderá mudar depois.
          </Typography>
        </View>

        <View
          style={{
            gap: cardGap,
          }}
        >
          {BUSINESS_PROFILE_OPTIONS.map((profile) => {
            const isSelected = selectedProfile === profile.value;
            return (
              <Pressable
                key={profile.value}
                onPress={() => onSelect(profile.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={{ width: "100%" }}
              >
                <Card
                  padding="md"
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 96,
                    gap: spacing.md,
                    borderWidth: 1.25,
                    borderColor: isSelected ? theme.colors.primary : "transparent",
                    backgroundColor: isSelected ? selectedBg : cardBackground,
                  }}
                >
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: radii.md,
                      backgroundColor: theme.colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={PROFILE_IMAGES[profile.value]}
                      resizeMode="contain"
                      style={{ width: 48, height: 48 }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography
                      variant="bodyBold"
                      color={theme.colors.text}
                      numberOfLines={2}
                      style={{ fontSize: 15, lineHeight: 19 }}
                    >
                      {profile.label}
                    </Typography>
                    <Typography
                      variant="body"
                      color={mutedText}
                      numberOfLines={3}
                      style={{ fontSize: 13, lineHeight: 18, marginTop: 3 }}
                    >
                      {profile.description}
                    </Typography>
                  </View>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: isSelected ? 0 : 2,
                      borderColor: theme.colors.textSecondary,
                      backgroundColor: isSelected ? theme.colors.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && (
                      <AppIcon
                        name="checkmark"
                        size={18}
                        color={theme.colors.textOnPrimary}
                      />
                    )}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: pagePadding,
          paddingBottom: spacing.lg,
          paddingTop: spacing.md,
          gap: spacing.md,
          backgroundColor: background,
        }}
      >
        <Button
          title="Próximo"
          size="lg"
          onPress={onNext}
          disabled={!selected}
          icon={
            <AppIcon name="arrow-forward" size={22} color={theme.colors.textOnPrimary} />
          }
          style={{ borderRadius: radii.md }}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
          }}
        >
          <AppIcon name="lock-closed" size={14} color={theme.colors.primaryLight} />
          <Typography
            variant="caption"
            color={theme.colors.primaryLight}
            style={{ textAlign: "center" }}
          >
            Você poderá mudar isso depois nas configurações.
          </Typography>
        </View>
        <ProgressDots current={1} total={3} />
      </View>
    </View>
  );
}

function BusinessNameStep({
  example,
  image,
  onNext,
  onBack,
}: Readonly<{
  example: string;
  image: ImageSourcePropType;
  onNext: (name: string) => void;
  onBack: () => void;
}>) {
  const { theme } = useTheme();
  const [name, setName] = useState("");

  return (
    <View style={{ flex: 1 }}>
      <StepHeader onBack={onBack} />

      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: spacing["2xl"],
          gap: spacing.xl,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center" }}>
          <Image
            source={image}
            resizeMode="contain"
            style={{ width: 150, height: 150 }}
          />
        </View>
        <Typography variant="screenTitle" style={{ textAlign: "center" }}>
          Qual o nome do seu negócio?
        </Typography>
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          style={{ textAlign: "center" }}
        >
          Ele aparece no seu catálogo, nos recibos e nos orçamentos.
        </Typography>
        <Input
          label="Nome do negócio"
          placeholder={`Ex.: ${example}`}
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </KeyboardAwareScrollView>

      <View
        style={{
          padding: spacing["2xl"],
          paddingTop: spacing.md,
          gap: spacing.md,
          backgroundColor: theme.colors.background,
        }}
      >
        <Button
          title="Próximo"
          size="lg"
          onPress={() => onNext(name.trim())}
          disabled={!name.trim()}
        />
        <Pressable
          onPress={() => onNext("")}
          style={{ alignItems: "center", minHeight: 44, justifyContent: "center" }}
        >
          <Typography variant="body" color={theme.colors.textSecondary}>
            Pular por enquanto
          </Typography>
        </Pressable>
        <ProgressDots current={2} total={3} />
      </View>
    </View>
  );
}

function DoneStep({
  productNoun,
  onFinish,
  onFirstProduct,
  finishing,
}: Readonly<{
  productNoun: string;
  onFinish: () => void;
  onFirstProduct: () => void;
  finishing: boolean;
}>) {
  const { theme } = useTheme();
  const salesEmpty = useBrandIllustration("onboardingSales");

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing["2xl"],
        gap: spacing.xl,
      }}
    >
      <Image
        source={salesEmpty}
        resizeMode="contain"
        style={{ width: 158, height: 158 }}
      />

      <Typography variant="screenTitle" style={{ textAlign: "center" }}>
        Tudo pronto!
      </Typography>
      <Typography
        variant="body"
        color={theme.colors.textSecondary}
        style={{ textAlign: "center", maxWidth: 300 }}
      >
        Que tal começar cadastrando seu primeiro {productNoun}? Leva menos de 1 minuto, e
        depois é só registrar a primeira venda!
      </Typography>

      <View style={{ gap: spacing.md, width: "100%", marginTop: spacing.sm }}>
        <Button
          title={`Cadastrar meu primeiro ${productNoun}`}
          size="lg"
          icon={
            <AppIcon name="add-circle" size={20} color={theme.colors.textOnPrimary} />
          }
          onPress={onFirstProduct}
          loading={finishing}
        />
        <Button
          title="Deixar para depois"
          size="lg"
          variant="ghost"
          onPress={onFinish}
          disabled={finishing}
        />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const brand = useBrand();
  const brandLogo = brandLogoByMode[theme.mode][brand.id];
  const verticalOnboarding = brand.onboarding?.skipNicheSelection
    ? brand.onboarding
    : undefined;
  const isDesktop = useDesktopLayout();
  const updateProfile = useUpdateProfile();
  const { signOut, userId } = useAuth();
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const {
    currentStep,
    businessType,
    setStep,
    setBusinessType,
    setBusinessName,
    completeOnboarding,
    startGettingStarted,
  } = useOnboarding();
  const selectedProfile = normalizeBusinessProfile(businessType);
  const experienceCopy = businessCopyFor(selectedProfile, brand.copy);

  // Salva perfil e nome do negocio no servidor. Nao bloqueia o fluxo:
  // se falhar (offline), o usuario ajusta depois nas configuracoes.
  function persistProfile(name: string) {
    updateProfile
      .mutateAsync({
        businessName: name || undefined,
        businessType: verticalOnboarding?.businessType ?? selectedProfile ?? undefined,
      })
      .catch(() => {});
  }

  async function completeAndNavigate(
    destination: "/tabs" | "/products?from=onboarding&create=getting-started",
  ) {
    if (finishing) return;
    setFinishing(true);
    try {
      if (userId) startGettingStarted(userId);
      await completeOnboarding(userId);
      router.replace(destination);
    } catch (error) {
      alertError(error);
    } finally {
      setFinishing(false);
    }
  }

  function handleFinish() {
    void completeAndNavigate("/tabs");
  }

  // Primeira vitoria: leva direto ao cadastro do 1o produto.
  function handleFirstProduct() {
    void completeAndNavigate("/products?from=onboarding&create=getting-started");
  }

  async function handleSwitchAccount() {
    if (switchingAccount) return;
    setSwitchingAccount(true);
    try {
      await signOut();
    } finally {
      router.replace("/(auth)/login");
      setSwitchingAccount(false);
    }
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: isDesktop ? "center" : undefined,
      }}
    >
      <View style={[{ flex: 1 }, desktopContained(isDesktop, 720)]}>
        {currentStep === 0 && (
          <WelcomeStep
            onNext={() => {
              if (verticalOnboarding) {
                setBusinessType(verticalOnboarding.businessType);
                setStep(2);
                return;
              }
              setStep(1);
            }}
            onLogin={() => {
              void handleSwitchAccount();
            }}
            switchingAccount={switchingAccount}
          />
        )}

        {currentStep === 1 && (
          <NicheStep
            selected={businessType}
            onSelect={setBusinessType}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}

        {currentStep === 2 && (
          <BusinessNameStep
            example={experienceCopy.businessNameExample}
            image={selectedProfile ? PROFILE_IMAGES[selectedProfile] : brandLogo}
            onNext={(name) => {
              setBusinessName(name);
              persistProfile(name);
              setStep(3);
            }}
            onBack={() => setStep(verticalOnboarding ? 0 : 1)}
          />
        )}

        {currentStep === 3 && (
          <DoneStep
            productNoun={experienceCopy.productNoun}
            onFinish={handleFinish}
            onFirstProduct={handleFirstProduct}
            finishing={finishing}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
