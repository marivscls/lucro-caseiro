import { describe, expect, it } from "vitest";

import {
  NEXT_STEP_MIN_COUNT,
  PAID_PREVIEWS,
  nextStepFor,
  parseDiscoveryProgress,
  trialChecklist,
} from "./domain";

describe("nextStepFor", () => {
  it("suggests recipes after a pricing is saved", () => {
    expect(nextStepFor("pricing_saved", 0, [])?.route).toBe("/recipes");
  });

  it("skips recipes when the brand has no recipe feature", () => {
    expect(nextStepFor("pricing_saved", 0, [], { recipesAvailable: false })).toBeNull();
  });

  it("suggests the catalog from the third product on", () => {
    expect(nextStepFor("product_created", NEXT_STEP_MIN_COUNT - 1, [])).toBeNull();
    expect(nextStepFor("product_created", NEXT_STEP_MIN_COUNT, [])?.id).toBe("catalog");
  });

  it("suggests reports from the third sale on", () => {
    expect(nextStepFor("sale_completed", 2, [])).toBeNull();
    expect(nextStepFor("sale_completed", 3, [])?.id).toBe("insights");
  });

  it("suggests recurring expenses after an expense", () => {
    expect(nextStepFor("expense_created", 1, [])?.route).toBe("/recurring-expenses");
  });

  it("never repeats a step already shown", () => {
    expect(nextStepFor("sale_completed", 10, ["insights"])).toBeNull();
  });
});

describe("trialChecklist", () => {
  it("marks recipes done when a recipe exists and the others when opened", () => {
    const items = trialChecklist({
      recipes: 1,
      opened: ["catalog"],
      recipesAvailable: true,
    });

    expect(items.map((item) => [item.id, item.done])).toEqual([
      ["catalog", true],
      ["recipes", true],
      ["insights", false],
    ]);
  });

  it("leaves recipes out when the brand has no recipe feature", () => {
    const items = trialChecklist({ recipes: 0, opened: [], recipesAvailable: false });

    expect(items.map((item) => item.id)).toEqual(["catalog", "insights"]);
  });
});

describe("parseDiscoveryProgress", () => {
  it("keeps only known values", () => {
    expect(
      parseDiscoveryProgress(
        JSON.stringify({
          seenSteps: ["catalog", "hack"],
          opened: ["insights", 3],
          checklistDismissed: "yes",
        }),
      ),
    ).toEqual({
      seenSteps: ["catalog"],
      opened: ["insights"],
      checklistDismissed: false,
    });
  });

  it("returns empty progress for broken data", () => {
    expect(parseDiscoveryProgress("{")).toEqual({
      seenSteps: [],
      opened: [],
      checklistDismissed: false,
    });
    expect(parseDiscoveryProgress(null).seenSteps).toEqual([]);
  });
});

describe("PAID_PREVIEWS", () => {
  it("gives every paid screen a title and example rows", () => {
    for (const preview of Object.values(PAID_PREVIEWS)) {
      expect(preview.title).toBeTruthy();
      expect(preview.rows.length).toBeGreaterThan(1);
      for (const row of preview.rows) {
        expect(row.amount !== undefined || row.value !== undefined).toBe(true);
      }
    }
  });
});
