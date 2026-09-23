import { fonts, useReducedMotion, useTheme } from "@lucro-caseiro/ui";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";

import foodImage from "../../assets/onboarding-niche-salgados.png";
import sweetsImage from "../../assets/onboarding-niche-confeitaria.png";
import craftImage from "../../assets/onboarding-niche-artesanato.png";
import servicesImage from "../../assets/onboarding-niche-beleza.png";
import retailImage from "../../assets/onboarding-niche-presentes.png";
import otherImage from "../../assets/onboarding-niche-outro.png";
import { useBrandScreenPalette } from "../../shared/brand-palette";
import { brandLogoByMode } from "../../shared/brand-logo";
import { AppIcon } from "../../shared/components/app-icon";
import {
  profileSegments,
  profileSteps,
  type BusinessProfileAnswers,
  type ProfileChoice,
} from "./profile-data";

const illustrations: Record<string, ImageSourcePropType> = {
  food: foodImage,
  sweets: sweetsImage,
  craft: craftImage,
  services: servicesImage,
  retail: retailImage,
  other: otherImage,
};

/** Largura do avatar do app mais o espaço até o balão: alinha respostas e opções ao balão. */
export const CHAT_INDENT = 44;

/** Balão do app: a pergunta da vez, com uma explicação curta embaixo. */
export function AppBubble({
  title,
  description,
}: Readonly<{ title: string; description?: string }>) {
  const colors = useBrandScreenPalette();
  return (
    <View style={styles.appRow}>
      <Image
        source={brandLogoByMode.light["lucro-caseiro"]}
        style={[styles.avatar, { borderColor: colors.border }]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <View
        style={[
          styles.appBubble,
          { backgroundColor: colors.white, borderColor: colors.border },
        ]}
      >
        <Text accessibilityRole="header" style={[styles.question, { color: colors.ink }]}>
          {title}
        </Text>
        {description ? (
          <Text style={[styles.bubbleNote, { color: colors.muted }]}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
}

/** Balão da pessoa com a resposta já dada e o atalho para mudar. */
export function AnswerBubble({
  answer,
  question,
  onEdit,
  disabled = false,
}: Readonly<{
  answer: string;
  question: string;
  onEdit: () => void;
  disabled?: boolean;
}>) {
  const colors = useBrandScreenPalette();
  return (
    <View style={styles.answerRow}>
      <View style={[styles.answerBubble, { backgroundColor: colors.wineFill }]}>
        <Text style={[styles.answer, { color: colors.onWine }]}>{answer}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mudar resposta: ${question}`}
        disabled={disabled}
        onPress={onEdit}
        hitSlop={6}
        style={styles.edit}
      >
        <AppIcon name="pencil-outline" size={16} color={colors.wine} />
        <Text style={[styles.editText, { color: colors.wine }]}>Mudar</Text>
      </Pressable>
    </View>
  );
}

export function BusinessIdentityCard({
  profile,
  step,
  compact = false,
}: Readonly<{ profile: BusinessProfileAnswers; step: number; compact?: boolean }>) {
  const colors = useBrandScreenPalette();
  const reduced = useReducedMotion();
  const reveal = useRef(new Animated.Value(1)).current;
  const segment = profileSegments.find((item) => item.value === profile.segment);
  useEffect(() => {
    if (reduced) {
      reveal.setValue(1);
      return;
    }
    reveal.setValue(0);
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [step, reduced, reveal]);
  const businessName =
    profile.business.trim() ||
    (profile.name.trim() ? `Negócio de ${profile.name.trim()}` : "Seu negócio");
  return (
    <View style={[styles.cardStage, compact && styles.cardStageCompact]}>
      <View
        pointerEvents="none"
        style={[
          styles.cardBack,
          { backgroundColor: colors.softRose, borderColor: colors.border },
          compact && styles.cardBackCompact,
        ]}
      />
      <Animated.View
        style={[
          styles.identity,
          {
            backgroundColor: colors.wineFill,
            opacity: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            transform: [
              {
                translateY: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
              {
                rotate: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["-4deg", "0deg"],
                }),
              },
            ],
          },
          compact && styles.identityCompact,
        ]}
      >
        <View style={styles.cardTop}>
          <Text style={[styles.cardEyebrow, { color: colors.onWine }]}>
            FEITO POR VOCÊ
          </Text>
          <View style={[styles.cardSeal, { backgroundColor: colors.lime }]}>
            <AppIcon
              name={segment?.icon ?? "storefront-outline"}
              size={22}
              color={colors.onLime}
            />
          </View>
        </View>
        <Text
          style={[
            styles.businessName,
            { color: colors.onWine },
            compact && styles.businessNameCompact,
          ]}
        >
          {businessName}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={[styles.cardBody, { color: colors.onWine }]}>
            {segment?.label ?? "Seu talento tem lugar aqui."}
          </Text>
          <AppIcon
            name={step === profileSteps.length ? "checkmark-circle" : "arrow-forward"}
            size={22}
            color={colors.lime}
          />
        </View>
      </Animated.View>
    </View>
  );
}

function ChatChoice({
  choice,
  selected,
  onSelect,
  illustrated,
  multiple,
  wide,
}: Readonly<{
  choice: ProfileChoice;
  selected: boolean;
  onSelect: () => void;
  illustrated: boolean;
  multiple: boolean;
  wide: boolean;
}>) {
  const colors = useBrandScreenPalette();
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole={multiple ? "checkbox" : "radio"}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${choice.label}. ${choice.detail}`}
      onPress={onSelect}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.choice,
        wide && styles.choiceWide,
        {
          backgroundColor: selected ? colors.softRose : colors.white,
          borderColor: selected || hovered ? theme.colors.primaryStrong : colors.border,
          borderWidth: selected ? 2 : 1,
          transform: [{ scale: pressed && !reduced ? 0.98 : 1 }],
        },
      ]}
    >
      {illustrated ? (
        <Image
          source={illustrations[choice.value]}
          style={styles.illustration}
          resizeMode="contain"
        />
      ) : (
        <View
          style={[
            styles.iconWell,
            { backgroundColor: selected ? colors.wineFill : colors.surface },
          ]}
        >
          <AppIcon
            name={choice.icon}
            size={20}
            color={selected ? colors.onWine : colors.wine}
          />
        </View>
      )}
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceTitle, { color: colors.ink }]}>{choice.label}</Text>
        {!illustrated && (
          <Text style={[styles.choiceDetail, { color: colors.muted }]}>
            {choice.detail}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.mark,
          {
            borderRadius: multiple ? 7 : 12,
            borderColor: selected ? colors.wineFill : colors.muted,
            backgroundColor: selected ? colors.wineFill : colors.white,
          },
        ]}
      >
        {selected && <AppIcon name="checkmark" size={15} color={colors.onWine} />}
      </View>
    </Pressable>
  );
}

