import { useSyncExternalStore } from "react";
import { Platform } from "react-native";

export const DESKTOP_BREAKPOINT = 1024;
export const DESKTOP_MEDIA_QUERY = `(min-width: ${DESKTOP_BREAKPOINT}px)`;

export function isDesktopViewport(platform: string, mediaQueryMatches: boolean): boolean {
  return platform === "web" && mediaQueryMatches;
}

function getDesktopSnapshot(): boolean {
  if (
    Platform.OS !== "web" ||
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function subscribeToDesktopViewport(onChange: () => void): () => void {
  if (
    Platform.OS !== "web" ||
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

export function useDesktopLayout(): boolean {
  const mediaQueryMatches = useSyncExternalStore(
    subscribeToDesktopViewport,
    getDesktopSnapshot,
    () => false,
  );

  return isDesktopViewport(Platform.OS, mediaQueryMatches);
}
