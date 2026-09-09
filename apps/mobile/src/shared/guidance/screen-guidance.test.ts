import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock("react-native", () => {
  const Container = ({ children }: { children?: React.ReactNode }) => children;
  return {
    View: Container,
    ScrollView: Container,
    Platform: { OS: "web" },
    Pressable: ({
      children,
      onPress,
      accessibilityLabel,
    }: {
      children: React.ReactNode;
      onPress: () => void;
      accessibilityLabel?: string;
    }) =>
      React.createElement(
        "button",
        { onClick: onPress, "aria-label": accessibilityLabel },
        children,
      ),
    Animated: {
      View: Container,
      Value: class {
        constructor(public value: number) {}
        setValue(value: number) {
          this.value = value;
        }
      },
      timing: (
        value: { setValue: (next: number) => void },
        config: { toValue: number; duration: number },
      ) => {
        let timer: ReturnType<typeof setTimeout>;
        return {
          start: (done?: (result: { finished: boolean }) => void) => {
            timer = setTimeout(() => {
              value.setValue(config.toValue);
              done?.({ finished: true });
            }, config.duration);
          },
          stop: () => clearTimeout(timer),
        };
      },
    },
  };
});
vi.mock("@lucro-caseiro/ui", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useReducedMotion: () => motion.reduced,
  Button: ({
    title,
    onPress,
    size,
  }: {
    title: string;
    onPress: () => void;
    size?: string;
  }) => React.createElement("button", { onClick: onPress, "data-size": size }, title),
}));
vi.mock("../layout/use-desktop-layout", () => ({ useDesktopLayout: () => false }));
vi.mock("../hooks/use-auth", () => ({
  useAuth: (selector: (state: { userId: string }) => unknown) =>
    selector({ userId: "guidance-user" }),
}));
vi.mock("./guidance-events", () => ({ guidanceEvent: () => {} }));
vi.mock("../components/standard-modal", () => ({ StandardModal: () => null }));
vi.mock("../utils/async-storage", () => ({
  asyncStorage: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
  },
}));

import { ScreenGuidance } from "./screen-guidance";
import { useGuidanceStore } from "./guidance-store";

describe("ScreenGuidance dismissal", () => {
  beforeEach(() => {
    motion.reduced = false;
    vi.useFakeTimers();
    useGuidanceStore.setState({ accounts: {}, ready: { "guidance-user": true } });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function setup() {
    const onStart = vi.fn();
    const secondary = { label: "Ver exemplo", onPress: vi.fn() };
    render(React.createElement(ScreenGuidance, { area: "clients", onStart, secondary }));
    return { onStart, secondary };
  }

  it("keeps the card present during the exit fade, then preserves the help entry", async () => {
    setup();
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    expect(screen.getByRole("button", { name: "Agora não" })).toBeTruthy();
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(screen.queryByRole("button", { name: "Agora não" })).toBeNull();
    expect(screen.getByRole("button", { name: /Como usar:/ })).toBeTruthy();
    expect(useGuidanceStore.getState().accounts["guidance-user"].clients?.dismissed).toBe(
      true,
    );
  });

  it("dismisses immediately when reduced motion is requested", () => {
    motion.reduced = true;
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    expect(screen.queryByRole("button", { name: "Agora não" })).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the secondary action usable without presenting a second large CTA", () => {
    const { secondary } = setup();
    expect(
      screen
        .getAllByRole("button")
        .filter((button) => button.getAttribute("data-size") === "lg"),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Ver exemplo" }));
    expect(secondary.onPress).toHaveBeenCalledOnce();
  });
});
