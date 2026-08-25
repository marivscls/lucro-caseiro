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

export function floatingTabBarReserve(bottomInset: number): number {
  return FLOATING_TAB_BAR_HEIGHT + floatingTabBarBottomOffset(bottomInset);
}

export function floatingTabBarContentPadding(bottomInset: number): number {
  return floatingTabBarReserve(bottomInset) + spacing.xl;
}

/** Android needs the system inset in the bar offset; iOS/web bake it into height. */
export function mobileTabBarSafeInset(bottomSafeArea: number): number {
  return Platform.OS === "android" ? bottomSafeArea : 0;
}
