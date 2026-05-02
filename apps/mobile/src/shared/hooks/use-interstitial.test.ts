import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mockShowAds = vi.fn();

vi.mock("./use-show-ads", () => ({
  useShowAds: () => mockShowAds(),
}));

import { useInterstitial } from "./use-interstitial";

describe("useInterstitial", () => {
  beforeEach(() => {
    mockShowAds.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("show() does nothing when user is premium", () => {
    mockShowAds.mockReturnValue(false);
    const { result } = renderHook(() => useInterstitial());
    expect(() => result.current.show()).not.toThrow();
  });

  it("show() does not throw when SDK is not installed", () => {
    mockShowAds.mockReturnValue(true);
    const { result } = renderHook(() => useInterstitial());
    expect(() => result.current.show()).not.toThrow();
  });

  it("returns an object with show function", () => {
    mockShowAds.mockReturnValue(true);
    const { result } = renderHook(() => useInterstitial());
    expect(typeof result.current.show).toBe("function");
  });
});
