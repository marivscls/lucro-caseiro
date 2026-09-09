import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock("react-native", () =>
  vi.importActual<typeof import("react-native")>("react-native-web"),
);
vi.mock("react-native-svg", () => ({
  default: () => null,
  Defs: () => null,
  RadialGradient: () => null,
  LinearGradient: () => null,
  Stop: () => null,
  Rect: () => null,
}));
vi.mock("@lucro-caseiro/ui", async () => {
  const tokens = await import("../../../../../packages/ui/src/theme");
  return {
    ...tokens,
    useTheme: () => ({ theme: tokens.darkTheme }),
    useBrand: () => ({ id: "lucro-caseiro", appName: "Lucro Caseiro" }),
    useReducedMotion: () => preference.reduced,
  };
});

import { BrandIntro } from "./brand-intro";

describe("BrandIntro readiness", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    preference.reduced = false;
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("waits for the session even after the entrance has finished", async () => {
    const onFinish = vi.fn();
    const view = render(<BrandIntro authReady={false} onFinish={onFinish} />);
    await act(() => vi.advanceTimersByTime(5000));
    expect(onFinish).not.toHaveBeenCalled();
    view.rerender(<BrandIntro authReady onFinish={onFinish} />);
    await act(() => vi.advanceTimersByTime(1000));
    expect(onFinish).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTime(5000));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("skips the decorative delay when reduced motion is enabled", async () => {
    preference.reduced = true;
    const onFinish = vi.fn();
    render(<BrandIntro authReady onFinish={onFinish} />);
    await act(() => vi.advanceTimersByTime(200));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("cancels completion if unmounted during the exit", async () => {
    const onFinish = vi.fn();
    const view = render(<BrandIntro authReady={false} onFinish={onFinish} />);
    await act(() => vi.advanceTimersByTime(5000));
    view.rerender(<BrandIntro authReady onFinish={onFinish} />);
    view.unmount();
    await act(() => vi.advanceTimersByTime(5000));
    expect(onFinish).not.toHaveBeenCalled();
  });
});
