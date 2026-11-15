import { describe, expect, it } from "vitest";

import { EVENING_DAYS_AHEAD, eveningSchedule } from "./evening-summary";

describe("eveningSchedule", () => {
  it("puts today's sales in today's 19h summary and plain nudges after it", () => {
    // Arrange
    const now = new Date(2026, 10, 15, 10, 0);
    // Act
    const slots = eveningSchedule(now, { count: 2, total: 80 });
    // Assert
    expect(slots).toHaveLength(EVENING_DAYS_AHEAD + 1);
    expect(slots[0].at).toEqual(new Date(2026, 10, 15, 19, 0));
    expect(slots[0].message.title).toMatch(/Hoje você vendeu R\$\s80,00/);
    expect(slots[0].message.body).toContain("2 vendas");
    expect(slots[1].at).toEqual(new Date(2026, 10, 16, 19, 0));
    expect(slots[1].message.body).toContain("ainda não anotou");
  });

  it("skips today once 19h has passed", () => {
    // Arrange
    const now = new Date(2026, 10, 15, 19, 30);
    // Act
    const slots = eveningSchedule(now, { count: 1, total: 10 });
    // Assert
    expect(slots).toHaveLength(EVENING_DAYS_AHEAD);
    expect(slots[0].id).toBe("evening-summary-1");
    expect(slots[0].message.body).toContain("ainda não anotou");
  });

  it("uses the singular for a single sale", () => {
    const slots = eveningSchedule(new Date(2026, 10, 15, 8, 0), {
      count: 1,
      total: 12.5,
    });
    expect(slots[0].message.body).toContain("Foi 1 venda hoje");
  });
});
