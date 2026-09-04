import { fonts, useReducedMotion, useTheme } from "@lucro-caseiro/ui";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBrandScreenPalette } from "../../shared/brand-palette";
import { brandLogoByMode } from "../../shared/brand-logo";
import { AppIcon } from "../../shared/components/app-icon";
import {
  emptyBusinessProfile,
  profileChannels,
  goalsForProfile,
  stagesForProfile,
  toggleProfileChannel,
  profileRecommendation,
  profileSegments,
  profileSteps,
  type BusinessProfileAnswers,
} from "./profile-data";
import { BusinessIdentityCard, ProfileChoices, ProfileStepRail } from "./profile-visuals";

function ProfileSummary({ profile }: Readonly<{ profile: BusinessProfileAnswers }>) {
  const colors = useBrandScreenPalette();
  const rows = [
    {
      title: "Seu trabalho",
      value:
        profileSegments.find((item) => item.value === profile.segment)?.label ??
        "Ainda vamos descobrir",
    },
    {
      title: "Seu momento",
      value:
        stagesForProfile(profile.segment).find((item) => item.value === profile.stage)
          ?.label ?? "Um passo de cada vez",
    },
    {
      title: "Sua prioridade",
      value:
        goalsForProfile(profile.segment).find((item) => item.value === profile.goal)
          ?.label ?? "Você escolhe o começo",
    },
    {
      title: "Como os clientes chegam",
      value:
        profileChannels
          .filter((channel) => profile.channels.includes(channel.value))
          .map((channel) => channel.label)
          .join(" · ") || "Ainda vou começar a divulgar",
    },
  ];
  return (
    <View
      style={[
        styles.profile,
        { backgroundColor: colors.white, borderColor: colors.border },
      ]}
    >
      <BusinessIdentityCard profile={profile} step={profileSteps.length} compact />
      {rows.map((row) => (
        <View
          key={row.title}
          style={[styles.profileRow, { borderTopColor: colors.border }]}
        >
          <Text style={[styles.body, { color: colors.muted }]}>{row.title}</Text>
          <Text style={[styles.choiceTitle, { color: colors.wine }]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function BusinessProfileForm({
  onClose,
  onComplete,
  initialProfile,
  onStart,
  editInitially = false,
  saving = false,
  saveError = null,
}: Readonly<{
  onClose: () => void;
  onComplete: (profile: BusinessProfileAnswers) => void;
  onStart: (profile: BusinessProfileAnswers) => void;
  initialProfile: BusinessProfileAnswers | null;
  editInitially?: boolean;
  saving?: boolean;
  saveError?: string | null;
}>) {
  const colors = useBrandScreenPalette();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 950;
  const direction = useRef(1);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [profile, setProfile] = useState<BusinessProfileAnswers>(
    initialProfile ?? emptyBusinessProfile,
  );
  const [step, setStep] = useState(
    initialProfile && !editInitially ? profileSteps.length : 0,
  );
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  const scroll = useRef<ScrollView>(null);
  const businessInput = useRef<TextInput>(null);
  const completed = step === profileSteps.length;
  const current = profileSteps[step];
  const title = completed ? `${profile.name.trim()}, vamos nessa?` : current?.title;
  const valid =
    [
      profile.name.trim().length > 0,
      !!profile.segment,
      !!profile.stage,
      true,
      !!profile.goal,
    ][step] ?? true;
  const recommendation = profileRecommendation(profile);
  let buttonTitle = "Continuar";
  if (step === profileSteps.length - 1) buttonTitle = "Ver meu perfil";
  if (completed) buttonTitle = "Salvar perfil";
  if (saving) buttonTitle = "Salvando…";

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    AccessibilityInfo.announceForAccessibility(title ?? "");
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [step, reducedMotion, progress, title]);

  function goToStep(nextStep: number) {
    direction.current = nextStep >= step ? 1 : -1;
    Keyboard.dismiss();
    setStep(nextStep);
  }

  function update<Key extends keyof BusinessProfileAnswers>(
    key: Key,
    value: BusinessProfileAnswers[Key],
  ) {
    setProfile((previous) => ({ ...previous, [key]: value }));
  }
  function advance() {
    if (!valid || saving) return;
    Keyboard.dismiss();
    if (completed) {
      onComplete(profile);
      return;
    }
    goToStep(step + 1);
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={["top", "bottom", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.brandBar,
            { backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <Image
            source={brandLogoByMode.light["lucro-caseiro"]}
            style={styles.brandMark}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text style={[styles.brandName, { color: colors.wine }]}>lucro caseiro</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar perfil"
            disabled={saving}
            onPress={onClose}
            style={styles.close}
          >
            <AppIcon name="close" color={colors.wine} size={22} />
          </Pressable>
        </View>
        <View style={styles.columns}>
          {wide && (
            <ScrollView
              style={[styles.aside, { backgroundColor: colors.surface }]}
              contentContainerStyle={styles.asideContent}
            >
              <Text style={[styles.previewNote, { color: colors.muted }]}>
                SEU PONTO DE PARTIDA
              </Text>
              <Text style={[styles.asideTitle, { color: colors.wine }]}>
                Uma rotina com a sua cara.
              </Text>
              <Text style={[styles.body, { color: colors.muted }]}>
                Cada resposta ajuda a encontrar um começo que faz sentido para você.
              </Text>
              <BusinessIdentityCard profile={profile} step={step} />
              <View style={styles.asideNote}>
                <AppIcon name="checkmark-circle-outline" size={22} color={colors.wine} />
                <Text style={[styles.body, { color: colors.muted, flex: 1 }]}>
                  Você não precisa ter tudo pronto para dar o primeiro passo.
                </Text>
              </View>
            </ScrollView>
          )}
          <View style={styles.main}>
            <ScrollView
              pointerEvents={saving ? "none" : "auto"}
              ref={scroll}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[styles.content, wide && styles.contentWide]}
            >
              <View style={styles.previewHeader}>
                <Text style={[styles.previewNote, { color: colors.muted }]}>
                  SEU PERFIL
                </Text>
                <Text style={[styles.body, { color: colors.muted }]}>
                  Salvo na sua conta ao concluir
                </Text>
              </View>
              <ProfileStepRail step={step} onStep={goToStep} />
              <Animated.View
                style={{
                  opacity: progress,
                  transform: [
                    {
                      translateX: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [28 * direction.current, 0],
                      }),
                    },
                  ],
                }}
              >
                <Text
                  accessibilityRole="header"
                  style={[styles.title, { color: colors.wine }, wide && styles.titleWide]}
                >
                  {title}
                </Text>
                <Text style={[styles.description, { color: colors.muted }]}>
                  {completed
                    ? "Este é o ponto de partida que montamos com as suas respostas."
                    : current?.description}
                </Text>
                {step === 0 && (
                  <View style={styles.fields}>
                    <View style={styles.field}>
                      <Text
                        style={[styles.choiceTitle, { color: colors.wine }]}
                        nativeID="preview-name-label"
                      >
                        Seu nome
                      </Text>
                      <TextInput
                        editable={!saving}
                        accessibilityLabel="Seu nome"
                        accessibilityLabelledBy="preview-name-label"
                        placeholder="Ex.: Mariana"
                        placeholderTextColor={colors.muted}
                        value={profile.name}
                        onChangeText={(value) => update("name", value)}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        maxLength={200}
                        autoComplete="given-name"
                        autoCapitalize="words"
                        returnKeyType="next"
                        onSubmitEditing={() => businessInput.current?.focus()}
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.white,
                            color: colors.wine,
                            borderColor:
                              focusedField === "name" ? colors.wine : colors.muted,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.field}>
                      <Text style={[styles.choiceTitle, { color: colors.wine }]}>
                        Nome do negócio <Text style={styles.optional}>(opcional)</Text>
                      </Text>
                      <TextInput
                        editable={!saving}
                        ref={businessInput}
                        accessibilityLabel="Nome do negócio, opcional"
                        placeholder="Ex.: Ateliê da Mari"
                        placeholderTextColor={colors.muted}
                        value={profile.business}
                        onChangeText={(value) => update("business", value)}
                        onFocus={() => setFocusedField("business")}
                        onBlur={() => setFocusedField(null)}
                        maxLength={200}
                        autoCapitalize="words"
                        returnKeyType="done"
                        onSubmitEditing={advance}
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.white,
                            color: colors.wine,
                            borderColor:
                              focusedField === "business" ? colors.wine : colors.muted,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.body, { color: colors.muted }]}>
                      Ainda não tem um nome? Tudo bem. Você pode decidir depois.
                    </Text>
                  </View>
                )}
                {step === 1 && (
                  <ProfileChoices
                    illustrated
                    choices={profileSegments}
                    value={profile.segment}
                    onChange={(value) => update("segment", value)}
                  />
                )}
                {step === 2 && (
                  <ProfileChoices
                    choices={stagesForProfile(profile.segment)}
                    value={profile.stage}
                    onChange={(value) => update("stage", value)}
                  />
                )}
                {step === 3 && (
                  <ProfileChoices
                    multiple
                    choices={profileChannels}
                    value={profile.channels}
                    onChange={(value) =>
                      update("channels", toggleProfileChannel(profile.channels, value))
                    }
                  />
                )}
                {step === 4 && (
                  <ProfileChoices
                    choices={goalsForProfile(profile.segment)}
                    value={profile.goal}
                    onChange={(value) => update("goal", value)}
                  />
                )}
                {completed && (
                  <View style={styles.fields}>
                    <ProfileSummary profile={profile} />
                    <View
                      style={[
                        styles.recommendation,
                        { backgroundColor: colors.softRose },
                      ]}
                    >
                      <Text style={[styles.body, { color: colors.wine }]}>
                        Um primeiro passo para você
                      </Text>
                      <Text style={[styles.profileTitle, { color: colors.wine }]}>
                        {recommendation?.title}
                      </Text>
                      <Text style={[styles.body, { color: colors.wine }]}>
                        {recommendation?.text}
                      </Text>
                      {recommendation && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => onStart(profile)}
                          style={[
                            styles.next,
                            {
                              backgroundColor: theme.colors.primaryInteractive,
                              alignSelf: "flex-start",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceTitle,
                              { color: theme.colors.textOnPrimary, flexShrink: 1 },
                            ]}
                          >
                            {recommendation.action}
                          </Text>
                          <AppIcon
                            name="arrow-forward"
                            size={20}
                            color={theme.colors.textOnPrimary}
                          />
                        </Pressable>
                      )}
                    </View>
                    <Text style={[styles.body, { color: colors.muted }]}>
                      Você pode atualizar suas respostas em Configurações → Perfil do
                      negócio quando quiser.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setProfile(emptyBusinessProfile);
                        setStep(0);
                      }}
                      style={styles.restart}
                    >
                      <Text
                        style={[
                          styles.body,
                          { color: colors.wine, textDecorationLine: "underline" },
                        ]}
                      >
                        Refazer respostas
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Animated.View>
            </ScrollView>
            {saveError && (
              <Text
                accessibilityRole="alert"
                style={[
                  styles.body,
                  { color: colors.wine, paddingHorizontal: 18, paddingTop: 12 },
                ]}
              >
                {saveError}
              </Text>
            )}
            <View
              style={[
                styles.actions,
                { backgroundColor: colors.background, borderTopColor: colors.border },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => (step > 0 ? goToStep(step - 1) : onClose())}
                disabled={saving}
                style={styles.back}
              >
                {step > 0 && (
                  <AppIcon name="chevron-back" size={18} color={colors.wine} />
                )}
                <Text style={[styles.body, { color: colors.wine }]}>
                  {step > 0 ? "Voltar" : "Agora não"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !valid || saving, busy: saving }}
                disabled={!valid || saving}
                onPress={advance}
                style={({ pressed }) => [
                  styles.next,
                  {
                    backgroundColor: valid
                      ? theme.colors.primaryInteractive
                      : colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.choiceTitle,
                    { color: valid ? theme.colors.textOnPrimary : colors.muted },
                  ]}
                >
                  {buttonTitle}
                </Text>
                <AppIcon
                  name="arrow-forward"
                  size={20}
                  color={valid ? theme.colors.textOnPrimary : colors.muted}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  titleWide: { fontSize: 32, lineHeight: 38, letterSpacing: -1 },
  asideContent: { padding: 30, paddingTop: 34, gap: 22 },
  asideNote: { flexDirection: "row", gap: 12, marginTop: 12, alignItems: "flex-start" },
  columns: { flex: 1, flexDirection: "row" },
  main: { flex: 1, minWidth: 0 },
  brandBar: {
    minHeight: 58,
    borderBottomWidth: 1,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontFamily: fonts.bold, fontSize: 18, flex: 1, letterSpacing: -0.6 },
  close: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  content: { padding: 18, paddingBottom: 24 },
  contentWide: { padding: 28, paddingTop: 24 },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  previewNote: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 20,
  },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  fields: { gap: 18 },
  field: { gap: 8 },
  optional: { fontFamily: fonts.regular },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 16,
  },
  choiceTitle: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  back: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  next: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexShrink: 1,
  },
  profile: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 16 },
  profileTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.5,
  },
  profileRow: { borderTopWidth: 1, paddingTop: 14, gap: 4 },
  recommendation: { borderRadius: 22, padding: 22, gap: 10 },
  restart: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  aside: { width: 360, flexGrow: 0 },
  asideTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1.5,
  },
  entry: {
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  entryCopy: { flex: 1, gap: 8 },
  entryTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  entryLink: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 24, marginTop: 6 },
});
