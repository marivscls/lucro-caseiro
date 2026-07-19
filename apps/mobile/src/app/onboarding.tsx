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
import nicheConfeitaria from "../assets/onboarding-niche-confeitaria.png";
import nicheFotografia from "../assets/onboarding-niche-fotografia.png";
import nicheLimpeza from "../assets/onboarding-niche-limpeza.png";
import nicheOutro from "../assets/onboarding-niche-outro.png";
import nichePapelaria from "../assets/onboarding-niche-papelaria.png";
import nichePlantas from "../assets/onboarding-niche-plantas.png";
import nichePresentes from "../assets/onboarding-niche-presentes.png";
import nicheSalgados from "../assets/onboarding-niche-salgados.png";
import labelsEmpty from "../assets/labels-empty.png";
import pricingEmpty from "../assets/pricing-empty.png";
import salesEmpty from "../assets/sales-empty.png";
import { useUpdateProfile } from "../features/subscription/hooks";
import { KeyboardAwareScrollView } from "../shared/components/keyboard-aware-scroll-view";
import { useAuth } from "../shared/hooks/use-auth";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { desktopContained } from "../shared/layout/desktop-density";
import { useOnboarding } from "../shared/hooks/use-onboarding";
import { brandLogoById } from "../shared/brand-logo";
import { getBrandDisplayName } from "../shared/brand-name";

// Nichos cobrindo todos os publicos do app (nao so comida). `db` e o valor
// aceito pelo enum business_type do banco.
const NICHES = [
  {
    id: "confeitaria",
    db: "food",
    label: "Confeitaria e bolos",
    description: "Bolos, doces e sobremesas.",
    emoji: "🎂",
  },
  {
    id: "salgados",
    db: "food",
    label: "Salgados e marmitas",
    description: "Salgadinhos, quentinhas e festas.",
    emoji: "🥟",
  },
  {
    id: "papelaria",
    db: "crafts",
    label: "Papelaria e festas",
    description: "Convites, topos de bolo e lembrancinhas.",
    emoji: "🎉",
  },
  {
    id: "beleza",
    db: "beauty",
    label: "Beleza e unhas",
    description: "Manicure, cílios, sobrancelhas.",
    emoji: "💅",
  },
  {
    id: "artesanato",
    db: "crafts",
    label: "Artesanato",
    description: "Crochê, costura, velas, sabonetes.",
    emoji: "🧶",
  },
  {
    id: "presentes",
    db: "crafts",
    label: "Presentes e personalizados",
    description: "Canecas, produtos personalizados e afins.",
  },
  {
    id: "limpeza",
    db: "other",
    label: "Produtos de limpeza",
    description: "Saboes, detergentes, produtos de limpeza.",
  },
  {
    id: "plantas",
    db: "other",
    label: "Plantas e jardinagem",
    description: "Vasos, suculentas, mudas e cuidados.",
  },
  {
    id: "fotografia",
    db: "other",
    label: "Fotografia e design",
    description: "Fotos, artes digitais, logos e convites.",
  },
  {
    id: "outro",
    db: "other",
    label: "Outro negócio",
    description: "Todo tipo de negócio é bem-vindo!",
    emoji: "✨",
  },
];

const NICHE_ICONS: Record<string, ImageSourcePropType> = {
  confeitaria: nicheConfeitaria,
  salgados: nicheSalgados,
  papelaria: nichePapelaria,
  beleza: nicheBeleza,
  artesanato: nicheArtesanato,
  presentes: nichePresentes,
  limpeza: nicheLimpeza,
  plantas: nichePlantas,
  fotografia: nicheFotografia,
  outro: nicheOutro,
};

const NICHE_COPY: Record<string, { label: string; description: string }> = {
  confeitaria: {
    label: "Confeitaria e bolos",
    description: "Bolos, doces e sobremesas.",
  },
  salgados: {
    label: "Salgados e marmitas",
    description: "Salgadinhos, quentinhas e festas.",
  },
  papelaria: {
    label: "Papelaria e festas",
    description: "Convites, topos de bolo e lembrancinhas.",
  },
  beleza: {
    label: "Beleza e unhas",
    description: "Manicure, cilios, sobrancelhas e afins.",
  },
  artesanato: {
    label: "Artesanato",
    description: "Croche, costura, velas, sabonetes e mais.",
  },
  presentes: {
    label: "Presentes e personalizados",
    description: "Canecas, produtos personalizados e afins.",
  },
  limpeza: {
    label: "Produtos de limpeza",
    description: "Saboes, detergentes, produtos de limpeza.",
  },
  plantas: {
    label: "Plantas e jardinagem",
    description: "Vasos, suculentas, mudas e cuidados.",
  },
  fotografia: {
    label: "Fotografia e design",
    description: "Fotos, artes digitais, logos e convites.",
  },
  outro: {
    label: "Outro negocio",
    description: "Todo tipo de negocio e bem-vindo!",
  },
};

const WELCOME_SLIDES = [
  {
    image: null,
    title: "Sua paixão,\nseu negócio organizado.",
    description: "Vendas, encomendas, orçamentos e lucro, tudo num lugar só.",
  },
  {
    image: salesEmpty,
    title: "Venda sem\nperder controle.",
    description: "Registre pedidos, acompanhe pagamentos e saiba o que falta entregar.",
  },
  {
    image: pricingEmpty,
    title: "Preço certo,\nlucro claro.",
    description: "Calcule custos, margem e lucro antes de vender.",
  },
];

