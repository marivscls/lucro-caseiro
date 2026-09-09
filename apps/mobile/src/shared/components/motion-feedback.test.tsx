import React, { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock("react-native", () =>
  vi.importActual<typeof import("react-native")>("react-native-web"),
);
vi.mock("@lucro-caseiro/ui", async () => {
  const tokens = await import("../../../../../packages/ui/src/theme");
  return {
    ...tokens,
    useReducedMotion: () => preference.reduced,
    useTheme: () => ({ theme: tokens.darkTheme }),
  };
});
vi.mock("./app-icon", () => ({ AppIcon: () => null }));

import { AnimatedDisclosure, ContentTransition, QuantityPulse } from "./motion-feedback";

describe("motion preserves interaction state", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    preference.reduced = false;
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("removes collapsed controls from accessibility immediately, then unmounts them", async () => {
    const view = render(
      <AnimatedDisclosure open>
        <button>Editar taxa</button>
      </AnimatedDisclosure>,
    );
    view.rerender(
      <AnimatedDisclosure open={false}>
        <button>Editar taxa</button>
      </AnimatedDisclosure>,
    );
    expect(screen.queryByRole("button", { name: "Editar taxa" })).toBeNull();
    await act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByText("Editar taxa")).toBeNull();
  });

  it("cancels a pending close when the section is reopened quickly", async () => {
    const view = render(
      <AnimatedDisclosure open>
        <button>Editar taxa</button>
      </AnimatedDisclosure>,
    );
    view.rerender(
      <AnimatedDisclosure open={false}>
        <button>Editar taxa</button>
      </AnimatedDisclosure>,
    );
    await act(() => vi.advanceTimersByTime(60));
    view.rerender(
      <AnimatedDisclosure open>
        <button>Editar taxa</button>
      </AnimatedDisclosure>,
    );
    await act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("button", { name: "Editar taxa" })).toBeTruthy();
  });

  it("collapses immediately with reduced motion", () => {
    preference.reduced = true;
    const view = render(
      <AnimatedDisclosure open>
        <button>Editar taxa</button>
      </AnimatedDisclosure>,
    );
    view.rerender(
      <AnimatedDisclosure open={false}>
        <button>Editar taxa</button>
      </AnimatedDisclosure>,
    );
    expect(screen.queryByText("Editar taxa")).toBeNull();
  });

  it("preserves input state when a transition is triggered or its content updates", async () => {
    function Draft() {
      const [value, setValue] = useState("");
      return (
        <input
          aria-label="Rascunho"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }
    const view = render(
      <ContentTransition transitionKey={0} distance={20}>
        <Draft />
      </ContentTransition>,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Minha loja" } });
    view.rerender(
      <ContentTransition transitionKey={1} distance={20}>
        <Draft />
      </ContentTransition>,
    );
    await act(() => vi.advanceTimersByTime(300));
    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("Minha loja");
    view.rerender(
      <ContentTransition transitionKey={0} distance={20}>
        <Draft />
      </ContentTransition>,
    );
    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("Minha loja");
  });

  it("shows the current quantity immediately across rapid additions", async () => {
    const view = render(
      <QuantityPulse value={0}>
        <span>0</span>
      </QuantityPulse>,
    );
    view.rerender(
      <QuantityPulse value={1}>
        <span>1</span>
      </QuantityPulse>,
    );
    view.rerender(
      <QuantityPulse value={2}>
        <span>2</span>
      </QuantityPulse>,
    );
    expect(screen.getByText("2")).toBeTruthy();
    await act(() => vi.advanceTimersByTime(300));
    expect(screen.getByText("2")).toBeTruthy();
  });
});
