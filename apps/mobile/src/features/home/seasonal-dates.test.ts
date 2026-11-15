import { describe, expect, it } from "vitest";

import {
  CHRISTMAS_LEAD_DAYS,
  SEASONAL_LEAD_DAYS,
  blackFriday,
  easterSunday,
  nextSeasonalDate,
  nthWeekdayOfMonth,
  parseDismissedSeasonalKeys,
  seasonalDatesInWindow,
  seasonalDatesOf,
  seasonalTitle,
} from "./seasonal-dates";

const day = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const at = (year: number, month: number, dayOfMonth: number, hour = 9) =>
  new Date(year, month - 1, dayOfMonth, hour);

describe("easterSunday", () => {
  it.each([
    [2019, "2019-04-21"],
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2028, "2028-04-16"],
    [2038, "2038-04-25"],
  ])("returns Easter Sunday of %i", (year, expected) => {
    // Act
    const result = easterSunday(year);

    // Assert
    expect(day(result)).toBe(expected);
    expect(result.getDay()).toBe(0);
  });
});

describe("blackFriday", () => {
  it.each([
    [2024, "2024-11-29"],
    [2025, "2025-11-28"],
    [2026, "2026-11-27"],
    [2027, "2027-11-26"],
    [2028, "2028-11-24"],
  ])("is the Friday after the 4th Thursday of November in %i", (year, expected) => {
    // Act
    const result = blackFriday(year);

    // Assert
    expect(day(result)).toBe(expected);
    expect(result.getDay()).toBe(5);
  });
});

describe("nthWeekdayOfMonth and the yearly list", () => {
  it("finds the 2nd Sunday of May (Mães) and of August (Pais)", () => {
    // Act
    const mothers2026 = nthWeekdayOfMonth(2026, 4, 0, 2);
    const fathers2026 = nthWeekdayOfMonth(2026, 7, 0, 2);
    const mothers2025 = nthWeekdayOfMonth(2025, 4, 0, 2);
    const fathers2025 = nthWeekdayOfMonth(2025, 7, 0, 2);

    // Assert
    expect(day(mothers2026)).toBe("2026-05-10");
    expect(day(fathers2026)).toBe("2026-08-09");
    expect(day(mothers2025)).toBe("2025-05-11");
    expect(day(fathers2025)).toBe("2025-08-10");
  });

  it("lists the eight dates of the year in calendar order", () => {
    // Act
    const list = seasonalDatesOf(2026).map((item) => `${item.id} ${day(item.date)}`);

    // Assert
    expect(list).toEqual([
      "pascoa 2026-04-05",
      "maes 2026-05-10",
      "namorados 2026-06-12",
      "pais 2026-08-09",
      "cliente 2026-09-15",
      "criancas 2026-10-12",
      "black-friday 2026-11-27",
      "natal 2026-12-25",
    ]);
  });
});

describe("nextSeasonalDate", () => {
  it("picks Black Friday over Natal on 2026-11-15 (both in the window)", () => {
    // Arrange
    const now = at(2026, 11, 15);

    // Act
    const inWindow = seasonalDatesInWindow(now).map((item) => item.key);
    const next = nextSeasonalDate(now);

    // Assert
    expect(inWindow).toEqual(["black-friday-2026", "natal-2026"]);
    expect(next?.key).toBe("black-friday-2026");
    expect(next?.daysLeft).toBe(12);
    expect(seasonalTitle(next!)).toBe("Faltam 12 dias para a Black Friday");
  });

  it("falls through to Natal when Black Friday was dismissed", () => {
    // Act
    const next = nextSeasonalDate(at(2026, 11, 15), ["black-friday-2026"]);

    // Assert
    expect(next?.key).toBe("natal-2026");
    expect(next?.daysLeft).toBe(40);
    expect(seasonalTitle(next!)).toBe("Faltam 40 dias para o Natal");
  });

  it("returns null when every date in the window was dismissed", () => {
    // Act
    const next = nextSeasonalDate(at(2026, 11, 15), ["black-friday-2026", "natal-2026"]);

    // Assert
    expect(next).toBeNull();
  });

  it("opens the window exactly 30 days before and not 31", () => {
    // Arrange: Dia dos Namorados 12/06/2026.
    const first = at(2026, 5, 13);
    const before = at(2026, 5, 12);

    // Act
    const shown = nextSeasonalDate(first);
    const hidden = nextSeasonalDate(before);

    // Assert
    expect(shown?.id).toBe("namorados");
    expect(shown?.daysLeft).toBe(SEASONAL_LEAD_DAYS);
    expect(hidden).toBeNull();
  });

  it("opens Natal 45 days before", () => {
    // Act
    const first = seasonalDatesInWindow(at(2026, 11, 10)).map((item) => item.id);
    const before = seasonalDatesInWindow(at(2026, 11, 9)).map((item) => item.id);

    // Assert
    expect(first).toContain("natal");
    expect(before).not.toContain("natal");
    expect(CHRISTMAS_LEAD_DAYS).toBe(45);
  });

  it("shows the date on the day itself, late at night, and hides it the day after", () => {
    // Act
    const sameDay = nextSeasonalDate(at(2026, 12, 25, 23));
    const dayAfter = nextSeasonalDate(at(2026, 12, 26, 0));

    // Assert
    expect(sameDay?.key).toBe("natal-2026");
    expect(sameDay?.daysLeft).toBe(0);
    expect(seasonalTitle(sameDay!)).toBe("Hoje é Natal!");
    expect(dayAfter).toBeNull();
  });

  it("looks into next year (Páscoa 2027) at the start of the year", () => {
    // Act
    const next = nextSeasonalDate(at(2027, 3, 1));

    // Assert
    expect(next?.key).toBe("pascoa-2027");
    expect(next?.daysLeft).toBe(27);
  });

  it("says 'Falta 1 dia' in the singular", () => {
    // Act
    const next = nextSeasonalDate(at(2026, 10, 11));

    // Assert
    expect(seasonalTitle(next!)).toBe("Falta 1 dia para o Dia das Crianças");
  });

  it("returns null in a quiet stretch (early January)", () => {
    // Act / Assert
    expect(nextSeasonalDate(at(2027, 1, 10))).toBeNull();
  });
});

describe("parseDismissedSeasonalKeys", () => {
  it("keeps valid keys from this and last year and drops older ones", () => {
    // Arrange
    const raw = JSON.stringify(["natal-2024", "natal-2025", "black-friday-2026", 7]);

    // Act
    const keys = parseDismissedSeasonalKeys(raw, at(2026, 11, 15));

    // Assert
    expect(keys).toEqual(["natal-2025", "black-friday-2026"]);
  });

  it("treats missing or broken values as an empty list", () => {
    // Act / Assert
    expect(parseDismissedSeasonalKeys(null, at(2026, 11, 15))).toEqual([]);
    expect(parseDismissedSeasonalKeys("{oops", at(2026, 11, 15))).toEqual([]);
    expect(parseDismissedSeasonalKeys('{"a":1}', at(2026, 11, 15))).toEqual([]);
  });
});
