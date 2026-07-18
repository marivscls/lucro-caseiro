import { describe, expect, it } from "vitest";

import {
  DESKTOP_BREAKPOINT,
  DESKTOP_MEDIA_QUERY,
  isDesktopViewport,
} from "./use-desktop-layout";

describe("isDesktopViewport", () => {
  it("mantém a experiência mobile quando a media query não corresponde", () => {
    expect(isDesktopViewport("web", false)).toBe(false);
  });

  it("ativa o layout desktop somente quando a viewport CSS web corresponde", () => {
    expect(isDesktopViewport("web", true)).toBe(true);
    expect(isDesktopViewport("ios", true)).toBe(false);
    expect(isDesktopViewport("android", true)).toBe(false);
  });

  it("mantém o breakpoint canônico na media query", () => {
    expect(DESKTOP_MEDIA_QUERY).toBe(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
  });
});
