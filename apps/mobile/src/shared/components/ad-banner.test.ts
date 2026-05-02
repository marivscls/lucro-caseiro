import { describe, expect, it } from "vitest";

import { AD_ITEM_MARKER, interleaveAds } from "./ad-banner";

describe("AD_ITEM_MARKER", () => {
  it("is a recognizable string constant", () => {
    expect(AD_ITEM_MARKER).toBe("__AD__");
    expect(typeof AD_ITEM_MARKER).toBe("string");
  });
});

describe("interleaveAds", () => {
  it("returns original list when fewer than 5 items", () => {
    const items = [1, 2, 3, 4];
    const result = interleaveAds(items);
    expect(result).toEqual([1, 2, 3, 4]);
    expect(result).not.toContain(AD_ITEM_MARKER);
  });

  it("returns original list when exactly 5 items (boundary)", () => {
    const items = [1, 2, 3, 4, 5];
    const result = interleaveAds(items);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns empty array for empty input", () => {
    const result = interleaveAds([]);
    expect(result).toEqual([]);
  });

  it("inserts 1 ad marker after 8 items", () => {
    const items = Array.from({ length: 9 }, (_, i) => i + 1);
    const result = interleaveAds(items);
    expect(result[8]).toBe(AD_ITEM_MARKER);
    expect(result.filter((x) => x === AD_ITEM_MARKER)).toHaveLength(1);
  });

  it("inserts 2 ad markers for 17+ items", () => {
    const items = Array.from({ length: 17 }, (_, i) => i + 1);
    const result = interleaveAds(items);
    const adCount = result.filter((x) => x === AD_ITEM_MARKER).length;
    expect(adCount).toBe(2);
  });

  it("does not insert ad at the very end of the list", () => {
    const items = Array.from({ length: 8 }, (_, i) => i + 1);
    const result = interleaveAds(items);
    expect(result[result.length - 1]).not.toBe(AD_ITEM_MARKER);
  });

  it("uses custom interval", () => {
    const items = Array.from({ length: 10 }, (_, i) => i + 1);
    const result = interleaveAds(items, 4);
    const adCount = result.filter((x) => x === AD_ITEM_MARKER).length;
    expect(adCount).toBe(2);
    expect(result[4]).toBe(AD_ITEM_MARKER);
    expect(result[9]).toBe(AD_ITEM_MARKER);
  });

  it("preserves original item order", () => {
    const items = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
    const result = interleaveAds(items);
    const withoutAds = result.filter((x) => x !== AD_ITEM_MARKER);
    expect(withoutAds).toEqual(items);
  });

  it("works with object items", () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ id: i }));
    const result = interleaveAds(items);
    expect(result[8]).toBe(AD_ITEM_MARKER);
    expect((result[0] as { id: number }).id).toBe(0);
  });
});
