import React, { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock("react-native", () =>
  vi.importActual<typeof import("react-native")>("react-native-web"),
);
vi.mock("@lucro-caseiro/ui", () => ({
  useReducedMotion: () => preference.reduced,
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("./app-icon", () => ({ AppIcon: () => null }));

import { GoalProgress, SelectionCheck, SelectionUnderline } from "./feature-motion";

const colors = { color: "#9dca40", trackColor: "#222", textColor: "#111" };

describe("motion in shopping, goals and agenda", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    preference.reduced = false;
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("reports the actual goal immediately during rapid increases and corrections", async () => {
    const view = render(<GoalProgress value={20} {...colors} />);
    view.rerender(<GoalProgress value={80} {...colors} />);
    await act(() => vi.advanceTimersByTime(50));
    view.rerender(<GoalProgress value={35} {...colors} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("35");
    expect(screen.getByText("35%")).toBeTruthy();
    await act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("35");
  });

  it.each([
    [150, 100],
    [-20, 0],
    [Number.NaN, 0],
  ])("keeps goal %s within its track", (value, expected) => {
    render(<GoalProgress value={value} {...colors} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      String(expected),
    );
    expect(screen.getByText(`${expected}%`)).toBeTruthy();
  });

  it.each([false, true])(
    "keeps checkboxes responsive with reduced motion %s",
    async (reduced) => {
      preference.reduced = reduced;
      function Choice() {
        const [selected, setSelected] = useState(false);
        return (
          <button
            role="checkbox"
            aria-label="Farinha"
            aria-checked={selected}
            onClick={() => setSelected(!selected)}
          >
            <SelectionCheck
              selected={selected}
              color="#71203a"
              checkColor="#fff"
              borderColor="#999"
            />
            <SelectionUnderline selected={selected} color="#71203a" />
          </button>
        );
      }
      render(<Choice />);
      const checkbox = screen.getByRole("checkbox", { name: "Farinha" });
      fireEvent.click(checkbox);
      expect(checkbox.getAttribute("aria-checked")).toBe("true");
      fireEvent.click(checkbox);
      expect(checkbox.getAttribute("aria-checked")).toBe("false");
      await act(() => vi.advanceTimersByTime(500));
      expect(checkbox.getAttribute("aria-checked")).toBe("false");
      expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    },
  );
});
