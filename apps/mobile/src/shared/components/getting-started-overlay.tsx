import { fonts, iconSizes, radii, spacing, useReducedMotion } from "@lucro-caseiro/ui";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ActivityIndicator,
  Image,
  Platform,
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
import resultHero from "../../assets/getting-started-result.png";
import resultTipIcon from "../../assets/getting-started-result-tip.png";
import saleHero from "../../assets/getting-started-sale.png";
import saleTipIcon from "../../assets/getting-started-sale-tip.png";
import { useBrandScreenPalette } from "../brand-palette";
import {
  GETTING_STARTED_STAGE_TOTAL,
  getGettingStartedGuideCopy,
  gettingStartedProgressLabel,
  gettingStartedStageChip,
  translateGettingStarted,
  type GettingStartedTranslate,
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
  sale: saleHero,
  result: resultHero,
};
const STAGE_HERO_ASPECT: Partial<Record<GettingStartedStage, number>> = {
  product: 1492 / 1054,
  sale: 1435 / 1096,
  result: 1277 / 1232,
};
const STAGE_TIP_ICON: Record<GettingStartedStage, ImageSourcePropType> = {
  product: productTipIcon,
  sale: saleTipIcon,
  result: resultTipIcon,
};
const STAGE_TIP_ICON_SIZE: Record<GettingStartedStage, number> = {
  product: 32,
  sale: 32,
  result: 40,
};
const CTA_HEIGHT = 52;

export function GettingStartedOverlay({
  disabled = false,
  loading = false,
  onContinue,
  onSkip,
  stage,
  translate = translateGettingStarted,
}: Readonly<{
  disabled?: boolean;
  loading?: boolean;
  onContinue: () => void;
  onSkip: () => void;
  stage: GettingStartedStage;
  translate?: GettingStartedTranslate;
}>) {
  const colors = useBrandScreenPalette();
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const copy = getGettingStartedGuideCopy(stage, translate);
  const step = STAGE_ORDER.indexOf(stage) + 1;
  const heroSource = STAGE_HERO[stage];
  const heroAspect = STAGE_HERO_ASPECT[stage];
  const frameWidth = Math.min(width, 480);
  const shortScreen = height < 700;
  const heroWidth = Math.min(
    Math.round(frameWidth * (shortScreen ? 0.44 : 0.5)),
    shortScreen ? 188 : 216,
  );
  const titleSize = 20;
  const heroMinHeight = heroWidth / (heroAspect ?? 1);
  const ctaGap = width < 360 ? spacing.sm : spacing.md;
  const ctaPaddingHorizontal = width < 360 ? 0 : spacing.md;
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
      {Platform.OS === "web"
        ? React.createElement("style", {
            children: `#getting-started-cta:focus-visible{outline:3px solid ${colors.rose};outline-offset:3px}#getting-started-tip-icon img{filter:drop-shadow(100px 0 0 ${colors.wineFill});transform:translateX(-100px)}`,
          })
        : null}
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          flexGrow: 1,
          width: "100%",
          maxWidth: 480,
          alignSelf: "center",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
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
            {translate("onboarding.header")}
          </Text>
          <Pressable
            accessibilityHint={translate("onboarding.skipHint")}
            accessibilityLabel={translate("onboarding.skip")}
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
                color: colors.wine,
              }}
            >
              {translate("onboarding.skip")}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: spacing.md }}>
          <StepProgressBar
            activeColor={colors.wineFill}
            accessibilityLabel={gettingStartedProgressLabel(
              step,
              GETTING_STARTED_STAGE_TOTAL,
              translate,
            )}
            current={step}
            inactiveColor={colors.softRose}
            total={GETTING_STARTED_STAGE_TOTAL}
          />
        </View>

        <View style={{ alignItems: "center", marginTop: spacing.md }}>
          <View
            accessibilityLabel={gettingStartedStageChip(step, translate)}
            style={{
              minHeight: 32,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.xs,
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
              {gettingStartedStageChip(step, translate)}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexGrow: 1,
            minHeight: heroMinHeight,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing.sm,
          }}
        >
          {heroSource && heroAspect ? (
            <Animated.Image
              accessibilityIgnoresInvertColors
              accessibilityLabel={copy.heroAlt}
              resizeMode="contain"
              source={heroSource}
              style={{
                width: heroWidth,
                height: heroWidth / heroAspect,
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
            fontFamily: fonts.bold,
            fontSize: titleSize,
            lineHeight: Math.round(titleSize * 1.1),
            color: colors.ink,
            textAlign: "center",
          }}
        >
          {copy.title}
        </Text>
        <Text
          maxFontSizeMultiplier={1.3}
          style={{
            marginTop: spacing.sm,
            alignSelf: "center",
            maxWidth: 320,
            fontFamily: fonts.regular,
            fontSize: 16,
            lineHeight: 22,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          {copy.description}
        </Text>

        <View
          style={{
            marginTop: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            backgroundColor: "rgba(245, 229, 232, 0.78)",
            borderColor: "rgba(182, 95, 114, 0.3)",
            borderWidth: 1,
            borderRadius: radii.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
          }}
        >
          <Image
            accessibilityIgnoresInvertColors
            nativeID="getting-started-tip-icon"
            resizeMode="contain"
            source={STAGE_TIP_ICON[stage]}
            style={{
              width: STAGE_TIP_ICON_SIZE[stage],
              height: STAGE_TIP_ICON_SIZE[stage],
              tintColor: colors.wineFill,
            }}
          />
          <Text
            maxFontSizeMultiplier={1.3}
            style={{
              flex: 1,
              fontFamily: fonts.regular,
              fontSize: 16,
              lineHeight: 22,
              color: colors.ink,
            }}
          >
            {copy.info}
          </Text>
        </View>

        <View
          style={{
            marginTop: "auto",
            paddingTop: spacing.lg,
          }}
        >
          <View
            style={{
              borderRadius: radii.xl,
              backgroundColor: colors.wineFill,
              shadowColor: colors.wineFill,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 5,
              opacity: disabled || loading ? 0.5 : 1,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.action}
              accessibilityState={{ busy: loading, disabled: disabled || loading }}
              disabled={disabled || loading}
              nativeID="getting-started-cta"
              onPress={onContinue}
              style={(state) => ({
                minHeight: CTA_HEIGHT,
                borderRadius: radii.xl,
                borderWidth: 2,
                borderColor: colors.wineFill,
                overflow: "hidden",
                backgroundColor: colors.wineFill,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: ctaGap,
                paddingHorizontal: ctaPaddingHorizontal,
                paddingVertical: spacing.md,
                transform: [
                  {
                    scale: state.pressed && !reducedMotion ? 0.98 : 1,
                  },
                ],
              })}
            >
              {loading ? (
                <ActivityIndicator
                  accessibilityLabel={translate("onboarding.cta.loading")}
                  color={colors.onWine}
                />
              ) : (
                <>
                  <AppIcon
                    color={colors.onWine}
                    name="arrow-forward"
                    size={iconSizes.sm}
                  />
                  <Text
                    maxFontSizeMultiplier={1.4}
                    style={{
                      fontFamily: fonts.extraBold,
                      fontSize: 16,
                      lineHeight: 22,
                      color: colors.onWine,
                    }}
                  >
                    {copy.action}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
