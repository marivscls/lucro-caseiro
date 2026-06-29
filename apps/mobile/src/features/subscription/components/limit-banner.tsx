import { Card, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { getBannerCopy, type LimitResource } from "../limit-copy";
import { useLimits, useProfile } from "../hooks";
import { getLimitBannerState } from "../limits";

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

  const { title, body } = getBannerCopy(resource, state.remaining);
  const bannerBg = state.isAtLimit ? theme.colors.alertBg : theme.colors.premiumBg;
  const bannerAccent = state.isAtLimit ? theme.colors.alert : theme.colors.premium;

  return (
    <Pressable onPress={onUpgrade} style={containerStyle}>
      <Card style={{ backgroundColor: bannerBg }}>
        <View style={{ gap: 6 }}>
          <Typography variant="h3" color={bannerAccent}>
            {title}
          </Typography>
          <Typography variant="body" color={bannerAccent}>
            {body}
          </Typography>

          <View
            style={{
              height: 6,
              backgroundColor: theme.colors.surface,
              borderRadius: 3,
              marginTop: 4,
            }}
          >
            <View
              style={{
                height: 6,
                width: `${state.percentage}%`,
                backgroundColor: bannerAccent,
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
