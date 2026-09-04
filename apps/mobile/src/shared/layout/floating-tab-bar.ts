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

/**
 * Gap between the sticky list CTA and the floating tab bar. The raised
 * "Nova venda" control sits ~12px above the pill; without this the CTA
 * sits flush against the navbar.
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
