import type { ModalProps, ViewStyle } from "react-native";

export const desktopWidths = {
  compact: 360,
  standard: 720,
  wide: 960,
  form: 1040,
  data: 1280,
} as const;

export function desktopContained(
  isDesktop: boolean,
  maxWidth: number = desktopWidths.form,
): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return { alignSelf: "center", maxWidth, width: "100%" };
}

export function desktopAction(isDesktop: boolean, width = 220): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return { alignSelf: "flex-end", minHeight: 44, width };
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
