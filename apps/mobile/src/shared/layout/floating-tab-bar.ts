import { spacing } from "@lucro-caseiro/ui";
import { Dimensions, Platform } from "react-native";

export const FLOATING_TAB_BAR_HEIGHT = Platform.select({
  ios: 80,
  web: 64,
  default: 68,
});

/** Leave room for wrapped navigation labels when system text is enlarged. */
export function floatingTabBarHeight(
  fontScale = Dimensions.get("window").fontScale ?? 1,
): number {
  if (fontScale <= 1.15) return FLOATING_TAB_BAR_HEIGHT;
  const safePadding = Platform.OS === "ios" ? spacing["2xl"] : spacing.sm;
  return Math.max(
    FLOATING_TAB_BAR_HEIGHT,
    Math.ceil(22 + 2 + 3 * 16 * fontScale + spacing.sm + safePadding + 4),
  );
}

export function floatingTabBarBottomOffset(bottomInset: number): number {
  return Platform.OS === "android" ? bottomInset + spacing.sm : spacing.xs;
}

export function floatingTabBarReserve(bottomInset: number, fontScale?: number): number {
  return floatingTabBarHeight(fontScale) + floatingTabBarBottomOffset(bottomInset);
}

export function floatingTabBarContentPadding(bottomInset: number): number {
  return floatingTabBarReserve(bottomInset) + spacing.xl;
}

/** Android needs the system inset in the bar offset; iOS/web bake it into height. */
export function mobileTabBarSafeInset(bottomSafeArea: number): number {
  return Platform.OS === "android" ? bottomSafeArea : 0;
}

/**
 * Gap between the sticky list CTA and the floating tab bar, keeping
 * the two action surfaces visually separated.
 */
export const SCREEN_CREATE_BAR_NAV_GAP = spacing.lg;

/**
 * Padding below the sticky list CTA. Stack screens already reserve the tab bar
 * in the root layout; tab screens still need that reserve here. Both get a
 * visual gap so the button does not sit flush against the floating bar.
 */
export function screenCreateBarBottomPadding(options: {
  readonly isDesktop: boolean;
  readonly isTabScreen: boolean;
  readonly bottomInset: number;
}): number {
  if (options.isDesktop) return spacing.md;
  if (options.isTabScreen) {
    return (
      floatingTabBarReserve(mobileTabBarSafeInset(options.bottomInset)) +
      SCREEN_CREATE_BAR_NAV_GAP
    );
  }
  return SCREEN_CREATE_BAR_NAV_GAP;
}
