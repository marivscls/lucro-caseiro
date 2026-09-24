import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../shared/hooks/use-form-validation";
import { Button, Typography, fonts, useReducedMotion } from "@lucro-caseiro/ui";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBrandScreenPalette } from "../../shared/brand-palette";
import { brandLogoByMode } from "../../shared/brand-logo";
import { AppIcon } from "../../shared/components/app-icon";
import { FormField, TextField, fieldMetrics } from "../../shared/components/form-field";
import {
  emptyBusinessProfile,
  profileAnswerSummary,
  profileChannels,
  goalsForProfile,
  profileQuestion,
  stagesForProfile,
  toggleProfileChannel,
  profileRecommendation,
  profileSegments,
  profileSteps,
  type BusinessProfileAnswers,
} from "./profile-data";
import {
  AnswerBubble,
  AppBubble,
  BusinessIdentityCard,
  CHAT_INDENT,
  ChatChoices,
} from "./profile-visuals";

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
          <Text style={[styles.profileValue, { color: colors.wine }]}>{row.value}</Text>
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
  skipKnownName = false,
  handleHardwareBack = false,
}: Readonly<{
  onClose: () => void;
  onComplete: (profile: BusinessProfileAnswers) => void;
  onStart: (profile: BusinessProfileAnswers) => void;
  initialProfile: BusinessProfileAnswers | null;
  editInitially?: boolean;
  saving?: boolean;
  saveError?: string | null;
  /** Começa na segunda etapa quando o nome já veio do cadastro. */
  skipKnownName?: boolean;
  /** Voltar do Android leva à etapa anterior em vez de fechar. */
  handleHardwareBack?: boolean;
}>) {
  const colors = useBrandScreenPalette();
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const [profile, setProfile] = useState<BusinessProfileAnswers>(
    initialProfile ?? emptyBusinessProfile,
  );
  const [step, setStep] = useState(() => {
    if (initialProfile && !editInitially) return profileSteps.length;
    return skipKnownName && initialProfile?.name.trim() ? 1 : 0;
  });
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  const scroll = useRef<ScrollView>(null);
  // Posição do bloco da pergunta atual: a conversa rola até ela a cada etapa.
  const currentY = useRef(0);
  const layoutStep = useRef(-1);
  const pendingScroll = useRef(false);
  const businessInput = useRef<TextInput>(null);
  const completed = step === profileSteps.length;
  const current = profileQuestion(step, profile);
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
    pendingScroll.current = true;
    scrollToCurrent();
    AccessibilityInfo.announceForAccessibility(title ?? "");
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [step, reducedMotion, progress, title]);

  function scrollToCurrent() {
    // Só rola depois que o bloco da etapa atual foi medido.
    if (!pendingScroll.current || layoutStep.current !== step) return;
    pendingScroll.current = false;
    scroll.current?.scrollTo({
      y: Math.max(0, currentY.current - 12),
      animated: !reducedMotion,
    });
  }

  function goToStep(nextStep: number) {
    Keyboard.dismiss();
    setStep(nextStep);
  }

  useEffect(() => {
    if (!handleHardwareBack) return;
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!saving) {
        if (step > 0) goToStep(step - 1);
        else onClose();
      }
      // Sempre consome o evento: o Voltar nunca fecha o questionário sozinho.
      return true;
    });
    return () => listener.remove();
  });

  function update<Key extends keyof BusinessProfileAnswers>(
    key: Key,
    value: BusinessProfileAnswers[Key],
  ) {
    setProfile((previous) => ({ ...previous, [key]: value }));
  }
  const formValidation = useFormValidation(
    {
      name: step === 0 && !profile.name.trim() && "Informe seu nome para continuar.",
      segment: step === 1 && !profile.segment && "Selecione seu tipo de trabalho.",
      stage: step === 2 && !profile.stage && "Selecione seu momento atual.",
      goal: step === 4 && !profile.goal && "Selecione sua prioridade.",
    },
    step,
  );

  function advance() {
    if (!formValidation.validate()) return;
    if (!valid || saving) return;
    Keyboard.dismiss();
    if (completed) {
      onComplete(profile);
      return;
    }
    goToStep(step + 1);
  }

  const answeredSteps = profileSteps
    .map((_, index) => index)
    .filter((index) => index < step);
  const stepLabel = completed ? "Tudo pronto" : `${step + 1} de ${profileSteps.length}`;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={["top", "bottom", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.brandBar, { backgroundColor: colors.background }]}>
          <Image
            source={brandLogoByMode.light["lucro-caseiro"]}
            style={[styles.brandMark, { borderColor: colors.border }]}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Typography variant="wordmark" style={styles.brandName}>
            Lucro Caseiro
          </Typography>
          <Text style={[styles.stepCount, { color: colors.muted }]}>{stepLabel}</Text>
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
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`Pergunta ${Math.min(step + 1, profileSteps.length)} de ${profileSteps.length}`}
          accessibilityValue={{ min: 0, max: profileSteps.length, now: step }}
          style={[styles.progress, { borderBottomColor: colors.border }]}
        >
          {profileSteps.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.progressCell,
                { backgroundColor: index < step ? colors.rose : colors.border },
              ]}
            />
          ))}
        </View>
        <ScrollView
          pointerEvents={saving ? "none" : "auto"}
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, wide && styles.contentWide]}
        >
          {answeredSteps.map((index) => (
            <View key={profileSteps[index]?.label} style={styles.turn}>
              <AppBubble title={profileQuestion(index, profile)?.title ?? ""} />
              <AnswerBubble
                answer={profileAnswerSummary(index, profile)}
                question={profileQuestion(index, profile)?.title ?? ""}
                disabled={saving}
                onEdit={() => goToStep(index)}
              />
            </View>
          ))}
          <Animated.View
            key={step}
            onLayout={(event) => {
              currentY.current = event.nativeEvent.layout.y;
              layoutStep.current = step;
              scrollToCurrent();
            }}
            style={[
              styles.turn,
              {
                opacity: progress,
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <AppBubble
              title={title ?? ""}
              description={
                completed
                  ? "Este é o ponto de partida que montamos com as suas respostas."
                  : current?.description
              }
            />
            {step === 0 && (
              <View style={[styles.indent, { gap: fieldMetrics.fieldGap }]}>
                <FormField label="Seu nome" validation={formValidation.field("name")}>
                  <TextField
                    editable={!saving}
                    accessibilityLabel="Seu nome"
                    placeholder="Ex.: Mariana"
                    value={profile.name}
                    onChangeText={(value) => update("name", value)}
                    maxLength={200}
                    autoComplete="given-name"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => businessInput.current?.focus()}
                  />
                </FormField>
                <FormField
                  label="Nome do negócio"
                  optional
                  hint="Ainda não tem um nome? Tudo bem, você decide depois."
                >
                  <TextField
                    editable={!saving}
                    inputRef={businessInput}
                    accessibilityLabel="Nome do negócio, opcional"
                    placeholder="Ex.: Ateliê da Mari"
                    value={profile.business}
                    onChangeText={(value) => update("business", value)}
                    maxLength={200}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={advance}
                  />
                </FormField>
              </View>
            )}
            {step === 1 && (
              <ValidationField {...formValidation.field("segment")}>
                <ChatChoices
                  illustrated
                  wide={wide}
                  choices={profileSegments}
                  value={profile.segment}
                  onChange={(value) => update("segment", value)}
                />
              </ValidationField>
            )}
            {step === 2 && (
              <ValidationField {...formValidation.field("stage")}>
                <ChatChoices
                  choices={stagesForProfile(profile.segment)}
                  value={profile.stage}
                  onChange={(value) => update("stage", value)}
                />
              </ValidationField>
            )}
            {step === 3 && (
              <ChatChoices
                multiple
                wide={wide}
                choices={profileChannels}
                value={profile.channels}
                onChange={(value) =>
                  update("channels", toggleProfileChannel(profile.channels, value))
                }
              />
            )}
            {step === 4 && (
              <ValidationField {...formValidation.field("goal")}>
                <ChatChoices
                  wide={wide}
                  choices={goalsForProfile(profile.segment)}
                  value={profile.goal}
                  onChange={(value) => update("goal", value)}
                />
              </ValidationField>
            )}
            {completed && (
              <View style={[styles.fields, styles.indent]}>
                <ProfileSummary profile={profile} />
                <View
                  style={[styles.recommendation, { backgroundColor: colors.softRose }]}
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
                    <Button
                      title={recommendation.action}
                      onPress={() => onStart(profile)}
                      style={{ alignSelf: "flex-start" }}
                    />
                  )}
                </View>
                <Text style={[styles.body, { color: colors.muted }]}>
                  Você pode atualizar suas respostas em Configurações → Perfil do negócio
                  quando quiser.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setProfile(emptyBusinessProfile);
                    goToStep(0);
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
            style={[styles.body, styles.saveError, { color: colors.wine }]}
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
          <View style={[styles.actionsInner, wide && styles.inner]}>
            <Button
              title={step > 0 ? "Voltar" : "Agora não"}
              variant="outline"
              disabled={saving}
              onPress={() => (step > 0 ? goToStep(step - 1) : onClose())}
            />
            <Button
              title={buttonTitle}
              loading={saving}
              onPress={advance}
              style={{ flexShrink: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Coluna da conversa no computador: leitura confortável, como um chat. */
const CHAT_MAX_WIDTH = 760;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  brandBar: {
    minHeight: 60,
    paddingLeft: 20,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: { width: 34, height: 34, borderRadius: 10, borderWidth: 1 },
  brandName: { flex: 1 },
  stepCount: { fontFamily: fonts.semiBold, fontSize: 16 },
  close: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  progress: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  progressCell: { flex: 1, height: 4, borderRadius: 2 },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  contentWide: {
    width: "100%",
    maxWidth: CHAT_MAX_WIDTH,
    alignSelf: "center",
    paddingTop: 32,
  },
  inner: { width: "100%", maxWidth: CHAT_MAX_WIDTH - 40, alignSelf: "center" },
  turn: { gap: 10 },
  indent: { paddingLeft: CHAT_INDENT },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  fields: { gap: 16 },
  saveError: { paddingHorizontal: 20, paddingTop: 12 },
  actions: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1 },
  actionsInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  profile: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 16 },
  profileTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  profileRow: { borderTopWidth: 1, paddingTop: 14, gap: 4 },
  profileValue: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22 },
  recommendation: { borderRadius: 22, padding: 22, gap: 10 },
  restart: { minHeight: 48, alignItems: "center", justifyContent: "center" },
});
