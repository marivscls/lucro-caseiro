import { Button, Card, Input, Typography, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOnboarding } from "../shared/hooks/use-onboarding";

const NICHES = [
  {
    id: "confeitaria",
    label: "Confeitaria",
    description: "Bolos artisticos, doces finos e sobremesas que encantam os olhos.",
    emoji: "🎂",
  },
  {
    id: "panificacao",
    label: "Panificacao",
    description: "Paes artesanais, fermentacao natural e o calor do forno a lenha.",
    emoji: "🍞",
  },
  {
    id: "salgados",
    label: "Salgados",
    description: "Buffet, petiscos e as receitas de familia que todo mundo ama.",
    emoji: "🥟",
  },
  {
    id: "bebidas",
    label: "Bebidas",
    description: "Cafes especiais, chas blendados e sucos naturais artesanais.",
    emoji: "☕",
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

function WelcomeStep({
  onNext,
  onLogin,
}: Readonly<{ onNext: () => void; onLogin: () => void }>) {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: "space-between", padding: 24 }}>
      {/* Header */}
      <View style={{ alignItems: "center", paddingTop: 16 }}>
        <Typography variant="caption" color={theme.colors.primary}>
          Lucro Caseiro
        </Typography>
      </View>

      {/* Center content */}
      <View style={{ alignItems: "center", gap: 20 }}>
        {/* Illustration placeholder */}
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 24,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h1" style={{ fontSize: 64 }}>
            🍳
          </Typography>
        </View>

        <Typography variant="display" style={{ textAlign: "center" }}>
          Sua paixao, seu negocio organizado.
        </Typography>
        <Typography variant="body" style={{ textAlign: "center", maxWidth: 300 }}>
          Transforme sua cozinha em um atelie lucrativo com ferramentas feitas para
          artesaos.
        </Typography>

        <ProgressDots current={0} total={3} />
      </View>

      {/* Bottom actions */}
      <View style={{ gap: 12, paddingBottom: 16 }}>
        <Button
          title="Comecar minha jornada  →"
          size="lg"
          onPress={onNext}
          style={{ width: "100%" }}
        />
        <Pressable onPress={onLogin} style={{ alignItems: "center", paddingVertical: 8 }}>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Ja tenho uma conta
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

  return (
    <View style={{ flex: 1 }}>
      {/* Header with back button */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <Pressable onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="caption" color={theme.colors.primary}>
            Lucro Caseiro
          </Typography>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 120 }}>
        <Typography variant="display">Qual o sabor do seu sucesso hoje?</Typography>
        <Typography variant="body">
          Selecione seu nicho para personalizarmos sua experiencia no atelie.
        </Typography>

        <View style={{ gap: 12, marginTop: 8 }}>
          {NICHES.map((niche) => (
            <Pressable key={niche.id} onPress={() => onSelect(niche.id)}>
              <Card
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  borderWidth: selected === niche.id ? 2 : 0,
                  borderColor:
                    selected === niche.id ? theme.colors.primary : "transparent",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: theme.colors.surfaceElevated,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h2" style={{ fontSize: 24 }}>
                    {niche.emoji}
                  </Typography>
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="h3">{niche.label}</Typography>
                  <Typography variant="caption">{niche.description}</Typography>
                </View>
                {selected === niche.id && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: theme.colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={theme.colors.textOnPrimary}
                    />
                  </View>
                )}
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Fixed bottom area */}
      <View
        style={{
          padding: 24,
          gap: 8,
          backgroundColor: theme.colors.background,
        }}
      >
        <Button title="Proximo  →" size="lg" onPress={onNext} disabled={!selected} />
        <Typography variant="caption" style={{ textAlign: "center", marginTop: 4 }}>
          Voce podera alterar isso depois nas configuracoes.
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
      {/* Header with back button */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <Pressable onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="caption" color={theme.colors.primary}>
            Lucro Caseiro
          </Typography>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 20 }}>
        <Typography variant="display">Como se chama seu negocio?</Typography>
        <Typography variant="body">
          Pode ser seu nome, um apelido ou o nome da sua marca
        </Typography>

        <Input
          label="Nome do negocio"
          placeholder="Ex: Doces da Maria, Bia Unhas, Croche da Vo..."
          value={name}
          onChangeText={setName}
          autoFocus
          style={{ fontSize: 20, height: 60 }}
        />

        <Button
          title="Continuar  →"
          size="lg"
          onPress={() => onNext(name.trim())}
          disabled={!name.trim()}
        />

        <Button title="Pular por enquanto" variant="ghost" onPress={() => onNext("")} />

        <ProgressDots current={2} total={3} />
      </View>
    </View>
  );
}

function DoneStep({ onFinish }: Readonly<{ onFinish: () => void }>) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        gap: 24,
      }}
    >
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="checkmark-circle" size={56} color={theme.colors.success} />
      </View>

      <Typography variant="display" style={{ textAlign: "center" }}>
        Tudo pronto!
      </Typography>
      <Typography variant="body" style={{ textAlign: "center", maxWidth: 300 }}>
        Seu negocio ja esta organizado. Agora e so registrar suas vendas e acompanhar seus
        lucros!
      </Typography>

      <View style={{ gap: 12, width: "100%", marginTop: 16 }}>
        <Button title="Comecar a usar  →" size="lg" onPress={onFinish} />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    currentStep,
    businessType,
    setStep,
    setBusinessType,
    setBusinessName,
    completeOnboarding,
  } = useOnboarding();

  function handleFinish() {
    completeOnboarding();
    router.replace("/tabs");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {currentStep === 0 && (
        <WelcomeStep
          onNext={() => setStep(1)}
          onLogin={() => router.push("/(auth)/login")}
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
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}

      {currentStep === 3 && <DoneStep onFinish={handleFinish} />}
    </SafeAreaView>
  );
}
