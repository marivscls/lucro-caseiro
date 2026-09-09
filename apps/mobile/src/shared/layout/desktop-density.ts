import type { ModalProps, ViewStyle } from "react-native";

export const desktopWidths = {
  compact: 360,
  standard: 720,
  wide: 960,
  form: 1040,
  data: 1280,
} as const;

/** One desktop frame for navigation, page headings, content and actions. */
export const desktopLayout = {
  sidebarWidth: 240,
  pageGutter: 32,
  sectionGap: 24,
  headerHeight: 88,
  controlHeight: 44,
  asideMinWidth: 280,
  asideMaxWidth: 360,
} as const;

export const desktopHeaderStyle: ViewStyle = {
  width: "100%",
  minHeight: desktopLayout.headerHeight,
  paddingHorizontal: 0,
  paddingTop: 24,
  paddingBottom: 24,
  flexShrink: 0,
};

/** Usable page width after the desktop navigation and shell gutters. */
export function desktopContentWidth(viewportWidth: number): number {
  return Math.max(
    0,
    Math.min(
      desktopWidths.data,
      viewportWidth - desktopLayout.sidebarWidth - desktopLayout.pageGutter * 2,
    ),
  );
}

/** Mobile page gutter token (`spacing.xl` = 20). Kept local to avoid UI import cycles. */
const MOBILE_PAGE_GUTTER = 20;

/**
 * Page-level horizontal gutter. On desktop the shell already owns the 32px
 * edge; pages must not stack extra padding. On mobile, use the given token.
 */
export function pageGutter(
  isDesktop: boolean,
  mobile: number = MOBILE_PAGE_GUTTER,
): ViewStyle {
  return { paddingHorizontal: isDesktop ? 0 : mobile };
}

/**
 * Centered containment — prefer for modals / narrow reading cards only.
 * Full authenticated pages should use `desktopStretch` (pricing taste).
 */
export function desktopContained(
  isDesktop: boolean,
  maxWidth: number = desktopWidths.form,
): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return { alignSelf: "center", maxWidth, width: "100%" };
}

/**
 * Page content aligned with ScreenHeader: stretch left under the shell gutter,
 * capped at `maxWidth` (default data zone 1280). Canonical for authenticated pages.
 */
export function desktopStretch(
  isDesktop: boolean,
  maxWidth: number = desktopWidths.data,
): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return { alignSelf: "stretch", maxWidth, width: "100%" };
}

export function desktopAction(isDesktop: boolean, width = 220): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return { alignSelf: "flex-end", minHeight: 44, width };
}

/** Short money/qty/percent fields — never stretch across the form zone. */
export function desktopCompactField(isDesktop: boolean): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return { maxWidth: desktopWidths.compact, width: "100%" };
}

/**
 * Form + sticky aside layout for desktop web (label form / pricing pattern).
 * On mobile all styles are undefined so callers keep a single-column stack.
 */
export function desktopSplitLayout(isDesktop: boolean): {
  outer: ViewStyle | undefined;
  row: ViewStyle | undefined;
  main: ViewStyle | undefined;
  aside: ViewStyle | undefined;
} {
  if (!isDesktop) {
    return { outer: undefined, row: undefined, main: undefined, aside: undefined };
  }
  return {
    outer: desktopStretch(true, desktopWidths.data),
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: desktopLayout.sectionGap,
      width: "100%",
    },
    main: {
      flex: 1,
      minWidth: 0,
      gap: desktopLayout.sectionGap,
    },
    aside: {
      width: "30%",
      minWidth: desktopLayout.asideMinWidth,
      maxWidth: desktopLayout.asideMaxWidth,
      flexShrink: 0,
      // RN Web supports sticky for preview/estimate rails.
      position: "sticky" as ViewStyle["position"],
      top: desktopLayout.sectionGap,
      gap: 16,
    },
  };
}

export function desktopModalSurface(
  isDesktop: boolean,
  maxWidth: number = desktopWidths.standard,
): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return {
    alignSelf: "center",
    borderRadius: 24,
    maxWidth,
    overflow: "hidden",
    width: "100%",
  };
}

type ModalPresentation = Pick<
  ModalProps,
  "animationType" | "presentationStyle" | "transparent"
>;

export function responsiveModalPresentation(
  isDesktop: boolean,
  presentation: Readonly<ModalPresentation>,
): ModalPresentation {
  if (!isDesktop) return presentation;
  return {
    animationType: "fade",
    presentationStyle: "overFullScreen",
    transparent: true,
  };
}