/** Respostas possíveis da pergunta atual, como botões grandes logo abaixo do balão. */
export function ChatChoices({
  choices,
  value,
  onChange,
  illustrated = false,
  multiple = false,
  wide = false,
}: Readonly<{
  choices: ProfileChoice[];
  value: string | string[];
  onChange: (value: string) => void;
  illustrated?: boolean;
  multiple?: boolean;
  /** Duas colunas quando há espaço (computador). */
  wide?: boolean;
}>) {
  return (
    <View
      accessibilityRole={multiple ? undefined : "radiogroup"}
      style={[styles.choices, wide && styles.choicesWide]}
    >
      {choices.map((choice) => (
        <ChatChoice
          key={choice.value}
          choice={choice}
          selected={
            Array.isArray(value) ? value.includes(choice.value) : value === choice.value
          }
          onSelect={() => onChange(choice.value)}
          illustrated={illustrated}
          multiple={multiple}
          wide={wide}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  appRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 10, borderWidth: 1 },
  appBubble: {
    flexShrink: 1,
    maxWidth: 560,
    borderWidth: 1,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  question: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 25, letterSpacing: -0.2 },
  bubbleNote: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  answerRow: { alignItems: "flex-end", gap: 2 },
  answerBubble: {
    maxWidth: "82%",
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  answer: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22 },
  edit: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  editText: { fontFamily: fonts.bold, fontSize: 16 },
  cardStage: { paddingHorizontal: 6, paddingTop: 14, paddingBottom: 14 },
  cardStageCompact: { paddingHorizontal: 0, paddingTop: 8, paddingBottom: 8 },
  cardBack: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 14,
    bottom: 14,
    borderRadius: 22,
    borderWidth: 1,
    transform: [{ rotate: "-4deg" }],
  },
  cardBackCompact: {
    left: 8,
    right: 8,
    top: 8,
    bottom: 8,
    transform: [{ rotate: "-2deg" }],
  },
  identity: {
    padding: 24,
    borderRadius: 22,
    minHeight: 260,
    justifyContent: "space-between",
    gap: 28,
  },
  identityCompact: { minHeight: 180, gap: 20, padding: 22 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardEyebrow: { fontFamily: fonts.medium, fontSize: 16, letterSpacing: 1 },
  cardSeal: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  businessName: {
    fontFamily: fonts.semiBold,
    fontSize: 33,
    lineHeight: 40,
    letterSpacing: -1,
  },
  businessNameCompact: { fontSize: 26, lineHeight: 32 },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#916b7b",
  },
  cardBody: { fontSize: 16, fontFamily: fonts.regular, flex: 1, lineHeight: 24 },
  choices: { gap: 8, paddingLeft: CHAT_INDENT },
  choicesWide: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 20,
  },
  choiceWide: { flexBasis: "45%", flexGrow: 1 },
  illustration: { width: 40, height: 40 },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceCopy: { flex: 1, minWidth: 0, gap: 2 },
  choiceTitle: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  choiceDetail: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  mark: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
