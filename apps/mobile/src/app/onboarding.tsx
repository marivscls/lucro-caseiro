import {
  Button,
  Card,
  Input,
  Typography,
  useTheme,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import onboardingHouse from "../assets/onboarding-house.png";
import labelsEmpty from "../assets/labels-empty.png";
import salesEmpty from "../assets/sales-empty.png";
import { useUpdateProfile } from "../features/subscription/hooks";
import { KeyboardAwareScrollView } from "../shared/components/keyboard-aware-scroll-view";
import { useAuth } from "../shared/hooks/use-auth";
import { useOnboarding } from "../shared/hooks/use-onboarding";

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
    id: "outro",
    db: "other",
    label: "Outro negócio",
    description: "Todo negócio caseiro é bem-vindo!",
    emoji: "✨",
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
  return (
    <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg }}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={{
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </Pressable>
      <View style={{ flex: 1, alignItems: "center" }}>
        <Typography
          variant="caption"
          color={theme.colors.primaryLight}
          style={{ letterSpacing: 3, textTransform: "uppercase" }}
        >
          Lucro Caseiro
        </Typography>
      </View>
      <View style={{ width: 48 }} />
    </View>
  );
}

function WelcomeStep({
  onNext,
  onLogin,
}: Readonly<{ onNext: () => void; onLogin: () => void }>) {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: "space-between", padding: spacing["2xl"] }}>
      <View style={{ alignItems: "center", paddingTop: spacing.lg }}>
        <Typography
          variant="caption"
          color={theme.colors.primaryLight}
          style={{ letterSpacing: 3, textTransform: "uppercase" }}
        >
          Lucro Caseiro
        </Typography>
      </View>

      <View style={{ alignItems: "center", gap: spacing.xl }}>
        <Image
          source={onboardingHouse}
          resizeMode="contain"
          style={{ width: 150, height: 150 }}
        />
        <Typography variant="display" style={{ textAlign: "center" }}>
          Sua paixão, seu negócio organizado.
        </Typography>
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          style={{ textAlign: "center", maxWidth: 300 }}
        >
          Vendas, encomendas, orçamentos e lucro — tudo num lugar só, do seu jeito.
        </Typography>

        <ProgressDots current={0} total={3} />
      </View>

      <View style={{ gap: spacing.md, paddingBottom: spacing.lg }}>
        <Button
          title="Começar minha jornada"
          size="lg"
          icon={
            <Ionicons name="arrow-forward" size={20} color={theme.colors.textOnPrimary} />
          }
          onPress={onNext}
          style={{ width: "100%" }}
        />
        <Pressable
          onPress={onLogin}
          style={{ alignItems: "center", minHeight: 44, justifyContent: "center" }}
        >
          <Typography variant="body" color={theme.colors.textSecondary}>
            Já tenho uma conta
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
  const selectedBg =
    theme.mode === "dark" ? "rgba(196, 112, 126, 0.14)" : "rgba(196, 112, 126, 0.08)";

  return (
    <View style={{ flex: 1 }}>
      <StepHeader onBack={onBack} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing["2xl"],
          gap: spacing.lg,
          paddingBottom: 140,
        }}
      >
        <Typography variant="display">O que você faz?</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Escolha o que mais combina com o seu negócio.
        </Typography>

        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          {NICHES.map((niche) => {
            const isSelected = selected === niche.id;
            return (
              <Pressable
                key={niche.id}
                onPress={() => onSelect(niche.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Card
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.lg,
                    borderWidth: 2,
                    borderColor: isSelected ? theme.colors.primary : "transparent",
                    backgroundColor: isSelected ? selectedBg : undefined,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radii.lg,
                      backgroundColor: theme.colors.surfaceElevated,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h2" style={{ fontSize: 26 }}>
                      {niche.emoji}
                    </Typography>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="h3">{niche.label}</Typography>
                    <Typography
                      variant="body"
                      color={theme.colors.textSecondary}
                      style={{ fontSize: 14 }}
                    >
                      {niche.description}
                    </Typography>
                  </View>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      borderWidth: isSelected ? 0 : 2,
                      borderColor:
                        theme.mode === "dark"
                          ? "rgba(245, 225, 219, 0.25)"
                          : "rgba(74, 50, 40, 0.18)",
                      backgroundColor: isSelected ? theme.colors.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
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
          padding: spacing["2xl"],
          paddingTop: spacing.md,
          gap: spacing.md,
          backgroundColor: theme.colors.background,
        }}
      >
        <Button title="Próximo" size="lg" onPress={onNext} disabled={!selected} />
        <Typography variant="caption" style={{ textAlign: "center" }}>
          Você poderá mudar isso depois nas configurações.
        </Typography>
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
        Que tal começar cadastrando seu primeiro produto? Leva menos de 1 minuto — e
        depois é só registrar a primeira venda!
      </Typography>

      <View style={{ gap: spacing.md, width: "100%", marginTop: spacing.sm }}>
        <Button
          title="Cadastrar meu primeiro produto"
          size="lg"
          icon={
            <Ionicons name="add-circle" size={20} color={theme.colors.textOnPrimary} />
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
  const updateProfile = useUpdateProfile();
  const { signOut, userId } = useAuth();
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
        businessType: niche?.db ?? undefined,
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
    router.replace("/products");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {currentStep === 0 && (
        <WelcomeStep
          onNext={() => setStep(1)}
          onLogin={() => {
            // Aqui o usuario ja esta logado (onboarding vem depois do login);
            // "ja tenho conta" = trocar de conta -> desloga e vai pro login.
            void signOut().then(() => router.replace("/(auth)/login"));
          }}
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
          onBack={() => setStep(1)}
        />
      )}

      {currentStep === 3 && (
        <DoneStep onFinish={handleFinish} onFirstProduct={handleFirstProduct} />
      )}
    </SafeAreaView>
  );
}
