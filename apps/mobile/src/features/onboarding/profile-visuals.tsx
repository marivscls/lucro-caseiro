import { fonts, useReducedMotion, useTheme } from "@lucro-caseiro/ui";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
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

export function ProfileStepRail({
  step,
  onStep,
}: Readonly<{ step: number; onStep: (index: number) => void }>) {
  const colors = useBrandScreenPalette();
  return (
    <View style={styles.rail}>
      {profileSteps.map((item, index) => {
        const done = index < step;
        const active = index === step;
        const color = done || active ? colors.wine : colors.muted;
        return (
          <View key={item.label} style={styles.railItem}>
            {index < profileSteps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: done ? colors.wine : colors.border },
                ]}
              />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Etapa ${index + 1}: ${item.label}${done ? ", concluída" : ""}`}
              accessibilityState={{ selected: active, disabled: !done }}
              disabled={!done}
              onPress={() => onStep(index)}
              style={styles.stepButton}
            >
              <View
                style={[
                  styles.stepCircle,
                  {
                    borderColor: active ? colors.wine : colors.border,
                    backgroundColor: done ? colors.wineFill : colors.background,
                  },
                ]}
              >
                {done ? (
                  <AppIcon name="checkmark" size={17} color={colors.onWine} />
                ) : (
                  <Text style={[styles.stepNumber, { color }]}>{index + 1}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepText,
                  { color, fontFamily: active ? fonts.bold : fonts.medium },
                ]}
              >
                {["Você", "Negócio", "Fase", "Clientes", "Foco"][index]}
              </Text>
            </Pressable>
          </View>
        );
      })}
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

function ChoiceTile({
  choice,
  selected,
  onSelect,
  illustrated,
  grid,
  multiple,
}: Readonly<{
  choice: ProfileChoice;
  selected: boolean;
  onSelect: () => void;
  illustrated: boolean;
  grid: boolean;
  multiple: boolean;
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
        grid && styles.choiceGrid,
        {
          backgroundColor: selected ? colors.softRose : colors.white,
          borderColor: selected || hovered ? theme.colors.primaryStrong : colors.border,
          transform: [{ scale: pressed && !reduced ? 0.98 : 1 }],
        },
      ]}
    >
      {illustrated ? (
        <Image
          source={illustrations[choice.value]}
          style={[styles.illustration, !grid && styles.illustrationRow]}
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
            size={21}
            color={selected ? colors.onWine : colors.wine}
          />
        </View>
      )}
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceTitle, { color: colors.wine }]}>{choice.label}</Text>
        {!illustrated && (
          <Text style={[styles.body, { color: colors.muted }]}>{choice.detail}</Text>
        )}
      </View>
      <View
        style={[
          styles.radio,
          { borderRadius: multiple ? 6 : 10 },
          grid && styles.radioGrid,
          {
            borderColor: selected ? colors.wine : colors.muted,
            backgroundColor: selected ? colors.wineFill : colors.white,
          },
        ]}
      >
        {selected && <AppIcon name="checkmark" size={14} color={colors.onWine} />}
      </View>
    </Pressable>
  );
}

export function ProfileChoices({
  choices,
  value,
  onChange,
  illustrated = false,
  multiple = false,
}: Readonly<{
  choices: ProfileChoice[];
  value: string | string[];
  onChange: (value: string) => void;
  illustrated?: boolean;
  multiple?: boolean;
}>) {
  const { width, fontScale } = useWindowDimensions();
  const grid = illustrated && width >= 360 && fontScale < 1.3;
  return (
    <View style={[styles.choices, grid && styles.choiceColumns]}>
      {choices.map((choice) => (
        <ChoiceTile
          key={choice.value}
          choice={choice}
          selected={
            Array.isArray(value) ? value.includes(choice.value) : value === choice.value
          }
          onSelect={() => onChange(choice.value)}
          illustrated={illustrated}
          grid={grid}
          multiple={multiple}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { flexDirection: "row", marginBottom: 18 },
  railItem: { flex: 1 },
  connector: { position: "absolute", left: "50%", right: "-50%", height: 1, top: 14 },
  stepButton: { minHeight: 48, alignItems: "center", gap: 6 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumber: { fontFamily: fonts.semiBold, fontSize: 13 },
  stepText: { fontSize: 12, textAlign: "center" },
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
  choices: { gap: 10 },
  choiceColumns: { flexDirection: "row", flexWrap: "wrap" },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
  },
  choiceGrid: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    minHeight: 120,
    paddingTop: 12,
  },
  illustration: { width: 58, height: 58 },
  illustrationRow: { width: 44, height: 44 },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceCopy: { flex: 1, minWidth: 0, gap: 3 },
  choiceTitle: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioGrid: { position: "absolute", top: 12, right: 12 },
});
