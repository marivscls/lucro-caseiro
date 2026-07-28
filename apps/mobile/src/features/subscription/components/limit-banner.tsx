import {
  Card,
  Typography,
  fontSizes,
  fonts,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { getLimitResourceLabel, type LimitResource } from "../limit-copy";
import { useLimits, useProfile } from "../hooks";
import { getLimitBannerState } from "../limits";
import { businessCopyFor } from "../business-copy";

interface LimitBannerProps {
  readonly resource: LimitResource;
  readonly onUpgrade?: () => void;
  readonly containerStyle?: StyleProp<ViewStyle>;
}

export function LimitBanner({ resource, onUpgrade, containerStyle }: LimitBannerProps) {
  const { theme } = useTheme();
  const { data: limits } = useLimits();
  const { data: profile } = useProfile();
  const state = getLimitBannerState(limits, profile, resource);

  if (!state) return null;

  const experienceCopy = businessCopyFor(profile?.businessType);
  const resourceLabel = getLimitResourceLabel(resource, experienceCopy);
  const upgradePlan = resource === "suppliers" ? "Profissional" : "Essencial";
  let remainingLabel = "Limite atingido";
  if (state.remaining === 1) {
    remainingLabel = "1 restante";
  } else if (state.remaining > 1) {
    remainingLabel = `${state.remaining} restantes`;
  }

  return (
    <View style={containerStyle}>
      <Card
        padding="2xl"
        shadow="sm"
        style={{
          backgroundColor:
            theme.mode === "light" ? "#FFF9F1" : theme.colors.surfaceElevated,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          borderRadius: radii.xl,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing["2xl"],
        }}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primaryBg },
            ]}
          >
            <AppIcon
              name="diamond-outline"
              size={20}
              color={theme.colors.primaryStrong}
            />
          </View>
          <View style={styles.heading}>
            <Typography
              variant="caption"
              color={theme.colors.textSecondary}
              style={styles.eyebrow}
            >
              Plano gratuito
            </Typography>
            <Typography
              variant="bodyBold"
              color={theme.colors.text}
              style={styles.progressLabel}
            >
              {state.current} de {state.max} {resourceLabel}
            </Typography>
          </View>
        </View>

        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: state.max ?? undefined,
            now: Math.min(state.current, state.max ?? state.current),
          }}
          style={[
            styles.progressTrack,
            { backgroundColor: theme.colors.primaryBg },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${state.percentage}%`,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.footer}>
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={styles.remainingLabel}
          >
            {remainingLabel}
          </Typography>

          {onUpgrade ? (
            <Pressable
              onPress={onUpgrade}
              accessibilityRole="button"
              accessibilityLabel={`Conhecer o plano ${upgradePlan}`}
              hitSlop={8}
              style={({ pressed }) => [
                styles.cta,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Typography
                variant="bodyBold"
                color={theme.colors.primaryStrong}
                style={styles.ctaLabel}
              >
                Conhecer {upgradePlan}
              </Typography>
              <AppIcon
                name="arrow-forward"
                size={16}
                color={theme.colors.primaryStrong}
              />
            </Pressable>
          ) : null}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  progressLabel: {
    fontSize: fontSizes.md,
    lineHeight: 22,
    fontFamily: fonts.bold,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    marginTop: spacing.md,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radii.full,
  },
  footer: {
    minHeight: 20,
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  remainingLabel: {
    flex: 1,
    fontSize: fontSizes.sm,
  },
  cta: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.xs,
  },
  ctaLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bold,
  },
});