const RETAIL_WELCOME_SLIDES = [
  {
    image: null,
    title: "Sua papelaria,\ntoda organizada.",
    description: "Produtos, estoque, compras e vendas no mesmo lugar.",
  },
  {
    image: salesEmpty,
    title: "Venda rápido,\nsem perder estoque.",
    description: "Use código de barras, escolha a variação e dê baixa automaticamente.",
  },
  {
    image: pricingEmpty,
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
        <AppIcon name="arrow-back" size={24} color={theme.colors.text} />
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
                source={item.image ?? brandLogoById[brand.id]}
                resizeMode="contain"
                style={{ width: 168, height: 168 }}
              />
              <Typography variant="display" style={{ textAlign: "center" }}>
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
  const pagePadding = spacing.lg;
  const cardGap = spacing.md;
  const background = theme.colors.background;
  const cardBackground = theme.colors.surfaceElevated;
  const selectedBg = `${theme.colors.primary}1f`;
  const mutedText = theme.colors.textSecondary;

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
            source={brandLogoById[brand.id]}
            resizeMode="contain"
            style={{ width: 168, height: 96 }}
          />
          <Typography
            variant="display"
            style={{
              textAlign: "center",
              color: theme.colors.text,
              fontSize: 34,
              letterSpacing: 0,
            }}
          >
            O que você faz?
          </Typography>
          <Typography
            variant="body"
            color={mutedText}
            style={{ textAlign: "center", maxWidth: 340, lineHeight: 24 }}
          >
            Escolha o que mais combina com o seu negócio para personalizarmos sua
            experiência.
          </Typography>
        </View>

        <View
          style={{
            gap: cardGap,
          }}
        >
          {NICHES.map((niche) => {
            const isSelected = selected === niche.id;
            const copy = NICHE_COPY[niche.id] ?? niche;
            return (
              <Pressable
                key={niche.id}
                onPress={() => onSelect(niche.id)}
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
                      source={NICHE_ICONS[niche.id]}
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
                      {copy.label}
                    </Typography>
                    <Typography
                      variant="body"
                      color={mutedText}
                      numberOfLines={3}
                      style={{ fontSize: 13, lineHeight: 18, marginTop: 3 }}
                    >
                      {copy.description}
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
          style={{ borderRadius: radii.lg }}
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
  onNext,
  onBack,
}: Readonly<{
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
            source={labelsEmpty}
            resizeMode="contain"
            style={{ width: 150, height: 150 }}
          />
        </View>
        <Typography variant="display" style={{ textAlign: "center" }}>
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
          placeholder="Ex.: Doces da Maria"
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
  onFinish,
  onFirstProduct,
}: Readonly<{ onFinish: () => void; onFirstProduct: () => void }>) {
  const { theme } = useTheme();

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

      <Typography variant="display" style={{ textAlign: "center" }}>
        Tudo pronto!
      </Typography>
      <Typography
        variant="body"
        color={theme.colors.textSecondary}
        style={{ textAlign: "center", maxWidth: 300 }}
      >
        Que tal começar cadastrando seu primeiro produto? Leva menos de 1 minuto, e depois
        é só registrar a primeira venda!
      </Typography>

      <View style={{ gap: spacing.md, width: "100%", marginTop: spacing.sm }}>
        <Button
          title="Cadastrar meu primeiro produto"
          size="lg"
          icon={
            <AppIcon name="add-circle" size={20} color={theme.colors.textOnPrimary} />
          }
          onPress={onFirstProduct}
        />
        <Button title="Deixar para depois" size="lg" variant="ghost" onPress={onFinish} />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const brand = useBrand();
  const verticalOnboarding = brand.onboarding?.skipNicheSelection
    ? brand.onboarding
    : undefined;
  const isDesktop = useDesktopLayout();
  const updateProfile = useUpdateProfile();
  const { signOut, userId } = useAuth();
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const {
    currentStep,
    businessType,
    setStep,
    setBusinessType,
    setBusinessName,
    completeOnboarding,
  } = useOnboarding();

  // Salva nicho e nome do negocio no perfil (servidor). Nao bloqueia o fluxo:
  // se falhar (offline), o usuario ajusta depois nas configuracoes.
  function persistProfile(name: string) {
    const niche = NICHES.find((n) => n.id === businessType);
    updateProfile
      .mutateAsync({
        businessName: name || undefined,
        businessType: verticalOnboarding?.businessType ?? niche?.db ?? undefined,
      })
      .catch(() => {});
  }

  function handleFinish() {
    completeOnboarding(userId);
    router.replace("/tabs");
  }

  // Primeira vitoria: leva direto ao cadastro do 1o produto.
  function handleFirstProduct() {
    completeOnboarding(userId);
    router.replace("/products?from=onboarding");
  }

  async function handleSwitchAccount() {
    if (switchingAccount) return;
    setSwitchingAccount(true);
    try {
      await signOut();
      router.replace("/(auth)/login");
    } finally {
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
                setBusinessType(verticalOnboarding.nicheId);
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
            onNext={(name) => {
              setBusinessName(name);
              persistProfile(name);
              setStep(3);
            }}
            onBack={() => setStep(verticalOnboarding ? 0 : 1)}
          />
        )}

        {currentStep === 3 && (
          <DoneStep onFinish={handleFinish} onFirstProduct={handleFirstProduct} />
        )}
      </View>
    </SafeAreaView>
  );
}
