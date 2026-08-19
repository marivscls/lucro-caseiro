import { spacing } from "@lucro-caseiro/ui";
import { Platform } from "react-native";

export const FLOATING_TAB_BAR_HEIGHT = Platform.select({
  ios: 88,
  web: 72,
  default: 76,
});

export function floatingTabBarBottomOffset(bottomInset: number): number {
  return Platform.OS === "android" ? bottomInset + spacing.sm : spacing.xs;
}

export function floatingTabBarContentPadding(bottomInset: number): number {
  return FLOATING_TAB_BAR_HEIGHT + floatingTabBarBottomOffset(bottomInset) + spacing.xl;
}
