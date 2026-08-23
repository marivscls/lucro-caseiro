import {
  fonts,
  iconSizes,
  PressableScale,
  radii,
  spacing,
  useReducedMotion,
} from "@lucro-caseiro/ui";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import productHero from "../../assets/getting-started-product.png";
import productTipIcon from "../../assets/getting-started-product-tip.png";
import { useBrandScreenPalette } from "../brand-palette";
import {
  GETTING_STARTED_GUIDE_COPY,
  GETTING_STARTED_GUIDE_HEADER,
  GETTING_STARTED_GUIDE_PREVIEW_HINT,
  GETTING_STARTED_GUIDE_SKIP,
  GETTING_STARTED_STAGE_TOTAL,
  gettingStartedStageChip,
  type GettingStartedStage,
} from "../utils/getting-started";
import { AppIcon, type AppIconName } from "./app-icon";
import { StepProgressBar } from "./step-progress-bar";

const STAGE_ORDER: GettingStartedStage[] = ["product", "sale", "result"];
const STAGE_ICONS: Record<GettingStartedStage, AppIconName> = {
  product: "cube-outline",
  sale: "receipt-outline",
  result: "trending-up-outline",
};
const STAGE_HERO: Partial<Record<GettingStartedStage, ImageSourcePropType>> = {
  product: productHero,
};
const HERO_ASPECT = 1024 / 723;
const CTA_HEIGHT = 60;

export function GettingStartedOverlay({
  disabled = false,
  onContinue,
  onSkip,
  preview = false,
  stage,
}: Readonly<{
  disabled?: boolean;
  onContinue: () => void;
  onSkip: () => void;
  preview?: boolean;
  stage: GettingStartedStage;
}>) {
  const colors = useBrandScreenPalette();
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const copy = GETTING_STARTED_GUIDE_COPY[stage];
  const step = STAGE_ORDER.indexOf(stage) + 1;
  const heroSource = STAGE_HERO[stage];
  const frameWidth = Math.min(width, 480);
  const shortScreen = height < 700;
  const heroWidth = Math.min(
    Math.round(frameWidth * (shortScreen ? 0.54 : 0.62)),
    shortScreen ? 232 : 280,
  );
  const titleSize = width < 360 ? 32 : 36;
  const appear = useRef(new Animated.Value(reducedMotion || !heroSource ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion || !heroSource) {
      appear.setValue(1);
      return;
    }
    appear.setValue(0);
    const animation = Animated.timing(appear, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [appear, heroSource, reducedMotion, stage]);

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: colors.offWhite }}
    >
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          flexGrow: 1,
          width: "100%",
          maxWidth: 480,
          alignSelf: "center",
          paddingHorizontal: spacing["2xl"],
          paddingTop: spacing.sm,
          paddingBottom: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 44,
          }}
        >
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.3}
            style={{
              flex: 1,
              fontFamily: fonts.bold,
              fontSize: 16,
              lineHeight: 22,
              letterSpacing: 0.8,
              color: colors.wine,
            }}
          >
            {GETTING_STARTED_GUIDE_HEADER}
          </Text>
          <Pressable
            accessibilityHint="Pula o guia e volta para a Home"
            accessibilityLabel={GETTING_STARTED_GUIDE_SKIP}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onSkip}
            style={({ pressed }) => ({
              minHeight: 44,
              minWidth: 44,
              paddingLeft: spacing.md,
              justifyContent: "center",
              alignItems: "flex-end",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              maxFontSizeMultiplier={1.3}
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 17,
                lineHeight: 22,
                color: colors.muted,
              }}
            >
              {GETTING_STARTED_GUIDE_SKIP}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: spacing.md }}>
          <StepProgressBar
            activeColor={colors.wineFill}
            current={step}
            inactiveColor={colors.softRose}
            total={GETTING_STARTED_STAGE_TOTAL}
          />
        </View>

        <View style={{ alignItems: "center", marginTop: spacing.xl }}>
          <View
            accessibilityLabel={gettingStartedStageChip(step)}
            style={{
              minHeight: 44,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: colors.lime,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              style={{
                fontFamily: fonts.extraBold,
                fontSize: 14,
                lineHeight: 18,
                letterSpacing: 0.6,
                color: colors.onLime,
              }}
            >
              {gettingStartedStageChip(step)}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexGrow: 1,
            minHeight: shortScreen ? 148 : 188,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing.md,
          }}
        >
          {heroSource ? (
            <Animated.Image
              accessibilityIgnoresInvertColors
              accessibilityLabel="Caixa de produto com etiqueta de preço"
              resizeMode="contain"
              source={heroSource}
              style={{
                width: heroWidth,
                height: heroWidth / HERO_ASPECT,
                opacity: appear,
                transform: [
                  {
                    translateY: appear.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              }}
            />
          ) : (
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: radii.full,
                backgroundColor: colors.softRose,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon
                color={colors.wine}
                name={STAGE_ICONS[stage]}
                size={iconSizes.lg}
              />
            </View>
          )}
        </View>

        <Text
          maxFontSizeMultiplier={1.25}
          style={{
            fontFamily: fonts.extraBold,
            fontSize: titleSize,
            lineHeight: Math.round(titleSize * 1.1),
            color: colors.ink,
            textAlign: "center",
          }}
        >
          {stage === "product" ? "Cadastre o que\nvocê vende" : copy.title}
        </Text>
        <Text
          maxFontSizeMultiplier={1.3}
          style={{
            marginTop: spacing.md,
            alignSelf: "center",
            maxWidth: 340,
            fontFamily: fonts.regular,
            fontSize: 18,
            lineHeight: 27,
            color: colors.ink,
            textAlign: "center",
          }}
        >
          {copy.description}
        </Text>

        <View
          style={{
            marginTop: spacing.xl,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            backgroundColor: "rgba(245, 229, 232, 0.78)",
            borderColor: "rgba(182, 95, 114, 0.3)",
            borderWidth: 1,
            borderRadius: radii.xl,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.lg,
          }}
        >
          {stage === "product" ? (
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={productTipIcon}
              style={{ width: 40, height: 40 }}
            />
          ) : (
            <AppIcon color={colors.wine} name={STAGE_ICONS[stage]} size={iconSizes.xl} />
          )}
          <Text
            maxFontSizeMultiplier={1.3}
            style={{
              flex: 1,
              fontFamily: fonts.regular,
              fontSize: 16,
              lineHeight: 24,
              color: colors.ink,
            }}
          >
            {copy.tip}
          </Text>
        </View>

        <View
          style={{
            marginTop: "auto",
            paddingTop: spacing.xl,
            shadowColor: colors.wineFill,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.22,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={copy.action}
            disabled={disabled}
            onPress={onContinue}
            scaleTo={0.98}
            style={{
              height: CTA_HEIGHT,
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: colors.wineFill,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                width: "42%",
                backgroundColor: "rgba(182, 95, 114, 0.16)",
              }}
            />
            <AppIcon color={colors.onWine} name="arrow-forward" size={iconSizes.sm} />
            <Text
              maxFontSizeMultiplier={1.2}
              style={{
                fontFamily: fonts.extraBold,
                fontSize: 18,
                lineHeight: 24,
                color: colors.onWine,
              }}
            >
              {copy.action}
            </Text>
          </PressableScale>
        </View>

        {preview ? (
          <Text
            maxFontSizeMultiplier={1.3}
            style={{
              marginTop: spacing.md,
              fontFamily: fonts.regular,
              fontSize: 14,
              lineHeight: 20,
              color: colors.muted,
              textAlign: "center",
            }}
          >
            {GETTING_STARTED_GUIDE_PREVIEW_HINT}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
