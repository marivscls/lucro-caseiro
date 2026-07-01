import { describe, expect, it } from "vitest";

import { duplicateKey, phoneDuplicateKey } from "./duplicates";

describe("duplicate utils", () => {
  it("normalizes text keys without accents or case", () => {
    expect(duplicateKey("  ÁGUA de Coco  ")).toBe("agua de coco");
  });

  it("normalizes BR phones with or without country code", () => {
    expect(phoneDuplicateKey("(27) 99938-3888")).toBe("27999383888");
    expect(phoneDuplicateKey("+55 27 99938-3888")).toBe("27999383888");
  });
});
