import { describe, expect, it } from "vitest";

import { itemsForEditorialDay, pedalIntentClass } from "./calendar-week";

describe("calendar week", () => {
  it("keeps every post in its selected week and weekday", () => {
    const resources = [
      { id: "monday", title: "Segunda", data: { week: 2, weekday: 1 } },
      { id: "also-monday", title: "Outra", data: { week: 2, weekday: 1 } },
      { id: "tuesday", title: "Terça", data: { week: 2, weekday: 2 } },
    ] as never;

    expect(itemsForEditorialDay(resources, 2, 1).map((item) => item.id)).toEqual([
      "also-monday",
      "monday",
    ]);
  });

  it("accepts the Portuguese PEDAL labels stored by the brief editor", () => {
    expect(pedalIntentClass("Promoção")).toBe("promotion");
    expect(pedalIntentClass("Ligação")).toBe("connection");
  });
});
