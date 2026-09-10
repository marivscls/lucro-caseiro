import React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
      ref,
    }: {
      children: React.ReactNode;
      onPress: () => void;
      accessibilityLabel?: string;
      ref?: React.Ref<HTMLButtonElement>;
    }) =>
      React.createElement(
        "button",
        { onClick: onPress, "aria-label": accessibilityLabel, ref },
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
vi.mock("../components/standard-modal", () => ({
  StandardModal: ({
    visible,
    title,
    onClose,
    children,
    footer,
  }: {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer: React.ReactNode;
  }) =>
    visible
      ? React.createElement(
          "div",
          { role: "dialog", "aria-label": title },
          children,
          footer,
          React.createElement("button", { onClick: onClose }, "Fechar"),
        )
      : null,
}));
vi.mock("../utils/async-storage", () => ({
  asyncStorage: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
  },
}));

import { ScreenGuidance } from "./screen-guidance";
import { useGuidanceStore } from "./guidance-store";

const renderHeader = (help: React.ReactNode) =>
  React.createElement("header", null, "Clientes", help);

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
    render(
      React.createElement(ScreenGuidance, {
        area: "clients",
        onStart,
        secondary,
        renderHeader,
      }),
    );
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
    expect(
      within(screen.getByRole("banner")).getByRole("button", {
        name: "Ajuda com clientes",
      }),
    ).toBeTruthy();
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

  it("opens contextual help from the header after records exist and starts the task", () => {
    const onStart = vi.fn();
    render(
      React.createElement(ScreenGuidance, {
        area: "clients",
        onStart,
        hasRecords: true,
        renderHeader,
      }),
    );
    expect(screen.queryByText("Como usar")).toBeNull();
    expect(screen.queryByRole("button", { name: "Agora não" })).toBeNull();
    fireEvent.click(
      within(screen.getByRole("banner")).getByRole("button", {
        name: "Ajuda com clientes",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Ajuda com clientes" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cadastrar cliente" }));
    expect(onStart).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the header visible when help is suspended", () => {
    render(
      React.createElement(ScreenGuidance, {
        area: "clients",
        onStart: vi.fn(),
        suspended: true,
        renderHeader,
      }),
    );
    expect(screen.getByRole("banner").textContent).toBe("Clientes");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("returns keyboard focus to help when the panel closes", async () => {
    render(
      React.createElement(ScreenGuidance, {
        area: "clients",
        onStart: vi.fn(),
        hasRecords: true,
        renderHeader,
      }),
    );
    const help = screen.getByRole("button", { name: "Ajuda com clientes" });
    fireEvent.click(help);
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(help);
  });
});
