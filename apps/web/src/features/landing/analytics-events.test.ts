import { describe, expect, it, vi } from "vitest";
import { createCalculatorTracking, describeCta } from "./analytics-events";

describe("landing funnel", () => {
  it("does not count the prefilled calculator or an invalid edit as a result", () => {
    const send = vi.fn();
    const tracker = createCalculatorTracking(send);
    tracker.result(true);
    expect(send).not.toHaveBeenCalled();
    tracker.edit();
    tracker.result(false);
    expect(send.mock.calls).toEqual([["calculator_first_edit"]]);
    tracker.result(true);
    tracker.edit();
    tracker.result(true);
    expect(send.mock.calls).toEqual([
      ["calculator_first_edit"],
      ["calculator_valid_result"],
    ]);
  });

  it("does not count restoring the example as the visitor's completed calculation", () => {
    const send = vi.fn();
    const tracker = createCalculatorTracking(send);
    tracker.edit();
    tracker.example();
    tracker.result(true);
    expect(send.mock.calls).toEqual([["calculator_first_edit"]]);
    tracker.edit();
    tracker.result(true);
    expect(send.mock.calls.at(-1)).toEqual(["calculator_valid_result"]);
  });

  it("identifies the platform and calculator handoff without collecting input values", () => {
    expect(describeCta("pwa_calculator_result")).toEqual({
      event: "start_web",
      placement: "calculator_result",
    });
    expect(describeCta("play_store_plan_essencial")).toEqual({
      event: "start_android",
      placement: "plan_essencial",
    });
    expect(describeCta("calculator_from_hero")).toEqual({
      event: "calculator_from_hero",
      placement: "calculator_from_hero",
    });
  });
});
